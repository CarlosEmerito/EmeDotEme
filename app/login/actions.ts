'use server'

import { cookies, headers } from 'next/headers'
import { timingSafeEqual } from 'crypto'
import { createSession } from '@/lib/session'
import { getClientIpFromHeaders } from '@/lib/rate-limit'

const attempts = new Map<string, { count: number; blockedUntil: number }>()
const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 15 * 60 * 1000

/** Compara dos strings en tiempo constante para evitar timing attacks. */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  // Buffers de distinta longitud no se pueden comparar con timingSafeEqual;
  // igualamos longitudes con un buffer dummy para no filtrar la longitud real.
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

export async function loginAction(password: string) {
  const ip = getClientIpFromHeaders(await headers())
  const now = Date.now()
  const record = attempts.get(ip)

  if (record && record.blockedUntil > now) {
    const remaining = Math.ceil((record.blockedUntil - now) / 60_000)
    return { success: false, error: `Demasiados intentos. Espera ${remaining} minuto(s).` }
  }

  const expectedPwd = process.env.ADMIN_PASSWORD

  if (expectedPwd && safeCompare(password, expectedPwd)) {
    attempts.delete(ip)
    const cookieStore = await cookies()
    const value = await createSession()

    cookieStore.set('admin_session', value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })

    return { success: true }
  }

  if (!record || record.blockedUntil < now) {
    attempts.set(ip, { count: 1, blockedUntil: 0 })
  } else {
    record.count++
    if (record.count >= MAX_ATTEMPTS) {
      record.blockedUntil = now + BLOCK_DURATION_MS
      return { success: false, error: `Demasiados intentos. Espera 15 minutos.` }
    }
    attempts.set(ip, record)
  }

  return { success: false, error: 'Contraseña incorrecta' }
}
