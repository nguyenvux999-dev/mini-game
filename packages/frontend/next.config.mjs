/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy API requests to backend in development
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
      },
      {
        protocol: 'https',
        hostname: '*.devtunnels.ms',
      },
    ],
  },
};

export default nextConfig;
