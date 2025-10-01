const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination:
          "https://blog-sphere-backend-ruby.vercel.app/api/v1/:path*",
      },
      {
        source: "/api-docs",
        destination: "https://blog-sphere-backend-ruby.vercel.app/api-docs",
      },
    ];
  },
};

export default nextConfig;
