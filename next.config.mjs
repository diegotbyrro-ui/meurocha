import fs from 'node:fs';
import path from 'node:path';

/** @type {import('next').NextConfig} */
const config = {
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    const manifestPath = path.join(process.cwd(), 'site-mirror-manifest.json');
    if (!fs.existsSync(manifestPath)) return [];
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const pages = (manifest.pages || []).filter((p) => p.route && p.staticPath);
    return { beforeFiles: [
      { source: '/', destination: '/espelho/home/index.html' },
      ...pages.filter((p) => p.route !== '/').map((p) => ({ source: p.route, destination: p.staticPath })),
    ], afterFiles: [], fallback: [] };
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] }];
  },
};
export default config;
