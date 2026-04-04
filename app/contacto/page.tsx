"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("¡Mensaje enviado correctamente! Te responderemos pronto.");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
        setMessage(data.error || "Hubo un error al enviar el mensaje.");
      }
    } catch (error) {
      console.error("Contact form submission error:", error);
      setStatus("error");
      setMessage("Error de conexión. Intenta de nuevo.");
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <header className="mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-4">Contacto</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            ¿Tienes preguntas, sugerencias o quieres colaborar? Escríbenos y te responderemos lo antes posible.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white text-sm rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white text-sm rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-2">
                  Mensaje *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white text-sm rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)] resize-none"
                  placeholder="Escribe tu mensaje aquí..."
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-[color:var(--color-brand)] hover:opacity-90 text-white font-medium text-sm rounded-md px-8 py-3.5 transition-opacity disabled:opacity-50 w-full lg:w-auto"
              >
                {status === "loading" ? "Enviando..." : "Enviar mensaje"}
              </button>

              {status !== "idle" && (
                <div className={`p-4 rounded-md ${status === "success" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"}`}>
                  {message}
                </div>
              )}
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-bold font-serif text-black dark:text-white mb-4">Información de contacto</h3>
              <ul className="space-y-4">
                <li>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Email</h4>
                  <a href={siteConfig.links.email} className="text-[color:var(--color-brand)] hover:underline">
                    carlosemerito13@gmail.com
                  </a>
                </li>
                <li>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Redes sociales</h4>
                  <div className="flex flex-wrap gap-3">
                    <a href={siteConfig.links.twitter} target="_blank" rel="noreferrer" className="text-[color:var(--color-brand)] hover:underline">
                      X / Twitter
                    </a>
                    <a href={siteConfig.links.bluesky} target="_blank" rel="noreferrer" className="text-[color:var(--color-brand)] hover:underline">
                      Bluesky
                    </a>
                    <a href={siteConfig.links.linkedin} target="_blank" rel="noreferrer" className="text-[color:var(--color-brand)] hover:underline">
                      LinkedIn
                    </a>
                    <a href={siteConfig.links.github} target="_blank" rel="noreferrer" className="text-[color:var(--color-brand)] hover:underline">
                      GitHub
                    </a>
                  </div>
                </li>
                <li>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Ubicación</h4>
                  <p className="text-zinc-800 dark:text-zinc-300">España</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}