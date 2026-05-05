"use client";

import { siteConfig } from "@/config/site";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const pathname = usePathname();
  const lang = pathname?.startsWith("/en") ? "en" : "es";

  const t = {
    es: {
      sections: "Secciones",
      company: "Empresa",
      about: "Sobre el Autor",
      contact: "Contacto",
      newsletterTitle: "Suscríbete al Newsletter",
      newsletterDesc: "Recibe las últimas noticias y análisis del mercado en tu bandeja de entrada.",
      subscribe: "Suscribirse",
      loading: "Cargando...",
      success: "¡Gracias por suscribirte!",
      error: "Hubo un error",
      connectionError: "Error de conexión",
      rights: "Todos los derechos reservados.",
      analyzedBy: "Analizado por",
      dataBy: "Datos provistos por",
      categories: {
        criptomonedas: "Criptomonedas",
        mercados: "Mercados",
        ia: "IA",
        tecnologia: "Tecnología",
        ciberseguridad: "Ciberseguridad"
      }
    },
    en: {
      sections: "Sections",
      company: "Company",
      about: "About Author",
      contact: "Contact",
      newsletterTitle: "Subscribe to Newsletter",
      newsletterDesc: "Receive the latest news and market analysis in your inbox.",
      subscribe: "Subscribe",
      loading: "Loading...",
      success: "Thanks for subscribing!",
      error: "An error occurred",
      connectionError: "Connection error",
      rights: "All rights reserved.",
      analyzedBy: "Analyzed by",
      dataBy: "Data provided by",
      categories: {
        criptomonedas: "Cryptocurrencies",
        mercados: "Markets",
        ia: "AI",
        tecnologia: "Technology",
        ciberseguridad: "Cybersecurity"
      }
    }
  }[lang];

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
        setMessage(t.success);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || t.error);
      }
    } catch (err) {
      setStatus("error");
      setMessage(t.connectionError);
    }
  };

  const prefix = lang === "en" ? "/en" : "";

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 py-12 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start mb-12">
          
          <div className="md:col-span-4">
            <h2 className="text-xl font-bold font-serif text-black dark:text-white mb-4">
              {siteConfig.name}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
              {lang === "en" ? siteConfig.descriptionEn || siteConfig.description : siteConfig.description}
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white mb-4">{t.sections}</h3>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li><Link href={`${prefix}/categoria/criptomonedas`} className="hover:text-[color:var(--color-brand)] transition-colors">{t.categories.criptomonedas}</Link></li>
              <li><Link href={`${prefix}/categoria/mercados`} className="hover:text-[color:var(--color-brand)] transition-colors">{t.categories.mercados}</Link></li>
              <li><Link href={`${prefix}/categoria/ia`} className="hover:text-[color:var(--color-brand)] transition-colors">{t.categories.ia}</Link></li>
              <li><Link href={`${prefix}/categoria/tecnologia`} className="hover:text-[color:var(--color-brand)] transition-colors">{t.categories.tecnologia}</Link></li>
              <li><Link href={`${prefix}/categoria/ciberseguridad`} className="hover:text-[color:var(--color-brand)] transition-colors">{t.categories.ciberseguridad}</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white mb-4">{t.company}</h3>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li><Link href={`${prefix}/sobre-mi`} className="hover:text-[color:var(--color-brand)] transition-colors">{t.about}</Link></li>
               <li><Link href={`${prefix}/contacto`} className="hover:text-[color:var(--color-brand)] transition-colors">{t.contact}</Link></li>
               <li><Link href="/politica-privacidad" className="hover:text-[color:var(--color-brand)] transition-colors">Privacidad</Link></li>
               <li><Link href="/aviso-legal" className="hover:text-[color:var(--color-brand)] transition-colors">Aviso Legal</Link></li>
               <li><Link href="/cookies" className="hover:text-[color:var(--color-brand)] transition-colors">Cookies</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white mb-2">{t.newsletterTitle}</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">{t.newsletterDesc}</p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="email"
                  placeholder="your@email.com"
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
                {status === "loading" ? t.loading : t.subscribe}
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
            © {new Date().getFullYear()} {siteConfig.name}. {t.rights}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t.analyzedBy} {siteConfig.author} • {t.dataBy} CoinGecko
          </p>
        </div>
      </div>
    </footer>
  );
}