import { prisma } from "@/lib/prisma";
import SubscriberList from "./components/SubscriberList";

export const metadata = { title: "Newsletter | Admin" };

export default async function NewsletterPage() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: "desc" }
  });

  const activeCount = subscribers.filter(s => s.active).length;
  const inactiveCount = subscribers.length - activeCount;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-black dark:text-white font-serif uppercase tracking-wider">
            Suscripciones al Newsletter
          </h1>
          <p className="text-zinc-500 mt-2">
            Gestiona la lista de usuarios suscritos para recibir notificaciones.
          </p>
        </div>
        
        <div className="flex space-x-3 text-sm">
          <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded flex flex-col items-center">
            <span className="font-bold text-lg">{subscribers.length}</span>
            <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Total</span>
          </div>
          <div className="bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 px-4 py-2 border border-green-200 dark:border-green-900/30 rounded flex flex-col items-center">
            <span className="font-bold text-lg">{activeCount}</span>
            <span className="text-xs uppercase tracking-wider font-bold">Activos</span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 px-4 py-2 border border-amber-200 dark:border-amber-900/30 rounded flex flex-col items-center">
            <span className="font-bold text-lg">{inactiveCount}</span>
            <span className="text-xs uppercase tracking-wider font-bold">Inactivos</span>
          </div>
        </div>
      </div>

      <SubscriberList initialSubscribers={subscribers} />
    </div>
  );
}
