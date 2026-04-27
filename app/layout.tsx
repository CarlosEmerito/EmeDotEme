import type { Metadata } from "next";
import { Geist, Geist_Mono, PT_Serif } from "next/font/google";
import "./globals.css";
import MarketTicker from "@/app/components/MarketTicker";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
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
          
          {/* Google AdSense */}
          <Script
            id="adsense-script"
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3054571936821093"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          /> 
          <MarketTicker />
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
<TelegramBanner />

          {/* BEGIN AADS AD UNIT 2433215 */}
          <div style={{position: "absolute", zIndex: 99999}}>
            <input autoComplete="off" type="checkbox" id="aadsstickymnnc0wg5" hidden />
            <div style={{paddingTop: 0, paddingBottom: 0}}>
              <div style={{width: "15%", height: "100%", position: "fixed", textAlign: "center", fontSize: 0, top: "50%", transform: "translateY(-50%)", left: 0, minWidth: 100}}>
                <label htmlFor="aadsstickymnnc0wg5" style={{bottom: 24, margin: "0 auto", right: 0, left: 0, maxWidth: 24, position: "absolute", borderRadius: 4, background: "rgba(248, 248, 249, 0.70)", padding: 4, zIndex: 99999, cursor: "pointer"}}>
                  <svg fill="#000000" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 490">
                    <polygon points="456.851,0 245,212.564 33.149,0 0.708,32.337 212.669,245.004 0.708,457.678 33.149,490 245,277.443 456.851,490 489.292,457.678 277.331,245.004 489.292,32.337 "/>
                  </svg>
                </label>
                <div id="frame" style={{width: "100%", margin: "auto", position: "relative", zIndex: 99998, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center"}}>
                  <div style={{width: "100%", textAlign: "center"}}>
                    <a style={{display: "inline-block", fontSize: 13, color: "#263238", padding: "4px 10px", background: "#F8F8F9", textDecoration: "none", borderRadius: "4px 4px 0 0"}}
                      id="frame-link"
                      target="_blank"
                      href="https://aads.com/campaigns/new?source_id=2433215&source_type=ad_unit&partner=2433215"
                      rel="noopener noreferrer"
                    >
                      Advertise here
                    </a>
                  </div>
                  <iframe
                    data-aa="2433215"
                    src="//acceptable.a-ads.com/2433215/?size=Adaptive"
                    title="AADS Ad"
                    style={{border: 0, padding: 0, width: "70%", height: "70%", overflow: "hidden", margin: "0 auto"}}
                  />
                </div>
              </div>
              {/* Scoped CSS for toggle functionality */}
              <style>{`
                #aadsstickymnnc0wg5:checked + div {
                  display: none;
                }
              `}</style>
            </div>
          </div>
          {/* END AADS AD UNIT 2433215 */}

          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
