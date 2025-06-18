
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
      { // For Google User Avatars
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        // For Supabase Storage URLs from seed data or if this placeholder is in use.
        // The error specifically mentions "your-supabase-url.com".
        protocol: 'https',
        hostname: 'your-supabase-url.com',
        port: '',
        pathname: '/**', // Allows any path under this hostname
      },
      {
        // For the original Supabase placeholder from initial config or actual Supabase URL if configured.
        // Replace 'bvbmmmdynvjqrajzlayw.supabase.co' with your actual Supabase project reference + .supabase.co
        protocol: 'https',
        hostname: 'bvbmmmdynvjqrajzlayw.supabase.co',
        port: '',
        pathname: '/**', // Allows any path under this hostname
      }
    ],
  },
};

export default nextConfig;
