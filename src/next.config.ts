
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
        hostname: 'placehold.co', // Added for admin character creation defaults
        port: '',
        pathname: '/**',
      },
      { // For Google User Avatars
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        // For Supabase Storage URLs from seed data or if this placeholder is in use.
        protocol: 'https',
        hostname: 'your-supabase-url.com', // Keeping this if it's used for specific assets or a CNAME
        port: '',
        pathname: '/**', 
      },
      {
        // Primary Supabase URL
        protocol: 'https',
        hostname: 'bvbmmmdynvjqrajzlayw.supabase.co', 
        port: '',
        pathname: '/**', 
      }
    ],
  },
};

export default nextConfig;
