import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext'; 
import './globals.css'; // Ensure globals.css is imported
// Import new fonts
import { Belleza, Alegreya } from 'next/font/google';

// Configure fonts
const belleza = Belleza({
  weight: ['400'], 
  subsets: ['latin'],
  variable: '--font-belleza', 
  display: 'swap',
});

const alegreya = Alegreya({
  weight: ['400', '500', '700'], 
  subsets: ['latin'],
  variable: '--font-alegreya', 
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DesiVerse Bae - Your Virtual Desi Companion', 
  description: 'Pyaar, dosti aur thoda flirting... all in Hinglish with your virtual Desi Bae!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${belleza.variable} ${alegreya.variable}`}>
      <head>
      </head>
      <body className={`font-body antialiased ${alegreya.className}`}> 
        <AuthProvider> 
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
