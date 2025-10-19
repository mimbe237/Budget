import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Optimisations de performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configuration pour améliorer les performances de build
  experimental: {
    optimizePackageImports: ['lucide-react', '@/components/ui'],
  },
  // Compression et optimisation
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
