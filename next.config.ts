
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
        hostname: 'bvbmmmdynvjqrajzlayw.supabase.co',
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
        // Replace 'your-project-ref.supabase.co' with your actual Supabase project reference + .supabase.co
        // e.g., if your project ref is 'abcdefg', the hostname is 'abcdefg.supabase.co'
        protocol: 'https',
        hostname: 'bvbmmmdynvjqrajzlayw.supabase.co', // IMPORTANT: Update this placeholder
        port: '',
        pathname: '/character-assets/**',
      }
    ],
  },
};

export default nextConfig;
