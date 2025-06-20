
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext'; 
import './globals.css';
import { Baloo_Bhai_2, Hind } from 'next/font/google'; 
import { ThemeProvider } from "next-themes"; 

const balooBhai2 = Baloo_Bhai_2({
  weight: ['400', '500', '700'], 
  subsets: ['latin', 'gujarati'], 
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
  manifest: '/manifest.json', 
  themeColor: '#FF69B4', 
  appleWebAppCapable: 'yes',
  appleWebAppStatusBarStyle: 'default',
  icons: { 
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png', 
    shortcut: '/favicon-16x16.png', 
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
      </head>
      <body className={`font-body antialiased ${hind.className} selection:bg-primary selection:text-primary-foreground`}> 
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" /* Changed default to dark */
          enableSystem={false} 
          themes={['light', 'dark', 'pink']} /* Keeping all themes listed, but CSS forces dark */
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
