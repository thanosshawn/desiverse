
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext'; 
import './globals.css';
import { Baloo_Bhai_2, Hind } from 'next/font/google'; 
import { ThemeProvider } from "next-themes"; 

const balooBhai2 = Baloo_Bhai_2({
  weight: ['400', '500', '700'], 
  subsets: ['latin', 'gujarati'], // Removed 'vietnamese' as it might not be needed
  variable: '--font-baloo-bhai-2', 
  display: 'swap',
});

const hind = Hind({
  weight: ['400', '500', '600', '700'], 
  subsets: ['latin', 'devanagari'], 
  variable: '--font-hind', 
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DesiVerse Bae - Your Virtual Desi Companion 💖', 
  description: 'Pyaar, dosti aur thoda flirting... all in Hinglish with your virtual Desi Bae! Experience a new world of AI companionship.',
  manifest: '/manifest.json', // Ensure this file exists in public
  themeColor: '#FF69B4', // A default theme color (Hot Pink, can be overridden by CSS themes)
  appleWebAppCapable: 'yes',
  appleWebAppStatusBarStyle: 'default',
  icons: { // Enhanced icons for PWA
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png', // Ensure this exists in public
    shortcut: '/favicon-16x16.png', // Ensure this exists
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${balooBhai2.variable} ${hind.variable}`} suppressHydrationWarning>
      <head>
        {/* Favicon links are now in metadata, but can keep critical ones here if needed */}
        {/* <link rel="icon" href="/favicon.ico" sizes="any" /> */}
        {/* <link rel="icon" href="/icon.svg" type="image/svg+xml" /> */}
        {/* <link rel="apple-touch-icon" href="/apple-touch-icon.png" /> */}
      </head>
      <body className={`font-body antialiased ${hind.className} selection:bg-primary selection:text-primary-foreground`}> 
        <ThemeProvider
          attribute="class"
          defaultTheme="light" 
          enableSystem={false} // Explicitly disable system theme if we manage themes fully
          themes={['light', 'dark', 'pink']} // Added 'pink' theme
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
