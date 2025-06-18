
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
        // For Supabase Storage URLs.
        // IMPORTANT: Replace 'your-supabase-url.com' with your actual Supabase project reference + .supabase.co
        // e.g., if your project ref is 'xyzabc', the hostname is 'xyzabc.supabase.co'
        protocol: 'https',
        hostname: 'your-supabase-url.com', // Updated to match the error message's reported hostname
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
    ],
  },
};

export default nextConfig;
