import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const body = await req.json()

  const barber = await prisma.barbers.update({
    where: { id },
    data: {
      name: body.name,
      bio: body.bio,
      photo_url: body.photo_url,
      experience_years: body.experience_years !== undefined ? Number(body.experience_years) : undefined,
      is_active: body.is_active,
      sort_order: body.sort_order,
      telegram_chat_id: body.telegram_chat_id,
    },
  })
  return NextResponse.json(barber)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  await prisma.barbers.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
