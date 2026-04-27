"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function TelegramBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const lang = pathname?.startsWith("/en") ? "en" : "es";

  useEffect(() => {
    // Retrasar la aparición del banner unos segundos para no ser invasivo
    const timer = setTimeout(() => {
      const bannerClosed = sessionStorage.getItem("telegram_banner_closed");
      if (!bannerClosed) {
        setIsVisible(true);
      }
    }, 5000); // 5 segundos

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem("telegram_banner_closed", "true");
  };

  if (!isVisible) return null;

  const t = {
    es: {
      title: "¡Alertas en Tiempo Real! 🚀",
      description: "Únete gratis a nuestro canal de Telegram y no te pierdas ningún movimiento del mercado.",
      button: "Unirme Gratis",
      close: "Cerrar"
    },
    en: {
      title: "Real-Time Alerts! 🚀",
      description: "Join our free Telegram channel and never miss a market move.",
      button: "Join for Free",
      close: "Close"
    }
  }[lang];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-full duration-500">
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-400/30">
        <div className="flex items-center gap-4 text-white">
          <div className="bg-white/20 p-2 rounded-full hidden sm:block">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.305-.346-.113l-6.4 4.02-2.76-.86c-.6-.185-.613-.6.125-.89l10.736-4.136c.498-.223.965.114.825.82z"/>
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-lg leading-tight">{t.title}</h4>
            <p className="text-blue-100 text-sm">{t.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <a 
            href="https://t.me/EmeDotEmeNews"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none whitespace-nowrap bg-white text-blue-600 hover:bg-blue-50 transition-colors px-6 py-2 rounded-full font-bold shadow-lg"
          >
            {t.button}
          </a>
          <button 
            onClick={handleClose}
            className="text-white/70 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors"
            aria-label={t.close}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
