'use client'

import { useEffect, useState } from 'react'

interface ABTestConfig {
  testId: string
  variants: {
    [key: string]: number // variant name -> weight
  }
  defaultVariant: string
}

// Cookie helper functions
const setCookie = (name: string, value: string, days: number = 30) => {
  const date = new Date()
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`
}

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

// Random variant selector based on weights
const selectVariant = (variants: ABTestConfig['variants'], defaultVariant: string): string => {
  const weights = Object.entries(variants)
  const totalWeight = weights.reduce((sum, [_, weight]) => sum + weight, 0)
  
  if (totalWeight === 0) return defaultVariant
  
  const random = Math.random() * totalWeight
  let sum = 0
  
  for (const [variant, weight] of weights) {
    sum += weight
    if (random <= sum) return variant
  }
  
  return defaultVariant
}

// Hook for managing AB test state
export function useABTest(config: ABTestConfig) {
  const [variant, setVariant] = useState<string>(config.defaultVariant)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check for existing variant assignment
    const cookieVariant = getCookie(`ab_${config.testId}`)
    
    if (cookieVariant && Object.keys(config.variants).includes(cookieVariant)) {
      setVariant(cookieVariant)
    } else {
      // Assign new variant
      const newVariant = selectVariant(config.variants, config.defaultVariant)
      setVariant(newVariant)
      setCookie(`ab_${config.testId}`, newVariant)
      
      // Send analytics event
      try {
        if (window.gtag) {
          window.gtag('event', 'ab_test_assignment', {
            test_id: config.testId,
            variant: newVariant
          })
        }
      } catch (error) {
        console.error('Failed to send analytics event:', error)
      }
    }
    
    setIsLoaded(true)
  }, [config.testId, config.variants, config.defaultVariant])

  return { variant, isLoaded }
}

// Higher-order component for A/B testing
export function withABTest<P extends object>(
  WrappedComponent: React.ComponentType<P & { variant: string }>,
  config: ABTestConfig
) {
  return function ABTestComponent(props: P) {
    const { variant, isLoaded } = useABTest(config)

    if (!isLoaded) {
      return null // Or loading state
    }

    return <WrappedComponent {...props} variant={variant} />
  }
}

// Example usage:
/*
const TestComponent = withABTest(MyComponent, {
  testId: 'button_color',
  variants: {
    blue: 0.5,   // 50% weight
    green: 0.5   // 50% weight
  },
  defaultVariant: 'blue'
})
*/

// Hook usage example:
/*
function MyComponent() {
  const { variant, isLoaded } = useABTest({
    testId: 'pricing_layout',
    variants: {
      grid: 0.7,    // 70% weight
      list: 0.3     // 30% weight
    },
    defaultVariant: 'grid'
  })

  if (!isLoaded) return null

  return <div>Showing {variant} layout</div>
}
*/ 