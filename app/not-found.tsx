import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans items-center justify-center min-h-[60vh] text-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-9xl font-extrabold text-zinc-200 dark:text-zinc-800 tracking-widest">404</h1>
        <div className="bg-[color:var(--color-brand)] px-2 text-sm rounded rotate-12 absolute text-white shadow-sm inline-block">
          Página no encontrada
        </div>
        
        <h2 className="mt-8 text-2xl md:text-3xl font-serif font-bold text-black dark:text-white">
          Parece que te has perdido.
        </h2>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          El artículo o la página que estás buscando no existe, ha sido movida, o simplemente es un mito del mercado.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/"
            className="px-6 py-3 bg-[color:var(--color-brand)] hover:bg-opacity-90 text-white font-medium rounded-md transition-colors"
          >
            Volver a la Portada
          </Link>
          <Link 
            href="/buscar"
            className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium rounded-md transition-colors"
          >
            Buscar noticias
          </Link>
        </div>
      </div>
    </div>
  );
}