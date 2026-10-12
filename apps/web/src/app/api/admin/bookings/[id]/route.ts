import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

// PATCH /api/admin/bookings/[id] — перенос, отмена, смена статуса
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id } = await params
  const body = await req.json()
  const { action, status, date, time } = body

  const booking = await prisma.bookings.findUnique({ where: { id }, include: { services: true } })
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'cancel') {
    const updated = await prisma.bookings.update({ where: { id }, data: { status: 'cancelled' } })
    return NextResponse.json(updated)
  }

  if (action === 'reschedule') {
    const startsAt = new Date(`${date}T${time}:00Z`)
    const endsAt = new Date(startsAt.getTime() + booking.total_duration_min * 60000)
    try {
      const updated = await prisma.bookings.update({ where: { id }, data: { starts_at: startsAt, ends_at: endsAt } })
      return NextResponse.json(updated)
    } catch (err: any) {
      if (err.message?.includes('bookings_no_overlap')) return NextResponse.json({ error: 'SLOT_TAKEN' }, { status: 409 })
      throw err
    }
  }

  if (action === 'status' && status) {
    const updated = await prisma.bookings.update({ where: { id }, data: { status } })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
