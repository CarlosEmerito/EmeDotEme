"use client";

import { siteConfig } from "@/config/site";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (res.ok || data.success) {
        setStatus("success");
        setMessage("¡Gracias por suscribirte!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Hubo un error");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Error de conexión");
    }
  };

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Suscríbete a EmeDotEme</h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">Recibe las últimas noticias y análisis del mercado cripto en tu bandeja de entrada.</p>
        </div>
        
        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md md:ml-auto w-full">
          <div className="flex-1 relative">
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus("idle");
              }}
              disabled={status === "loading"}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white text-sm rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              required
            />
            {status !== "idle" && (
              <p className={`text-xs mt-1 absolute -bottom-5 left-0 ${status === "success" ? "text-green-600" : "text-red-500"}`}>
                {message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md px-6 py-2 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Cargando..." : "Suscribirse"}
          </button>
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Built by {siteConfig.author}. Datos provistos por CoinGecko.
        </p>
      </div>
    </footer>
  );
}