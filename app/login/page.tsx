import { LoginForm } from './LoginForm'

export const metadata = {
  title: 'Iniciar Sesión | EmeDotEme',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { callbackUrl } = await searchParams
  const redirectUrl = typeof callbackUrl === 'string' ? callbackUrl : '/admin'

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-zinc-950 font-sans items-center justify-center py-20 px-4 min-h-[70vh]">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-black dark:text-white font-serif uppercase tracking-wider mb-2">
            Admin Login
          </h1>
          <p className="text-zinc-500 text-sm">
            Introduce la contraseña para acceder al panel de EmeDotEme.
          </p>
        </div>

        <LoginForm callbackUrl={redirectUrl} />
      </div>
    </div>
  )
}
