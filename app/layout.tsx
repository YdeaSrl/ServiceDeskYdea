import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Service Desk Dashboard — YDEA',
  description: 'Dashboard live per il reparto tecnico',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
