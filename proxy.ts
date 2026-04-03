import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const basicAuth = req.headers.get('authorization')
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    const expectedUser = 'admin'
    const expectedPwd = process.env.ADMIN_PASSWORD || 'admin'

    if (user === expectedUser && pwd === expectedPwd) {
      return NextResponse.next()
    }
  }
  
  return new NextResponse('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Acceso Restringido - EmeDotEme Admin"',
    },
  })
}

export const config = {
  matcher: '/admin/:path*',
}
