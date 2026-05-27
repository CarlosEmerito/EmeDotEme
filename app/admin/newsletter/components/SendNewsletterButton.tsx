"use client";

import { useState } from "react";
import { sendNewsletterNow } from "../actions";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function SendNewsletterButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!confirm("¿Estás seguro de que quieres enviar la newsletter semanal a todos los suscriptores activos ahora?")) {
      return;
    }

    setStatus("loading");
    const res = await sendNewsletterNow();

    if (res.success) {
      setStatus("success");
      setMessage(res.message || "Newsletter enviada correctamente.");
      setTimeout(() => setStatus("idle"), 5000);
    } else {
      setStatus("error");
      setMessage(res.error || "Error al enviar la newsletter.");
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSend}
        disabled={status === "loading"}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm ${
          status === "loading"
            ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
            : "bg-[color:var(--color-brand)] text-white hover:opacity-90 active:scale-95"
        }`}
      >
        {status === "loading" ? (
          <>
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent animate-spin rounded-full" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Enviar Newsletter Semanal
          </>
        )}
      </button>

      {status === "success" && (
        <p className="text-xs font-bold text-green-600 flex items-center gap-1 transition-all duration-300">
          <CheckCircle2 className="w-3.4 h-3" />
          {message}
        </p>
      )}

      {status === "error" && (
        <p className="text-xs font-bold text-red-500 flex items-center gap-1 transition-all duration-300">
          <AlertCircle className="w-3.4 h-3" />
          {message}
        </p>
      )}
    </div>
  );
}
