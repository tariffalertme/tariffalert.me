import { cn } from '@/lib/utils'
import { ComponentPropsWithoutRef, ElementType, forwardRef } from 'react'

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
type HeadingSize = 'xl' | 'lg' | 'md' | 'sm' | 'xs'

type HeadingProps<T extends HeadingLevel = 'h1'> = {
  as?: T
  size?: HeadingSize
  className?: string
} & ComponentPropsWithoutRef<T>

const sizeClasses: Record<HeadingSize, string> = {
  xl: 'text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight',
  lg: 'text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight',
  md: 'text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight',
  sm: 'text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight',
  xs: 'text-lg sm:text-xl lg:text-2xl font-bold tracking-tight',
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ as: Component = 'h1', size = 'lg', className, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(sizeClasses[size], className)}
        {...props}
      />
    )
  }
)

Heading.displayName = 'Heading' 