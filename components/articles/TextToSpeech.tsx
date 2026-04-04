"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square } from "lucide-react";

export function TextToSpeech({ text, title, lang = "es" }: { text: string; title: string; lang?: "es" | "en" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!isSupported) return;
    
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = text;
    const cleanText = tempDiv.textContent || tempDiv.innerText || "";
    
    const newUtterance = new SpeechSynthesisUtterance(`${title}. ${cleanText}`);
    newUtterance.lang = lang === "en" ? "en-US" : "es-ES";
    newUtterance.rate = 1.0;
    newUtterance.onend = () => setIsPlaying(false);
    
    utteranceRef.current = newUtterance;
  }, [text, title, lang, isSupported]);

  const togglePlay = () => {
    if (!utteranceRef.current || !isSupported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      if (utteranceRef.current) {
        window.speechSynthesis.speak(utteranceRef.current);
        setIsPlaying(true);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={togglePlay}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-colors border shadow-sm ${
        isPlaying 
          ? "bg-zinc-800 text-white border-zinc-900 dark:bg-white dark:text-black dark:border-zinc-100" 
          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800"
      }`}
      title={isPlaying ? "Detener lectura" : "Escuchar artículo"}
    >
      {isPlaying ? (
        <>
          <Square size={16} fill="currentColor" />
          <span>{lang === "es" ? "Detener" : "Stop"}</span>
        </>
      ) : (
        <>
          <Play size={16} fill="currentColor" />
          <span>{lang === "es" ? "Escuchar artículo" : "Listen to article"}</span>
        </>
      )}
    </button>
  );
}