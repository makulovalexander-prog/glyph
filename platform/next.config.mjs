/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Hero art / venue logos are served from object storage (S3/R2) in production.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  experimental: {
    // Keep server actions bodies small; image bytes go through the upload endpoint.
    serverActions: { bodySizeLimit: "1mb" },
  },
};

export default nextConfig;
