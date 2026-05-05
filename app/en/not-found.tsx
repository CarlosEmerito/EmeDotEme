import Link from "next/link";

export default function NotFoundEn() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans items-center justify-center min-h-[60vh] text-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-9xl font-extrabold text-zinc-200 dark:text-zinc-800 tracking-widest">404</h1>
        <div className="bg-[color:var(--color-brand)] px-2 text-sm rounded rotate-12 absolute text-white shadow-sm inline-block">
          Page not found
        </div>
        
        <h2 className="mt-8 text-2xl md:text-3xl font-serif font-bold text-black dark:text-white">
          Oops! You seem to be lost.
        </h2>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          The article or page you are looking for doesn't exist, has been moved, or is simply a market myth.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/en"
            className="px-6 py-3 bg-[color:var(--color-brand)] hover:bg-opacity-90 text-white font-medium rounded-md transition-colors"
          >
            Back to Home
          </Link>
          <Link 
            href="/en/search"
            className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium rounded-md transition-colors"
          >
            Search News
          </Link>
        </div>
      </div>
    </div>
  );
}
