/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep defaults; explicitly disable server actions for now (we'll use route handlers).
    serverActions: false
  }
};

export default nextConfig;

