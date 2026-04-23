import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const expectedPwd = process.env.ADMIN_PASSWORD

  // Check for session cookie if ADMIN_PASSWORD is set
  if (expectedPwd) {
    const sessionCookie = req.cookies.get('admin_session')
    const expectedCookieValue = btoa(`admin:${expectedPwd}`)

    if (sessionCookie && sessionCookie.value === expectedCookieValue) {
      return NextResponse.next()
    }
  }

  // Si no está autenticado, redirigir a /login
  const loginUrl = new URL('/login', req.url)
  // Pasar la ruta original como parámetro para redirigir después (opcional)
  loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: '/admin/:path*',
}
