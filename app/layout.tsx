import type { Metadata } from "next";
import { Geist, Geist_Mono, PT_Serif } from "next/font/google";
import "./globals.css";
import MarketTicker from "@/app/components/MarketTicker";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieConsent } from "@/components/layout/consent";
import { AdSenseGate, AAdsGate } from "@/components/layout/ThirdPartyGates";
import { Providers } from "@/components/providers";
import { TelegramBanner } from "@/components/TelegramBanner";
import { WebSiteSchema } from "@/components/seo/WebSiteSchema";
import { LanguageSync } from "@/components/layout/LanguageSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [
    {
      name: siteConfig.author,
      url: `${siteConfig.url}/sobre-mi`,
    },
  ],
  creator: siteConfig.author,
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og.jpg`, // Asegúrate de tener esta imagen en /public
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og.jpg`],
    creator: "@EmeDotEme",
  },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": `${siteConfig.url}/feed.xml`,
    },
  },
  manifest: "/manifest.json",
  icons: {
    apple: "/android-chrome-192x192.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${ptSerif.variable} h-full antialiased`}
    >
      <head>
                      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-950 text-black dark:text-white">
        <LanguageSync />
        <Providers>
          {/* Schema.org Structured Data */}
          <WebSiteSchema 
            siteUrl={siteConfig.url}
            siteName={siteConfig.name}
            siteDescription={siteConfig.description}
          />
          
          {/* Google AdSense: solo se carga tras el consentimiento del usuario */}
          <AdSenseGate />
          <MarketTicker />
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
<TelegramBanner />

          {/* Unidad de publicidad de A-ADS: también tras el consentimiento */}
          <AAdsGate />

          {/*
            Vercel Analytics y Speed Insights no instalan cookies (identifican la
            visita con un hash anónimo de la petición), así que no van detrás del
            consentimiento. Si algún día se activa algo que sí las use, debe
            moverse a ThirdPartyGates.tsx.
          */}
          <Analytics />
          <SpeedInsights />

          {/* Banner de consentimiento: aparece solo si el usuario aún no ha decidido */}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
