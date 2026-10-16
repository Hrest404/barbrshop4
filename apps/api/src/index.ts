import Fastify from 'fastify'
import cors from '@fastify/cors'
import crypto from 'crypto'
import { prisma } from './prisma'
import { getAvailableDays, getAvailableSlots } from './availability'
import {
  notifyClientBookingConfirmed,
  notifyClientBookingCancelled,
  notifyClientBookingRescheduled,
  notifyBarberNewBooking,
} from '../../bot/src/notifications'

const app = Fastify({
  logger: true,
})

app.register(cors, {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
})

// Error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(error)
  reply.status(500).send({ error: 'Something went wrong' })
})

// Routes
// Health check: responds 200 without database or telegram dependencies
app.get('/health', async () => {
  return { ok: true }
})

app.get('/api/v1/services', async () => {
  const services = await prisma.services.findMany({
    where: { is_active: true },
    orderBy: { sort_order: 'asc' },
  })
  return services
})

app.get('/api/v1/barbers', async () => {
  const barbers = await prisma.barbers.findMany({
    where: { is_active: true },
    orderBy: { sort_order: 'asc' },
    include: {
      services: {
        include: { service: true }
      }
    }
  })
  return barbers
})

app.get('/api/v1/barbers/:id', async (request, reply) => {
  const { id } = request.params as { id: string }
  const barber = await prisma.barbers.findUnique({
    where: { id },
    include: {
      services: {
        include: { service: true }
      },
      working_hours: true,
      breaks: true,
      portfolio: true,
      reviews: true
    }
  })
  if (!barber) {
    return reply.status(404).send({ error: 'Barber not found' })
  }
  return barber
})

app.get('/api/v1/availability/days', async (request, reply) => {
  const query = request.query as { barberId?: string; serviceIds: string }
  if (!query.serviceIds) {
    return reply.status(400).send({ error: 'serviceIds is required' })
  }
  const serviceIds = query.serviceIds.split(',')
  const days = await getAvailableDays({ barberId: query.barberId, serviceIds })
  return { days }
})

app.get('/api/v1/availability', async (request, reply) => {
  const query = request.query as { date: string; barberId?: string; serviceIds: string }
  if (!query.date || !query.serviceIds) {
    return reply.status(400).send({ error: 'date and serviceIds are required' })
  }
  const serviceIds = query.serviceIds.split(',')
  const slots = await getAvailableSlots({ date: query.date, barberId: query.barberId, serviceIds })
  return { slots }
})

app.post('/api/v1/bookings', async (request, reply) => {
  const body = request.body as {
    serviceIds: string[]
    barberId: string
    date: string
    time: string
    clientName: string
    clientPhone: string
  }

  // 1. Считаем длительность и цену
  const services = await prisma.services.findMany({
    where: { id: { in: body.serviceIds } }
  })
  const totalDuration = services.reduce((sum: number, s: any) => sum + s.duration_min, 0)
  const totalPrice = services.reduce((sum: number, s: any) => sum + Number(s.price), 0)

  // 2. Считаем starts_at и ends_at
  const startsAt = new Date(`${body.date}T${body.time}:00Z`)
  const endsAt = new Date(startsAt.getTime() + totalDuration * 60000)

  // 3. Создаем клиента (или находим)
  const client = await prisma.clients.upsert({
    where: { phone: body.clientPhone },
    update: { name: body.clientName },
    create: { name: body.clientName, phone: body.clientPhone }
  })

  // 4. Пытаемся создать бронь
  try {
    const booking = await prisma.bookings.create({
      data: {
        client_id: client.id,
        barber_id: body.barberId,
        starts_at: startsAt,
        ends_at: endsAt,
        total_price: totalPrice,
        total_duration_min: totalDuration,
        status: 'confirmed',
        source: 'web',
        services: {
          create: services.map((s: any) => ({
            service_id: s.id,
            name: s.name,
            duration_min: s.duration_min,
            price: s.price
          }))
        }
      }
    })

    // Telegram-уведомления (fire-and-forget)
    notifyClientBookingConfirmed(booking.id).catch(console.error)
    notifyBarberNewBooking(booking.id).catch(console.error)

    return booking
  } catch (err: any) {
    if (err.code === 'P2010' && err.meta?.code === '23P01') {
      return reply.status(409).send({ error: 'SLOT_TAKEN' })
    }
    if (err.message?.includes('bookings_no_overlap')) {
      return reply.status(409).send({ error: 'SLOT_TAKEN' })
    }
    throw err
  }
})

