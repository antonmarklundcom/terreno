/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hosting target is Hostinger managed Node.js Web App.
  // NEVER use output: 'export' — we need SSR/ISR + route handlers.
  poweredByHeader: false,
  eslint: {
    // CI is the single lint gate (see .github/workflows/ci.yml). Keeping lint
    // out of `next build` means the Hostinger production build never needs the
    // ESLint devDependencies.
    ignoreDuringBuilds: true,
  },
  images: {
    // Build 1 uses a single local placeholder; no remote hotlinking.
    remotePatterns: [],
  },
};

export default nextConfig;
