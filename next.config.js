/** @type {import('next').NextConfig} */

import withPWA from "@ducanh2912/next-pwa";

const nextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'elfglqkqprwlenwjtfgj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
  async redirects() {
    return [
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
      {
        source: '/en/index',
        destination: '/en',
        permanent: true,
      },
      // English Route Renames
      {
        source: '/en/articulo/:path*',
        destination: '/en/article/:path*',
        permanent: true,
      },
      {
        source: '/en/buscar',
        destination: '/en/search',
        permanent: true,
      },
      {
        source: '/en/categoria/:path*',
        destination: '/en/category/:path*',
        permanent: true,
      },
      {
        source: '/en/contacto',
        destination: '/en/contact',
        permanent: true,
      },
      {
        source: '/en/noticias',
        destination: '/en/news',
        permanent: true,
      },
      {
        source: '/en/sobre-mi',
        destination: '/en/about-me',
        permanent: true,
      },
      {
        source: '/en/criptomonedas/:path*',
        destination: '/en/cryptocurrencies/:path*',
        permanent: true,
      },
    ];
  },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /\.(?:eot|ttf|woff|woff2)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-fonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\/articulo\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'article-pages',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 15,
      },
    },
    {
      urlPattern: /^https:\/\/elfglqkqprwlenwjtfgj\.supabase\.co\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'supabase-assets',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
  ],
  fallbacks: {
    document: '/_offline', // Página offline personalizada (opcional)
  },
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);
