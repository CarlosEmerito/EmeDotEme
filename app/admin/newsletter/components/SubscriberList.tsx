"use client";

import { useState } from "react";
import { addSubscriber, toggleSubscriberStatus, deleteSubscriber } from "../actions";

interface Subscriber {
  id: string;
  email: string;
  active: boolean;
  createdAt: Date;
}

export default function SubscriberList({ initialSubscribers }: { initialSubscribers: Subscriber[] }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const form = e.currentTarget;
    const res = await addSubscriber(new FormData(form));
    
    if (!res.success) {
      setError(res.error || "Error al añadir suscriptor");
    } else {
      setError(null);
      form.reset();
    }
    
    setLoading(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await toggleSubscriberStatus(id, !currentStatus);
    if (!res.success) alert(res.error || "Error al actualizar");
  };

  const handleDelete = async (id: string, email: string) => {
    if (confirm(`¿Eliminar permanentemente a ${email}?`)) {
      const res = await deleteSubscriber(id);
      if (!res.success) alert(res.error || "Error al eliminar");
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded shadow-sm overflow-hidden">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <form onSubmit={handleAdd} className="flex gap-2 max-w-lg">
          <input 
            type="email" 
            name="email" 
            placeholder="Añadir email manualmente..." 
            className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            required
            disabled={loading}
          />
          <button 
            type="submit" 
            className="bg-black text-white dark:bg-white dark:text-black py-2 px-4 rounded text-sm font-bold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Añadiendo..." : "Suscribir"}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider text-xs font-bold">
            <tr>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Fecha de Suscripción</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {initialSubscribers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                  No hay suscriptores aún.
                </td>
              </tr>
            ) : (
              initialSubscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{sub.email}</td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(sub.id, sub.active)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        sub.active 
                          ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {sub.active ? "Activo" : "Pausado"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button 
                      onClick={() => handleToggle(sub.id, sub.active)}
                      className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                    >
                      {sub.active ? "Pausar" : "Reactivar"}
                    </button>
                    <button 
                      onClick={() => handleDelete(sub.id, sub.email)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
