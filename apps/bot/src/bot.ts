import { Bot, InlineKeyboard } from 'grammy'
import { prisma } from './prisma'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not set')

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'

export const bot = new Bot(BOT_TOKEN)

// ── /start ─────────────────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
  const payload = ctx.match // e.g. "b_<token>" for deep link

  // Deep link: /start b_<manage_token>
  if (payload && payload.startsWith('b_')) {
    const token = payload.slice(2)
    const booking = await prisma.bookings.findUnique({
      where: { manage_token: token },
      include: { barber: true, services: true, client: true },
    })

    if (!booking) {
      return ctx.reply('❌ Запись не найдена.')
    }

    const date = new Date(booking.starts_at)
    const dateStr = date.toLocaleDateString('ru-RU', {
      day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC',
    })
    const timeStr = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
    })
    const servicesList = booking.services.map(s => `• ${s.name}`).join('\n')

    const keyboard = new InlineKeyboard()
      .url('🌐 Управление записью', `${APP_URL}/booking/${token}`)

    return ctx.reply(
      `📋 <b>Ваша запись</b>\n\n` +
      `📅 ${dateStr} в ${timeStr}\n` +
      `✂️ Барбер: <b>${booking.barber.name}</b>\n\n` +
      `${servicesList}\n\n` +
      `💰 ${booking.total_price} ₸\n` +
      `Статус: <b>${translateStatus(booking.status)}</b>`,
      { parse_mode: 'HTML', reply_markup: keyboard }
    )
  }

  // Если пришёл telegram user — связываем с клиентом (если chat_id ещё не привязан)
  const telegramId = String(ctx.from?.id)
  const chatId = String(ctx.chat.id)
  if (telegramId) {
    await prisma.clients.updateMany({
      where: { telegram_id: telegramId },
      data: { telegram_chat_id: chatId },
    })
  }

  const keyboard = new InlineKeyboard()
    .url('✂️ Записаться', APP_URL)
    .row()
    .text('📋 Мои записи', 'my_bookings')

  return ctx.reply(
    `👋 Добро пожаловать в <b>Barbershop</b>!\n\n` +
    `Здесь вы можете:\n` +
    `• Записаться на стрижку\n` +
    `• Посмотреть свои записи\n` +
    `• Получать уведомления`,
    { parse_mode: 'HTML', reply_markup: keyboard }
  )
})

// ── Команды меню ────────────────────────────────────────────────────────────

bot.command('mybookings', (ctx) => ctx.reply('Загружаю ваши записи...').then(() => showMyBookings(ctx)))
bot.command('book', async (ctx) => {
  const keyboard = new InlineKeyboard().url('✂️ Открыть форму записи', APP_URL)
  return ctx.reply('Нажмите кнопку ниже, чтобы записаться:', { reply_markup: keyboard })
})
bot.command('help', async (ctx) => {
  return ctx.reply(
    `ℹ️ <b>Команды бота:</b>\n\n` +
    `/start — Главное меню\n` +
    `/book — Записаться\n` +
    `/mybookings — Мои записи\n` +
    `/help — Помощь`,
    { parse_mode: 'HTML' }
  )
})

// ── Привязка барбера ─────────────────────────────────────────────────────────

bot.command('linkbarber', async (ctx) => {
  // Команда: /linkbarber <secret>
  // Секрет хранится в settings: key='barber_link_secret'
  const parts = ctx.message?.text?.split(' ') ?? []
  const secret = parts[1]
  if (!secret) {
    return ctx.reply('Укажите секретный код: /linkbarber <код>')
  }

  // Ищем барбера по одноразовому коду в settings: "barber_link:<secret>" -> barberId
  const setting = await prisma.settings.findUnique({
    where: { key: `barber_link:${secret}` },
  })

  if (!setting) {
    return ctx.reply('❌ Неверный или уже использованный код.')
  }

  const barberId = setting.value
  const chatId = String(ctx.chat.id)

  await prisma.barbers.update({
    where: { id: barberId },
    data: { telegram_chat_id: chatId },
  })

  // Удаляем одноразовый ключ
  await prisma.settings.delete({ where: { key: `barber_link:${secret}` } })

  const barber = await prisma.barbers.findUnique({ where: { id: barberId } })
  return ctx.reply(`✅ Готово! Барбер <b>${barber?.name}</b> привязан к этому чату. Теперь вы будете получать уведомления о новых записях.`, { parse_mode: 'HTML' })
})

// ── Inline-кнопки ───────────────────────────────────────────────────────────

bot.callbackQuery('my_bookings', async (ctx) => {
  await ctx.answerCallbackQuery()
  await showMyBookings(ctx)
})

async function showMyBookings(ctx: any) {
  const telegramId = String(ctx.from?.id)
  const client = await prisma.clients.findFirst({
    where: { telegram_id: telegramId },
  })

  if (!client) {
    return ctx.reply(
      '❌ Ваш Telegram не привязан ни к одной записи.\n\n' +
      'Сделайте запись на сайте и введите тот же номер телефона — тогда записи появятся здесь.'
    )
  }

  const bookings = await prisma.bookings.findMany({
    where: {
      client_id: client.id,
      status: { in: ['confirmed'] },
      starts_at: { gte: new Date() },
    },
    include: { barber: true, services: true },
    orderBy: { starts_at: 'asc' },
    take: 5,
  })

  if (bookings.length === 0) {
    const keyboard = new InlineKeyboard().url('✂️ Записаться', APP_URL)
    return ctx.reply('У вас нет предстоящих записей.', { reply_markup: keyboard })
  }

  for (const booking of bookings) {
    const date = new Date(booking.starts_at)
    const dateStr = date.toLocaleDateString('ru-RU', {
      day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC',
    })
    const timeStr = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
    })

    const keyboard = new InlineKeyboard()
      .url('🔗 Управление', `${APP_URL}/booking/${booking.manage_token}`)

    await ctx.reply(
      `📅 <b>${dateStr}</b> в <b>${timeStr}</b>\n` +
      `✂️ ${booking.barber.name}\n` +
      `💰 ${booking.total_price} ₸`,
      { parse_mode: 'HTML', reply_markup: keyboard }
    )
  }
}

// ── Utility ─────────────────────────────────────────────────────────────────

function translateStatus(status: string): string {
  const map: Record<string, string> = {
    confirmed: '✅ Подтверждена',
    completed: '✔️ Завершена',
    cancelled: '❌ Отменена',
    no_show: '⚠️ Не пришёл',
  }
  return map[status] ?? status
}

export default bot
