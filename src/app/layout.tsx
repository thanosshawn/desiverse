import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
import './globals.css';
// Import new fonts
import { Belleza, Alegreya } from 'next/font/google';

// Configure fonts
const belleza = Belleza({
  weight: ['400'], // Belleza typically comes in one weight
  subsets: ['latin'],
  variable: '--font-belleza', // Optional: if you want to use CSS variables
  display: 'swap',
});

const alegreya = Alegreya({
  weight: ['400', '500', '700'], // Alegreya has multiple weights
  subsets: ['latin'],
  variable: '--font-alegreya', // Optional
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DesiVerse Bae - Your Virtual Desi Companion', // Updated app name
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
        {/* Google Fonts CDN links are not needed if using next/font */}
      </head>
      <body className={`font-body antialiased ${alegreya.className}`}> {/* Apply Alegreya to body */}
        <AuthProvider> {/* Wrap children with AuthProvider */}
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
