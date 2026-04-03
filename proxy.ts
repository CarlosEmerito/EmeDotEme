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
  
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Acceso Restringido</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #111; color: #fff; }
          h1 { font-size: 2em; margin-bottom: 10px; }
          p { color: #888; margin-bottom: 30px; }
          .btn { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; border: none; }
          .btn:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <h1>🔒 Acceso Restringido</h1>
        <p>Se requiere inicio de sesión para acceder al panel de administración.</p>
        <button class="btn" onclick="window.location.href = window.location.pathname + '?login=1'">Haz clic aquí para Iniciar Sesión</button>
      </body>
    </html>
  `, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin EmeDotEme"',
      'Content-Type': 'text/html; charset=utf-8'
    },
  })
}

export const config = {
  matcher: '/admin/:path*',
}
