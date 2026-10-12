// Supabase Edge Function: notifications
// Запускается по cron каждую минуту через Supabase Cron.
// Выполняет 4 задачи:
//   1. Напоминание за день (reminder_day_sent_at)
//   2. Напоминание за 30 минут (reminder_30m_sent_at)
//   3. Авто-завершение прошедших записей (auto_completed_at)
//   4. Запрос отзыва через 2 часа после завершения (review_requested_at)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://barbershop.vercel.app'

// Задержка перед запросом отзыва (в минутах)
const REVIEW_DELAY_MIN = 120

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ─── Telegram helper ────────────────────────────────────────────────────────

async function sendTelegram(chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error(`sendTelegram failed for chat ${chatId}:`, err)
  }
}

function formatDateTime(dt: string): { date: string; time: string } {
  const d = new Date(dt)
  const date = d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
  const time = d.toLocaleTimeString('ru-RU', {
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  })
  return { date, time }
}

// ─── 1. Напоминание за день ─────────────────────────────────────────────────

async function sendDayReminders() {
  const now = new Date()
  // Ищем записи, которые начинаются через 20–26 часов (окно 6 часов для cron)
  // и у которых ещё не отправлено напоминание за день
  const from = new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString()
  const to = new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id, starts_at, manage_token,
      client:clients(name, telegram_chat_id),
      barber:barbers(name),
      services:booking_services(name, duration_min)
    `)
    .eq('status', 'confirmed')
    .is('reminder_day_sent_at', null)
    .gte('starts_at', from)
    .lte('starts_at', to)

  if (error) {
    console.error('Day reminders query error:', error)
    return
  }

  console.log(`Day reminders: found ${bookings?.length ?? 0} bookings`)

  for (const booking of bookings ?? []) {
    const client = booking.client as any
    if (!client?.telegram_chat_id) continue

    const { date, time } = formatDateTime(booking.starts_at)
    const barber = (booking.barber as any)?.name ?? 'Барбер'
    const manageUrl = `${APP_URL}/booking/${booking.manage_token}`

    const text =
      `⏰ <b>Напоминание о записи завтра!</b>\n\n` +
      `📅 <b>${date}</b> в <b>${time}</b>\n` +
      `✂️ Барбер: <b>${barber}</b>\n\n` +
      `🔗 <a href="${manageUrl}">Управление записью</a>`

    await sendTelegram(client.telegram_chat_id, text)

    // Записываем время отправки (идемпотентность)
    await supabase
      .from('bookings')
      .update({ reminder_day_sent_at: new Date().toISOString() })
      .eq('id', booking.id)
      .is('reminder_day_sent_at', null) // двойная защита

    console.log(`Day reminder sent for booking ${booking.id}`)
  }
}

// ─── 2. Напоминание за 30 минут ─────────────────────────────────────────────

async function send30MinReminders() {
  const now = new Date()
  // Записи, которые начинаются через 25–35 минут
  const from = new Date(now.getTime() + 25 * 60 * 1000).toISOString()
  const to = new Date(now.getTime() + 35 * 60 * 1000).toISOString()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id, starts_at, manage_token,
      client:clients(name, telegram_chat_id),
      barber:barbers(name)
    `)
    .eq('status', 'confirmed')
    .is('reminder_30m_sent_at', null)
    .gte('starts_at', from)
    .lte('starts_at', to)

  if (error) {
    console.error('30min reminders query error:', error)
    return
  }

  console.log(`30min reminders: found ${bookings?.length ?? 0} bookings`)

  for (const booking of bookings ?? []) {
    const client = booking.client as any
    if (!client?.telegram_chat_id) continue

    const { date, time } = formatDateTime(booking.starts_at)
    const barber = (booking.barber as any)?.name ?? 'Барбер'
    const manageUrl = `${APP_URL}/booking/${booking.manage_token}`

    const text =
      `🔔 <b>Через 30 минут ваша запись!</b>\n\n` +
      `📅 <b>${date}</b> в <b>${time}</b>\n` +
      `✂️ Барбер: <b>${barber}</b>\n\n` +
      `Ждём вас! 💈\n` +
      `🔗 <a href="${manageUrl}">Отменить</a>`

    await sendTelegram(client.telegram_chat_id, text)

    await supabase
      .from('bookings')
      .update({ reminder_30m_sent_at: new Date().toISOString() })
      .eq('id', booking.id)
      .is('reminder_30m_sent_at', null)

    console.log(`30min reminder sent for booking ${booking.id}`)
  }
}

// ─── 3. Авто-завершение прошедших записей ────────────────────────────────────

async function autoCompleteBookings() {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'completed',
      auto_completed_at: now,
    })
    .eq('status', 'confirmed')
    .is('auto_completed_at', null)
    .lt('ends_at', now)
    .select('id')

  if (error) {
    console.error('Auto-complete error:', error)
    return
  }

  if (data?.length) {
    console.log(`Auto-completed ${data.length} bookings:`, data.map((b: any) => b.id))
  }
}

// ─── 4. Запрос отзыва ────────────────────────────────────────────────────────

async function sendReviewRequests() {
  const now = new Date()
  // Записи, завершённые более REVIEW_DELAY_MIN минут назад, у которых ещё нет запроса отзыва
  const completedBefore = new Date(now.getTime() - REVIEW_DELAY_MIN * 60 * 1000).toISOString()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id, manage_token, barber_id,
      client:clients(name, telegram_chat_id),
      barber:barbers(name)
    `)
    .eq('status', 'completed')
    .is('review_requested_at', null)
    .lt('ends_at', completedBefore)

  if (error) {
    console.error('Review requests query error:', error)
    return
  }

  console.log(`Review requests: found ${bookings?.length ?? 0} bookings`)

  for (const booking of bookings ?? []) {
    const client = booking.client as any
    if (!client?.telegram_chat_id) continue

    const barber = (booking.barber as any)?.name ?? 'мастера'

    const text =
      `⭐ <b>Как прошёл визит?</b>\n\n` +
      `Надеемся, что вам понравилась работа <b>${barber}</b>!\n\n` +
      `Оставьте отзыв — это займёт 1 минуту и очень поможет нам 🙏`

    await sendTelegram(client.telegram_chat_id, text)

    await supabase
      .from('bookings')
      .update({ review_requested_at: new Date().toISOString() })
      .eq('id', booking.id)
      .is('review_requested_at', null)

    console.log(`Review request sent for booking ${booking.id}`)
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Проверяем секрет (Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>)
  const auth = req.headers.get('Authorization')
  const expected = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  if (auth !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    console.log('=== notifications function started ===', new Date().toISOString())

    await Promise.all([
      sendDayReminders(),
      send30MinReminders(),
      autoCompleteBookings(),
      sendReviewRequests(),
    ])

    console.log('=== notifications function completed ===')

    return new Response(JSON.stringify({ ok: true, ts: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Notifications function error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
