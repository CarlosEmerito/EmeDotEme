"use client";

import React, { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { useShareTracking } from "@/hooks/useAnalytics";
import { Copy, Check } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

type SharePlatform = 'twitter' | 'linkedin' | 'whatsapp' | 'facebook' | 'telegram' | 'reddit' | 'email' | 'copy';

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const { trackShare } = useShareTracking();

  useEffect(() => {
    setUrl(`${window.location.origin}/articulo/${slug}`);
  }, [slug]);

  const handleShareClick = (platform: SharePlatform) => {
    trackShare(platform, url, title);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackShare('copy', url, title);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!url) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const twitterHandle = siteConfig.links.twitter.split('/').pop();

  const shareButtons: Array<{
    platform: SharePlatform;
    label: string;
    href: string;
    color: string;
    icon: React.ReactElement;
  }> = [
    {
      platform: 'twitter',
      label: 'Compartir en Twitter',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=${twitterHandle}`,
      color: 'hover:bg-[#1DA1F2]',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.319H5.078z" />
        </svg>
      ),
    },
    {
      platform: 'linkedin',
      label: 'Compartir en LinkedIn',
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      color: 'hover:bg-[#0A66C2]',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    },
    {
      platform: 'whatsapp',
      label: 'Compartir en WhatsApp',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'hover:bg-[#25D366]',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      ),
    },
    {
      platform: 'facebook',
      label: 'Compartir en Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:bg-[#1877F2]',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      platform: 'telegram',
      label: 'Compartir en Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'hover:bg-[#0088CC]',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.69 1.02-.59.05-1.04-.39-1.62-.76-.9-.59-1.41-.96-2.28-1.54-1-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.06-.2-.07-.06-.17-.04-.24-.02-.1.02-1.79 1.14-5.06 3.35-.48.33-.92.49-1.31.48-.43-.01-1.27-.24-1.89-.44-.76-.24-1.36-.37-1.31-.78.03-.2.32-.41.89-.62 3.47-1.49 5.78-2.47 6.94-2.99 3.05-1.36 3.68-1.59 4.1-1.59.09 0 .29.02.42.12.1.08.13.19.14.27-.01.06.01.28 0 .49z"/>
        </svg>
      ),
    },
    {
      platform: 'reddit',
      label: 'Compartir en Reddit',
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      color: 'hover:bg-[#FF4500]',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.75-1.64-6.07-1.72.08-1.1.4-3.05 1.52-3.7.72-.4 1.63-.24 2 .34.47.73.39 1.78-.2 2.36-.56.56-1.54.62-2.16.2-.27-.2-.43-.5-.48-.8-.86.06-1.67.27-2.44.57-1.2.5-2.26 1.16-3.14 1.96C3.23 10.64 2.5 12.38 2.5 14.5c0 3.13 2.87 5.5 6.5 5.5 1.38 0 2.67-.5 3.66-1.3.72.23 1.5.36 2.34.36s1.62-.13 2.34-.36c.99.8 2.28 1.3 3.66 1.3 3.63 0 6.5-2.37 6.5-5.5 0-2.12-.73-3.86-1.9-5.1.56-.76 1.48-1.24 2.4-1.24 1.65 0 3 1.35 3 3 0 .65-.2 1.25-.56 1.74.37 1.24.56 2.56.56 3.96 0 5.52-4.48 10-10 10s-10-4.48-10-10c0-1.4.19-2.72.56-3.96-.36-.49-.56-1.09-.56-1.74 0-1.65 1.35-3 3-3 .92 0 1.84.48 2.4 1.24 1.17 1.24 1.9 2.98 1.9 5.1 0 3.13 2.87 5.5 6.5 5.5 2.24 0 4.22-1.24 5.24-3.12.43.15.88.24 1.36.24 1.92 0 3.5-1.58 3.5-3.5 0-1.16-.56-2.18-1.42-2.83.3-.7.42-1.5.42-2.33 0-2.85-1.55-5.36-3.85-6.73-.92-.55-2-.85-3.15-.85-1.15 0-2.23.3-3.15.85-2.3 1.37-3.85 3.88-3.85 6.73 0 .83.12 1.63.42 2.33-.86.65-1.42 1.67-1.42 2.83 0 1.92 1.58 3.5 3.5 3.5.48 0 .93-.09 1.36-.24 1.02 1.88 3 3.12 5.24 3.12 2.62 0 4.75-2.13 4.75-4.75 0-1.4-.61-2.66-1.58-3.53.36-.49.58-1.09.58-1.74z"/>
        </svg>
      ),
    },
    {
      platform: 'email',
      label: 'Compartir por Email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedTitle}%20${encodedUrl}`,
      color: 'hover:bg-[#EA4335]',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {shareButtons.map((button) => (
        <a
          key={button.platform}
          href={button.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-white transition-colors ${button.color}`}
          aria-label={button.label}
          onClick={() => handleShareClick(button.platform)}
        >
          {button.icon}
        </a>
      ))}
      
      <button
        type="button"
        onClick={handleCopyLink}
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-emerald-500 hover:text-white transition-colors ${copied ? 'bg-emerald-500 text-white' : ''}`}
        aria-label={copied ? "Enlace copiado" : "Copiar enlace"}
        title={copied ? "Enlace copiado" : "Copiar enlace al portapapeles"}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
