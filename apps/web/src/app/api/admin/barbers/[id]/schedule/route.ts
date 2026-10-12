import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

// GET /api/admin/barbers/[id]/schedule
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const [working_hours, breaks, time_off] = await Promise.all([
    prisma.working_hours.findMany({ where: { barber_id: id } }),
    prisma.breaks.findMany({ where: { barber_id: id } }),
    prisma.time_off.findMany({ where: { barber_id: id } }),
  ])
  return NextResponse.json({ working_hours, breaks, time_off })
}

// PUT /api/admin/barbers/[id]/schedule — полная замена расписания
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const { working_hours, breaks } = await req.json()

  // Транзакция: удаляем старое, вставляем новое
  await prisma.$transaction([
    prisma.working_hours.deleteMany({ where: { barber_id: id } }),
    prisma.breaks.deleteMany({ where: { barber_id: id } }),
    ...(working_hours ?? []).map((wh: any) =>
      prisma.working_hours.create({
        data: {
          barber_id: id,
          weekday: wh.weekday,
          start_time: new Date(`1970-01-01T${wh.start_time}:00Z`),
          end_time: new Date(`1970-01-01T${wh.end_time}:00Z`),
        },
      })
    ),
    ...(breaks ?? []).map((b: any) =>
      prisma.breaks.create({
        data: {
          barber_id: id,
          weekday: b.weekday,
          start_time: new Date(`1970-01-01T${b.start_time}:00Z`),
          end_time: new Date(`1970-01-01T${b.end_time}:00Z`),
        },
      })
    ),
  ])

  return NextResponse.json({ ok: true })
}

// POST /api/admin/barbers/[id]/schedule — добавить time_off
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const body = await req.json()
  const entry = await prisma.time_off.create({
    data: {
      barber_id: id,
      starts_at: new Date(body.starts_at),
      ends_at: new Date(body.ends_at),
      type: body.type ?? 'day_off',
      note: body.note ?? null,
    },
  })
  return NextResponse.json(entry)
}
