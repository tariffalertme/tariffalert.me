import { cn } from '@/lib/utils'
import { ComponentPropsWithoutRef, ElementType, forwardRef } from 'react'

type TextElement = 'p' | 'span' | 'div'
type TextSize = 'xl' | 'lg' | 'md' | 'sm' | 'xs'
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'
type TextLeading = 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'

type TextProps<T extends TextElement = 'p'> = {
  as?: T
  size?: TextSize
  weight?: TextWeight
  leading?: TextLeading
  className?: string
} & ComponentPropsWithoutRef<T>

const sizeClasses: Record<TextSize, string> = {
  xl: 'text-xl sm:text-2xl',
  lg: 'text-lg sm:text-xl',
  md: 'text-base sm:text-lg',
  sm: 'text-sm sm:text-base',
  xs: 'text-xs sm:text-sm',
}

const weightClasses: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

const leadingClasses: Record<TextLeading, string> = {
  none: 'leading-none',
  tight: 'leading-tight',
  snug: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ 
    as: Component = 'p', 
    size = 'md', 
    weight = 'normal',
    leading = 'normal',
    className, 
    ...props 
  }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          sizeClasses[size],
          weightClasses[weight],
          leadingClasses[leading],
          className
        )}
        {...props}
      />
    )
  }
)

Text.displayName = 'Text' 