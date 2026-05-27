import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sin conexión | EmeDotEme",
};

export default function OfflinePage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-white dark:bg-zinc-950">
      <div className="text-center px-4 max-w-md">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-3xl font-black text-black dark:text-white font-serif mb-4">
          Sin conexión
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
          Parece que no tienes conexión a Internet. Puedes volver a la página de inicio e intentar de nuevo cuando estés conectado.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-sm hover:opacity-80 transition-opacity"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
