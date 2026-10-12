import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET() {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const settings = await prisma.settings.findMany()
  const map: Record<string, string> = {}
  settings.forEach((s: any) => { map[s.key] = s.value })
  return NextResponse.json(map)
}

export async function PUT(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const body: Record<string, string> = await req.json()

  await prisma.$transaction(
    Object.entries(body).map(([key, value]) =>
      prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
