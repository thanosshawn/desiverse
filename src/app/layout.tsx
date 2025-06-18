
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext'; 
import './globals.css';
import { Baloo_Bhai_2, Hind } from 'next/font/google'; // Using Baloo Bhai 2 for more weights
import { ThemeProvider } from "next-themes"; // Import ThemeProvider

const balooBhai2 = Baloo_Bhai_2({
  weight: ['400', '500', '700'], 
  subsets: ['latin', 'gujarati', 'vietnamese'], // Added more subsets for wider character support
  variable: '--font-baloo-bhai-2', 
  display: 'swap',
});

const hind = Hind({
  weight: ['400', '500', '600', '700'], 
  subsets: ['latin', 'devanagari'], // Added devanagari for Hinglish
  variable: '--font-hind', 
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DesiVerse Bae - Your Virtual Desi Companion', 
  description: 'Pyaar, dosti aur thoda flirting... all in Hinglish with your virtual Desi Bae!',
  // PWA related meta tags (can be expanded)
  manifest: '/manifest.json',
  themeColor: '#FF69B4', // Gulabi Pink
  appleWebAppCapable: 'yes',
  appleWebAppStatusBarStyle: 'default',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${balooBhai2.variable} ${hind.variable}`} suppressHydrationWarning>
      <head>
        {/* Basic PWA icons, can be improved with a generator */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`font-body antialiased ${hind.className}`}> 
        <ThemeProvider
          attribute="class"
          defaultTheme="light" // Set default theme
          enableSystem={false} // Disable system theme preference if you want explicit control
          // themes={['light', 'dark', 'pink', 'purple', 'bollywood']} // Define your themes if you have custom ones beyond light/dark
        >
          <AuthProvider> 
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
