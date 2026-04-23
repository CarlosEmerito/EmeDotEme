'use server'

import { cookies } from 'next/headers'
import { createSession } from '@/lib/session'
import bcrypt from 'bcrypt'

export async function loginAction(password: string) {
  const expectedPwd = process.env.ADMIN_PASSWORD
  
  if (expectedPwd && await bcrypt.compare(password, expectedPwd)) {
    const cookieStore = await cookies()
    const value = await createSession()
    
    // Set secure HttpOnly cookie valid for 7 days
    cookieStore.set('admin_session', value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })
    
    return { success: true }
  }
  
  return { success: false, error: 'Contraseña incorrecta' }
}
