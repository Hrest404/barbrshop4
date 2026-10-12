import { NextRequest, NextResponse } from 'next/server'
import { unsealData } from 'iron-session'

const COOKIE_NAME = 'barbershop_admin'
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'barbershop-admin-secret-min-32-chars!!'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all /admin/* except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const cookieValue = request.cookies.get(COOKIE_NAME)?.value

    if (!cookieValue) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const session = await unsealData<{ adminId?: string }>(cookieValue, {
        password: SESSION_SECRET,
      })
      if (!session.adminId) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } catch {
      // Invalid/expired session
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
