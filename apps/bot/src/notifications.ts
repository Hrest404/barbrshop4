import { prisma } from './prisma'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

/** Отправить сообщение через Bot API напрямую (для уведомлений из API) */
async function sendTelegramMessage(chatId: string, text: string, parseMode = 'HTML') {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  })
  return res.json()
}

export type BookingWithRelations = {
  id: string
  manage_token: string
  starts_at: Date
  total_price: number | { toString(): string }
  total_duration_min: number
  status: string
  client: { name: string; phone: string; telegram_chat_id?: string | null }
  barber: { name: string; telegram_chat_id?: string | null }
  services: { name: string; price: number | { toString(): string }; duration_min: number }[]
}

function formatBookingInfo(booking: BookingWithRelations): string {
  const date = new Date(booking.starts_at)
  const dateStr = date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const timeStr = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
  const servicesList = booking.services.map(s => `• ${s.name} — ${s.duration_min} мин`).join('\n')
  return `📅 <b>${dateStr}</b> в <b>${timeStr}</b>\n✂️ Барбер: <b>${booking.barber.name}</b>\n\n${servicesList}\n\n💰 Итого: <b>${booking.total_price} ₸</b>`
}

/** Уведомление клиенту о подтверждении записи */
export async function notifyClientBookingConfirmed(bookingId: string) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: { client: true, barber: true, services: true },
  })
  if (!booking || !booking.client.telegram_chat_id) return

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
  const manageUrl = `${appUrl}/booking/${booking.manage_token}`

  const text =
    `✅ <b>Запись подтверждена!</b>\n\n` +
    `${formatBookingInfo(booking as any)}\n\n` +
    `🔗 <a href="${manageUrl}">Управление записью</a>\n` +
    `(отмена или перенос)`

  await sendTelegramMessage(booking.client.telegram_chat_id, text)
}

/** Уведомление клиенту об отмене записи */
export async function notifyClientBookingCancelled(bookingId: string) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: { client: true, barber: true, services: true },
  })
  if (!booking || !booking.client.telegram_chat_id) return

  const text =
    `❌ <b>Запись отменена</b>\n\n` +
    `${formatBookingInfo(booking as any)}\n\n` +
    `Если хотите записаться снова — приходите на сайт.`

  await sendTelegramMessage(booking.client.telegram_chat_id, text)
}

/** Уведомление клиенту о переносе записи */
export async function notifyClientBookingRescheduled(bookingId: string) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: { client: true, barber: true, services: true },
  })
  if (!booking || !booking.client.telegram_chat_id) return

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
  const manageUrl = `${appUrl}/booking/${booking.manage_token}`

  const text =
    `🔄 <b>Запись перенесена!</b>\n\n` +
    `${formatBookingInfo(booking as any)}\n\n` +
    `🔗 <a href="${manageUrl}">Управление записью</a>`

  await sendTelegramMessage(booking.client.telegram_chat_id, text)
}

/** Уведомление барберу о новой записи */
export async function notifyBarberNewBooking(bookingId: string) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: { client: true, barber: true, services: true },
  })
  if (!booking || !booking.barber.telegram_chat_id) return

  const text =
    `🔔 <b>Новая запись!</b>\n\n` +
    `${formatBookingInfo(booking as any)}\n\n` +
    `👤 Клиент: <b>${booking.client.name}</b>\n📞 ${booking.client.phone}`

  await sendTelegramMessage(booking.barber.telegram_chat_id, text)
}
