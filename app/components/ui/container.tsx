import { cn } from '@/lib/utils'
import { ComponentPropsWithoutRef, ElementType, forwardRef } from 'react'

type ContainerProps<T extends ElementType = 'div'> = {
  as?: T
  className?: string
} & ComponentPropsWithoutRef<T>

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ as: Component = 'div', className, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn('container mx-auto px-4 sm:px-6 lg:px-8', className)}
        {...props}
      />
    )
  }
)

Container.displayName = 'Container' 