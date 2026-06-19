/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Phase 2 hosting target is Hostinger managed Node.js Web App.
  // NEVER use output: 'export' — we need SSR/ISR + route handlers.
  poweredByHeader: false,
  images: {
    // Build 1 uses a single local placeholder; no remote hotlinking.
    remotePatterns: [],
  },
};

export default nextConfig;
