/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/TenderTouchPeds', // required for GitHub Pages project site
  output: 'export', // static export for GitHub Pages
  images: {
    unoptimized: true, // required for static export
  },
};

export default nextConfig;


