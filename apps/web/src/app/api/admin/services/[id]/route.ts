import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const body = await req.json()
  const service = await prisma.services.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      duration_min: body.duration_min !== undefined ? Number(body.duration_min) : undefined,
      price: body.price,
      is_active: body.is_active,
      sort_order: body.sort_order,
    },
  })
  return NextResponse.json(service)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  await prisma.services.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
