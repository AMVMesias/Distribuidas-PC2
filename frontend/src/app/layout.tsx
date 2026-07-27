import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/app/providers';
import './globals.css';

const sans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: { default: 'Nexo Park', template: '%s · Nexo Park' },
  description: 'Una experiencia clara para gestionar vehículos, ingresos y tickets de parqueadero.',
  openGraph: {
    title: 'Nexo Park',
    description: 'Tu parqueadero, sin vueltas.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Nexo Park, tu parqueadero sin vueltas' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${sans.variable} ${mono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
