import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { MainLayout } from '../components/layout/MainLayout';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TariffAlert - Track Import Duties and Product Prices',
  description: 'Monitor import duties, track product prices, and stay updated on market changes across different regions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
} 