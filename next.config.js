/** @type {import('next').NextConfig} */

import withPWA from "@ducanh2912/next-pwa";

const nextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
      { protocol: "https", hostname: "elfglqkqprwlenwjtfgj.supabase.co" },
    ],
  },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})(nextConfig);
