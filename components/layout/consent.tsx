"use client";

/**
 * Consentimiento de cookies.
 *
 * Reglas que implementa este módulo:
 * - **Nada no esencial se carga antes de que el usuario decida.** El script de
 *   AdSense y el resto de terceros con cookies se montan solo después de un
 *   consentimiento explícito.
 * - **Aceptar y rechazar tienen la misma prominencia.** Un banner donde
 *   "aceptar" es un botón grande y "rechazar" un enlace escondido no vale
 *   (art. 22.2 LSSI y directrices de la AEPD).
 * - **La decisión se puede cambiar** en cualquier momento desde el enlace del pie
 *   de página.
 *
 * El consentimiento se guarda en localStorage (no en cookie) para no instalar
 * nada antes de que el usuario decida, y se avisa al resto de la aplicación con
 * un evento propio.
 */

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "eme-cookie-consent-v1";
export const CONSENT_EVENT = "eme-consent-change";

/**
 * Contador de reaperturas del aviso. Vive fuera de React para que el enlace del
 * pie de página pueda reabrir el banner sin pasar por un estado global.
 */
let reopenVersion = 0;

export type ConsentValue = "all" | "essential";

/** Lee la decisión guardada. `null` significa que todavía no ha decidido. */
export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "all" || raw === "essential") return raw;
  } catch {
    /* almacenamiento bloqueado (modo privado estricto): se trata como no decidido */
  }
  return null;
}

/** ¿Ha aceptado el usuario los terceros con cookies? */
export function hasFullConsent(): boolean {
  return getConsent() === "all";
}

function storeConsent(value: ConsentValue) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* si no se puede guardar, la decisión vale solo para esta visita */
  }
  window.dispatchEvent(new CustomEvent<ConsentValue>(CONSENT_EVENT, { detail: value }));
}

/** Reabre el banner para cambiar la decisión (enlace del pie de página). */
export function openConsentBanner() {
  reopenVersion += 1;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: "reopen" }));
}

/**
 * El estado del banner vive fuera de React (localStorage + eventos), así que se
 * lee con `useSyncExternalStore` en vez de con un `useEffect` que llame a
 * `setState`: eso último provoca renders en cascada y está desaconsejado.
 */
function subscribeToConsent(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  return () => window.removeEventListener(CONSENT_EVENT, callback);
}

/** Instantánea estable: "decisión:versión de reapertura". */
function getConsentSnapshot(): string {
  return `${getConsent() ?? "unset"}:${reopenVersion}`;
}

/** En el servidor no hay localStorage: nunca hay nada que mostrar. */
function getConsentServerSnapshot(): string {
  return "server:0";
}

export function CookieConsent() {
  const pathname = usePathname();
  const en = pathname?.startsWith("/en") ?? false;

  const snapshot = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getConsentServerSnapshot
  );
  const [consent, version] = snapshot.split(":");

  // Se muestra si todavía no ha decidido, o si ha pedido reabrir el aviso.
  const visible = consent === "unset" || version !== "0";

  const decide = useCallback((value: ConsentValue) => {
    reopenVersion = 0;
    storeConsent(value);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={en ? "Cookie consent" : "Consentimiento de cookies"}
      className="fixed bottom-0 left-0 right-0 z-[100000] p-4 sm:p-5 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]"
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-black dark:text-white mb-1">
            {en ? "Cookies and advertising" : "Cookies y publicidad"}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {en ? (
              <>
                We use our own cookies that are necessary for the site to work. With your
                permission we would also use third-party cookies to serve advertising and
                measure traffic. If you decline, you will still see advertising, but not
                personalised advertising. You can change your decision at any time from{" "}
                <Link href="/en/cookies" className="underline hover:text-[color:var(--color-brand)]">
                  the cookie policy
                </Link>
                .
              </>
            ) : (
              <>
                Usamos cookies propias necesarias para que la web funcione. Con tu permiso
                usaríamos además cookies de terceros para mostrar publicidad y medir visitas.
                Si rechazas, seguirás viendo publicidad, pero no personalizada. Puedes cambiar
                tu decisión cuando quieras desde{" "}
                <Link href="/cookies" className="underline hover:text-[color:var(--color-brand)]">
                  la política de cookies
                </Link>
                .
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => decide("all")}
            className="flex-1 px-5 py-3 text-sm font-semibold rounded-md bg-[color:var(--color-brand)] text-white hover:opacity-90 transition-opacity"
          >
            {en ? "Accept all" : "Aceptar todas"}
          </button>
          <button
            type="button"
            onClick={() => decide("essential")}
            className="flex-1 px-5 py-3 text-sm font-semibold rounded-md border border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {en ? "Essential only" : "Solo las necesarias"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Enlace para reabrir el banner. Va en el pie de página: la normativa exige que
 * retirar el consentimiento sea tan fácil como darlo.
 */
export function CookieSettingsLink({
  className = "",
  label = "Configurar cookies",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button type="button" onClick={openConsentBanner} className={className}>
      {label}
    </button>
  );
}
