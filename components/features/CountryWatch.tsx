'use client'

import { useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'

interface CountryWatchProps {
  countryCode: string
  countryName: string
  isWatching?: boolean
  onSubscribe?: (email: string) => Promise<void>
  onUnsubscribe?: () => Promise<void>
}

export default function CountryWatch({
  countryCode,
  countryName,
  isWatching = false,
  onSubscribe,
  onUnsubscribe
}: CountryWatchProps) {
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !onSubscribe) return

    setIsLoading(true)
    setError(null)
    
    try {
      await onSubscribe(email)
      setSuccess(true)
      setShowEmailInput(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    if (!onUnsubscribe) return

    setIsLoading(true)
    setError(null)
    
    try {
      await onUnsubscribe()
      setSuccess(false)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Watch {countryName}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Get notified about tariff changes
          </p>
        </div>
        <button
          onClick={() => isWatching ? handleUnsubscribe() : setShowEmailInput(true)}
          className={`rounded-full p-2 ${
            isWatching 
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isWatching ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </button>
      </div>

      {showEmailInput && !isWatching && (
        <form onSubmit={handleSubscribe} className="mt-4">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={isLoading || !email}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Subscribe'
              )}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-2 text-sm text-green-600">
          Successfully subscribed to updates for {countryName}
        </p>
      )}
    </div>
  )
} 