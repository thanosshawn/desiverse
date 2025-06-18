
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext'; 
import './globals.css';
import { Baloo_Bhai_2, Hind } from 'next/font/google'; 
import { ThemeProvider } from "next-themes"; 

const balooBhai2 = Baloo_Bhai_2({
  weight: ['400', '500', '700'], 
  subsets: ['latin', 'gujarati', 'vietnamese'], 
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
  title: 'DesiVerse Bae - Your Virtual Desi Companion', 
  description: 'Pyaar, dosti aur thoda flirting... all in Hinglish with your virtual Desi Bae!',
  manifest: '/manifest.json',
  themeColor: '#FF69B4', 
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`font-body antialiased ${hind.className}`}> 
        <ThemeProvider
          attribute="class"
          defaultTheme="light" 
          enableSystem={false} 
          themes={['light', 'dark', 'pink']} 
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
