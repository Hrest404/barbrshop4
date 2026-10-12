import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET() {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const reviews = await prisma.reviews.findMany({
    include: { client: true, barber: true, booking: true },
    orderBy: { created_at: 'desc' },
    take: 100,
  })
  return NextResponse.json(reviews)
}

export async function PATCH(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id, is_public } = await req.json()
  const review = await prisma.reviews.update({ where: { id }, data: { is_public } })
  return NextResponse.json(review)
}
