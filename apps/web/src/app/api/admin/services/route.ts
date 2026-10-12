import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET() {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const services = await prisma.services.findMany({ orderBy: { sort_order: 'asc' } })
  return NextResponse.json(services)
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const body = await req.json()
  const service = await prisma.services.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      duration_min: Number(body.duration_min),
      price: body.price,
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? 0,
    },
  })
  return NextResponse.json(service)
}
