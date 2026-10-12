import { NextRequest, NextResponse } from 'next/server'
import argon2 from 'argon2'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/session'
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  // IP для rate limiter
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const rl = checkRateLimit(ip)

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Попробуйте через 15 минут.' },
      { status: 429 }
    )
  }

  const { login, password } = await req.json()
  if (!login || !password) {
    return NextResponse.json({ error: 'Введите логин и пароль' }, { status: 400 })
  }

  const admin = await prisma.admin_users.findUnique({ where: { login } })
  if (!admin) {
    return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 })
  }

  const valid = await argon2.verify(admin.password_hash, password)
  if (!valid) {
    return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 })
  }

  // Сбрасываем счётчик после успешного входа
  resetRateLimit(ip)

  const session = await getAdminSession()
  session.adminId = admin.id
  session.login = admin.login
  await session.save()

  return NextResponse.json({ ok: true })
}