app.post('/api/v1/auth/telegram', async (request, reply) => {
  const { initData } = request.body as { initData: string }
  if (!initData) return reply.status(400).send({ error: 'Missing initData' })

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return { status: 'ok' } // Bypass for dev if no token

  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    urlParams.delete('hash')
    
    const keys = Array.from(urlParams.keys()).sort()
    const dataCheckString = keys.map(k => `${k}=${urlParams.get(k)}`).join('\n')
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
    
    if (calculatedHash !== hash) {
      return reply.status(401).send({ error: 'Invalid initData' })
    }
    
    return { status: 'ok' }
  } catch (err) {
    return reply.status(400).send({ error: 'Failed to validate' })
  }
})

app.get('/api/v1/bookings/:token', async (request, reply) => {
  const { token } = request.params as { token: string }
  const booking = await prisma.bookings.findUnique({
    where: { manage_token: token },
    include: {
      barber: true,
      services: true,
      client: true
    }
  })
  if (!booking) {
    return reply.status(404).send({ error: 'Booking not found' })
  }
  return booking
})

app.post('/api/v1/bookings/:token/cancel', async (request, reply) => {
  const { token } = request.params as { token: string }
  
  const booking = await prisma.bookings.findUnique({ where: { manage_token: token } })
  if (!booking) return reply.status(404).send({ error: 'Booking not found' })
  if (booking.status === 'cancelled') return reply.status(400).send({ error: 'Already cancelled' })
  if (booking.status !== 'confirmed') return reply.status(400).send({ error: 'Cannot cancel' })

  const updated = await prisma.bookings.update({
    where: { manage_token: token },
    data: { status: 'cancelled' }
  })

  // Telegram-уведомление
  notifyClientBookingCancelled(updated.id).catch(console.error)

  return updated
})

app.post('/api/v1/bookings/:token/reschedule', async (request, reply) => {
  const { token } = request.params as { token: string }
  const body = request.body as { date: string; time: string }
  
  const booking = await prisma.bookings.findUnique({ 
    where: { manage_token: token },
    include: { services: true }
  })
  if (!booking) return reply.status(404).send({ error: 'Booking not found' })
  if (booking.status !== 'confirmed') return reply.status(400).send({ error: 'Cannot reschedule' })

  const startsAt = new Date(`${body.date}T${body.time}:00Z`)
  const endsAt = new Date(startsAt.getTime() + booking.total_duration_min * 60000)

  try {
    const updated = await prisma.bookings.update({
      where: { manage_token: token },
      data: {
        starts_at: startsAt,
        ends_at: endsAt
      }
    })

    // Telegram-уведомление
    notifyClientBookingRescheduled(updated.id).catch(console.error)

    return updated
  } catch (err: any) {
    if (err.code === 'P2010' && err.meta?.code === '23P01') {
      return reply.status(409).send({ error: 'SLOT_TAKEN' })
    }
    if (err.message?.includes('bookings_no_overlap')) {
      return reply.status(409).send({ error: 'SLOT_TAKEN' })
    }
    throw err
  }
})

// ── Telegram webhook (production mode) ──────────────────────────────────────
// In development the bot runs separately via long-polling (apps/bot).
// In production Telegram sends updates to POST /telegram/webhook.
app.post('/telegram/webhook', async (request, reply) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return reply.status(503).send({ error: 'Bot not configured' })

  // Delegate to the bot's webhook handler
  try {
    const { webhookCallback } = await import('grammy')
    const botModule = await import('../../bot/src/bot')
    const botInstance = (botModule as any).bot || (botModule as any).default
    const handler = webhookCallback(botInstance, 'fastify')
    return handler(request as any, reply as any)
  } catch (err) {
    app.log.error(err)
    return reply.status(500).send({ error: 'Webhook error' })
  }
})

// Listen without top-level await to avoid blocking serverless function invocations on Vercel
const port = Number(process.env.PORT) || 4000
const host = '0.0.0.0'

app.listen({ port, host }).catch((err) => {
  app.log.error(err)
  process.exit(1)
})
