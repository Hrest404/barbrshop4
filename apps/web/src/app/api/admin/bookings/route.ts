import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

// GET /api/admin/bookings?status=confirmed&date=2026-01-01
export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const date = searchParams.get('date')

  const where: any = {}
  if (status) where.status = status
  if (date) {
    const start = new Date(`${date}T00:00:00Z`)
    const end = new Date(`${date}T23:59:59Z`)
    where.starts_at = { gte: start, lte: end }
  }

  const bookings = await prisma.bookings.findMany({
    where,
    include: { client: true, barber: true, services: true },
    orderBy: { starts_at: 'desc' },
    take: 100,
  })

  return NextResponse.json(bookings)
}

// POST /api/admin/bookings — создание вручную
export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const body = await req.json()
  const { serviceIds, barberId, date, time, clientName, clientPhone } = body

  const services = await prisma.services.findMany({ where: { id: { in: serviceIds } } })
  const totalDuration = services.reduce((s: number, x: any) => s + x.duration_min, 0)
  const totalPrice = services.reduce((s: number, x: any) => s + Number(x.price), 0)

  const startsAt = new Date(`${date}T${time}:00Z`)
  const endsAt = new Date(startsAt.getTime() + totalDuration * 60000)

  const client = await prisma.clients.upsert({
    where: { phone: clientPhone },
    update: { name: clientName },
    create: { name: clientName, phone: clientPhone },
  })

  try {
    const booking = await prisma.bookings.create({
      data: {
        client_id: client.id,
        barber_id: barberId,
        starts_at: startsAt,
        ends_at: endsAt,
        total_price: totalPrice,
        total_duration_min: totalDuration,
        status: 'confirmed',
        source: 'admin',
        services: { create: services.map((s: any) => ({ service_id: s.id, name: s.name, duration_min: s.duration_min, price: s.price })) },
      },
    })
    return NextResponse.json(booking)
  } catch (err: any) {
    if (err.message?.includes('bookings_no_overlap')) {
      return NextResponse.json({ error: 'SLOT_TAKEN' }, { status: 409 })
    }
    throw err
  }
}
