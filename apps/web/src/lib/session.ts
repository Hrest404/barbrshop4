import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface AdminSessionData {
  adminId?: string
  login?: string
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? 'barbershop-admin-secret-min-32-chars!!',
  cookieName: 'barbershop_admin',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 часов
  },
}

export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
  const cookieStore = await cookies()
  return getIronSession<AdminSessionData>(cookieStore, sessionOptions)
}

export async function requireAdmin(): Promise<AdminSessionData> {
  const session = await getAdminSession()
  if (!session.adminId) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}
