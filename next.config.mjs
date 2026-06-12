/** @type {import('next').NextConfig} */

// Same-origin API proxy (2026-06): the browser talks only to this FE origin at
// `/api/v1/*`; Next forwards server-side to the real BE. This makes the session
// cookie FIRST-PARTY on the FE domain, so Safari/iOS (which blocks cross-site
// cookies via ITP) keeps the user logged in. Set BACKEND_ORIGIN in Vercel to
// override the target; the fallback is the deployed BE.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? 'https://ums-helpdesk-api.vercel.app';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;