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
  experimental: {
    // Next defaults its build workers to os.cpus().length - 1, which on
    // Hostinger's shared box is the physical core count of the host, not
    // this account's share. Each worker is a Node process, counted against
    // the account-wide 200 "Max Processes" cap shared by 9 apps. One worker
    // keeps a deploy from tipping the account over the cap. Same fix as
    // vendercrm PR #84, propia.node PR #81, trabajo PR #82.
    cpus: 1,
  },
};

export default nextConfig;
