import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import ThemeProvider from '@/app/components/ThemeProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-jb',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Service Desk Dashboard — YDEA',
  description: 'Dashboard live per il reparto tecnico',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="it"
      className={`h-full ${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="h-full antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
