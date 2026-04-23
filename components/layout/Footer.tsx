"use client";

import { siteConfig } from "@/config/site";
import { useState } from "react";
import Link from "next/link";

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
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 py-12 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start mb-12">
          
          <div className="md:col-span-4">
            <h2 className="text-xl font-bold font-serif text-black dark:text-white mb-4">
              {siteConfig.name}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
              {siteConfig.description}
            </p>
            <div className="flex flex-wrap gap-4 text-sm font-bold">
              <a href={siteConfig.links.bluesky} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-[color:var(--color-brand)] transition-colors">Bluesky</a>
              <a href={siteConfig.links.binanceSquare} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-[color:var(--color-brand)] transition-colors">Binance</a>
              <a href={siteConfig.links.linkedin} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-[color:var(--color-brand)] transition-colors">LinkedIn</a>
              <a href={siteConfig.links.twitter} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-[color:var(--color-brand)] transition-colors">X</a>
              <a href={siteConfig.links.github} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-[color:var(--color-brand)] transition-colors">GitHub</a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white mb-4">Secciones</h3>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li><Link href="/categoria/criptomonedas" className="hover:text-[color:var(--color-brand)] transition-colors">Criptomonedas</Link></li>
              <li><Link href="/categoria/empresa" className="hover:text-[color:var(--color-brand)] transition-colors">Empresa</Link></li>
              <li><Link href="/categoria/ia" className="hover:text-[color:var(--color-brand)] transition-colors">IA</Link></li>
              <li><Link href="/categoria/ciberseguridad" className="hover:text-[color:var(--color-brand)] transition-colors">Ciberseguridad</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white mb-4">Empresa</h3>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li><a href="/sobre-mi" className="hover:text-[color:var(--color-brand)] transition-colors">Sobre el Autor</a></li>
               <li><a href="/contacto" className="hover:text-[color:var(--color-brand)] transition-colors">Contacto</a></li>
            </ul>
          </div>

          <div className="md:col-span-4 bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white mb-2">Suscríbete al Newsletter</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">Recibe las últimas noticias y análisis del mercado en tu bandeja de entrada.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setStatus("idle");
                  }}
                  disabled={status === "loading"}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white text-sm rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)] disabled:opacity-50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-[color:var(--color-brand)] hover:opacity-90 text-white font-medium text-sm rounded-md px-6 py-2.5 transition-opacity disabled:opacity-50 w-full"
              >
                {status === "loading" ? "Cargando..." : "Suscribirse"}
              </button>
              {status !== "idle" && (
                <p className={`text-xs text-center ${status === "success" ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            © {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Analizado por {siteConfig.author} • Datos provistos por CoinGecko
          </p>
        </div>
      </div>
    </footer>
  );
}