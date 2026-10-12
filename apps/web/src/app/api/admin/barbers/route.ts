import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET() {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const barbers = await prisma.barbers.findMany({
    orderBy: { sort_order: 'asc' },
    include: { services: { include: { service: true } }, working_hours: true, breaks: true, portfolio: true },
  })
  return NextResponse.json(barbers)
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const body = await req.json()
  const barber = await prisma.barbers.create({
    data: {
      name: body.name,
      bio: body.bio ?? null,
      photo_url: body.photo_url ?? null,
      experience_years: body.experience_years ? Number(body.experience_years) : null,
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? 0,
    },
  })
  return NextResponse.json(barber)
}
