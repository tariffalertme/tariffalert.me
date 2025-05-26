'use client'

import { useEffect } from 'react'

interface BannerLayoutProps {
  children: React.ReactNode
}

export default function BannerLayout({ children }: BannerLayoutProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-expect-error
      if (window.adsbygoogle) {
        try {
          // @ts-expect-error
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {}
      }
    }
  }, []);
  return (
    <div className="relative flex justify-center overflow-x-hidden">
      {/* Left Banner */}
      <div className="hidden lg:block fixed left-0 top-1/2 -translate-y-1/2 w-[120px] h-[240px] bg-gray-200 z-20">
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
          <div>
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3704612965635562" crossOrigin="anonymous"></script>
            <ins className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-3704612965635562"
              data-ad-slot="6087471559"
              data-ad-format="auto"
              data-full-width-responsive="true"></ins>
            <script dangerouslySetInnerHTML={{ __html: '(adsbygoogle = window.adsbygoogle || []).push({});' }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full lg:max-w-[calc(100%-240px)] lg:mx-[120px]">
        {children}
      </div>

      {/* Right Banner */}
      <div className="hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 w-[120px] h-[240px] bg-gray-200 z-20">
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
          <div>
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3704612965635562" crossOrigin="anonymous"></script>
            <ins className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-3704612965635562"
              data-ad-slot="6087471559"
              data-ad-format="auto"
              data-full-width-responsive="true"></ins>
            <script dangerouslySetInnerHTML={{ __html: '(adsbygoogle = window.adsbygoogle || []).push({});' }} />
          </div>
        </div>
      </div>
    </div>
  )
} 