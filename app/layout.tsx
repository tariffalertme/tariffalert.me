import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import TwitterFeed from '@/components/layout/TwitterFeed'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TariffAlert.me',
  description: 'Stay informed about tariff changes and trade policies.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense Verification */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3704612965635562"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <div className="fixed top-16 w-full z-20">
            <TwitterFeed />
          </div>
          <main className="mt-32 flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
} 