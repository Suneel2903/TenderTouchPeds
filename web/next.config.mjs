/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Do NOT use static export - we need dynamic rendering for admin panel
  // output: 'export' is NOT set, so Next.js will run in standard mode
};

export default nextConfig;


