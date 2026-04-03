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
            <div className="flex space-x-4">
              <a href={siteConfig.links.twitter} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-[color:var(--color-brand)] transition-colors">
                <span className="sr-only">Twitter</span>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.319H5.078z" />
                </svg>
              </a>
              <a href={siteConfig.links.github} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-[color:var(--color-brand)] transition-colors">
                <span className="sr-only">GitHub</span>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white mb-4">Secciones</h3>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li><a href="/categoria/mercados" className="hover:text-[color:var(--color-brand)] transition-colors">Mercados</a></li>
              <li><a href="/categoria/tecnologia" className="hover:text-[color:var(--color-brand)] transition-colors">Tecnología</a></li>
              <li><a href="/categoria/web3" className="hover:text-[color:var(--color-brand)] transition-colors">Web3</a></li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white mb-4">Empresa</h3>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li><a href="/sobre-mi" className="hover:text-[color:var(--color-brand)] transition-colors">Sobre el Autor</a></li>
              <li><a href="#" className="hover:text-[color:var(--color-brand)] transition-colors">Contacto</a></li>
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