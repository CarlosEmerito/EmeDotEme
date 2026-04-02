import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MarketTicker from "./components/MarketTicker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EmeDotEme - El Portal Automatizado de Noticias Cripto",
  description: "EmeDotEme es tu fuente principal de noticias sobre Bitcoin, Web3 y tecnología blockchain, generadas y curadas por Inteligencia Artificial.",
  keywords: ["Criptomonedas", "Bitcoin", "Web3", "Ethereum", "Noticias Cripto", "IA"],
  openGraph: {
    title: "EmeDotEme - Noticias Cripto",
    description: "Tu portal automatizado de noticias y datos del mercado cripto.",
    url: "https://emedoteme.com",
    siteName: "EmeDotEme",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EmeDotEme - Noticias Cripto",
    description: "Tu portal automatizado de noticias y datos del mercado cripto.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-950 text-black dark:text-white">
        {/* Ticker in live layout */}
        <MarketTicker />
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="max-w-7xl mx-auto flex h-14 items-center px-4">
            <div className="mr-4 hidden md:flex">
              <a className="mr-6 flex items-center space-x-2" href="/">
                <span className="hidden font-bold sm:inline-block text-xl">
                  EmeDotEme
                </span>
              </a>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <a className="transition-colors hover:text-blue-600 dark:hover:text-blue-400" href="/mercados">Mercados</a>
                <a className="transition-colors hover:text-blue-600 dark:hover:text-blue-400" href="/tecnologia">Tecnología</a>
                <a className="transition-colors hover:text-blue-600 dark:hover:text-blue-400" href="/web3">Web3</a>
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 md:py-0">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4">
            <p className="text-center text-sm leading-loose text-zinc-600 dark:text-zinc-400 md:text-left">
              Built by EmeDotEme AI. Datos provistos por CoinGecko.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
