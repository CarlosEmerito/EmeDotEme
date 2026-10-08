"use client";

/**
 * Carga diferida de terceros que instalan cookies.
 *
 * Nada de esto se monta hasta que el usuario ha dado su consentimiento
 * explícito. Es la diferencia entre "seguir navegando equivale a aceptar" (que
 * no vale) y un consentimiento previo de verdad.
 *
 * Se aplica tanto a Google AdSense como a la unidad de A-ADS: los dos son
 * contenido de terceros dentro de la página, y es más prudente no cargar nada
 * antes de que el usuario decida. Si algún día se verifica que A-ADS no instala
 * ningún almacenamiento (su modelo presume de ser libre de cookies), se puede
 * sacar de aquí sin tocar nada más.
 */

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, hasFullConsent } from "./consent";

const ADSENSE_CLIENT = "ca-pub-3054571936821093";
const AADS_UNIT = "2433215";

function useConsentGate(): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const update = () => setAllowed(hasFullConsent());
    update();
    window.addEventListener(CONSENT_EVENT, update);
    return () => window.removeEventListener(CONSENT_EVENT, update);
  }, []);

  return allowed;
}

/** Script de Google AdSense, solo con consentimiento. */
export function AdSenseGate() {
  const allowed = useConsentGate();
  if (!allowed) return null;

  return (
    <Script
      id="adsense-script"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

/** Unidad de publicidad de A-ADS, solo con consentimiento. */
export function AAdsGate() {
  const allowed = useConsentGate();
  if (!allowed) return null;

  return (
    <div style={{ position: "absolute", zIndex: 99999 }}>
      <input autoComplete="off" type="checkbox" id="aadsstickymnnc0wg5" hidden />
      <div style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div
          style={{
            width: "15%",
            height: "100%",
            position: "fixed",
            textAlign: "center",
            fontSize: 0,
            top: "50%",
            transform: "translateY(-50%)",
            left: 0,
            minWidth: 100,
          }}
        >
          <label
            htmlFor="aadsstickymnnc0wg5"
            style={{
              bottom: 24,
              margin: "0 auto",
              right: 0,
              left: 0,
              maxWidth: 24,
              position: "absolute",
              borderRadius: 4,
              background: "rgba(248, 248, 249, 0.70)",
              padding: 4,
              zIndex: 99999,
              cursor: "pointer",
            }}
          >
            <svg
              fill="#000000"
              height="16px"
              width="16px"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 490 490"
            >
              <polygon points="456.851,0 245,212.564 33.149,0 0.708,32.337 212.669,245.004 0.708,457.678 33.149,490 245,277.443 456.851,490 489.292,457.678 277.331,245.004 489.292,32.337" />
            </svg>
          </label>
          <div
            id="frame"
            style={{
              width: "100%",
              margin: "auto",
              position: "relative",
              zIndex: 99998,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "100%", textAlign: "center" }}>
              <a
                style={{
                  display: "inline-block",
                  fontSize: 13,
                  color: "#263238",
                  padding: "4px 10px",
                  background: "#F8F8F9",
                  textDecoration: "none",
                  borderRadius: "4px 4px 0 0",
                }}
                id="frame-link"
                target="_blank"
                href={`https://aads.com/campaigns/new?source_id=${AADS_UNIT}&source_type=ad_unit&partner=${AADS_UNIT}`}
                rel="noopener noreferrer"
              >
                Advertise here
              </a>
            </div>
            <iframe
              data-aa={AADS_UNIT}
              src={`//acceptable.a-ads.com/${AADS_UNIT}/?size=Adaptive`}
              title="AADS Ad"
              style={{
                border: 0,
                padding: 0,
                width: "70%",
                height: "70%",
                overflow: "hidden",
                margin: "0 auto",
              }}
            />
          </div>
        </div>
        <style>{`
          #aadsstickymnnc0wg5:checked + div {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
}
