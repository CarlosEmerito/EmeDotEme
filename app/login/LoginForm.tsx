'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction } from './actions'

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const res = await loginAction(password)
      if (res?.success) {
        router.push(callbackUrl)
        router.refresh()
      } else {
        setError(res.error || 'Error')
        setIsLoading(false)
      }
    } catch {
      setError('Error de conexión')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/10 p-3 rounded-md border border-red-200 dark:border-red-900/50">
          ❌ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-[color:var(--color-brand)] hover:opacity-90 text-white font-bold uppercase tracking-wider text-sm rounded-md transition-opacity disabled:opacity-50 flex items-center justify-center"
      >
        {isLoading ? 'Comprobando...' : 'Iniciar Sesión'}
      </button>
    </form>
  )
}
