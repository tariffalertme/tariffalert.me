'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button
        className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  )
} 