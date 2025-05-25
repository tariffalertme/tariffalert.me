'use client'

interface BannerLayoutProps {
  children: React.ReactNode
}

export default function BannerLayout({ children }: BannerLayoutProps) {
  return (
    <div className="relative flex justify-center overflow-x-hidden">
      {/* Left Banner */}
      <div className="hidden lg:block fixed left-0 top-1/2 -translate-y-1/2 w-[120px] h-[240px] bg-gray-200 z-20">
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
          Ad Space
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full lg:max-w-[calc(100%-240px)] lg:mx-[120px]">
        {children}
      </div>

      {/* Right Banner */}
      <div className="hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 w-[120px] h-[240px] bg-gray-200 z-20">
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
          Ad Space
        </div>
      </div>
    </div>
  )
} 