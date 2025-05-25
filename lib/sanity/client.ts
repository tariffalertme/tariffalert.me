import { createClient } from 'next-sanity'

const isServer = typeof window === 'undefined';

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID environment variable is required')
}

if (!process.env.NEXT_PUBLIC_SANITY_DATASET) {
  throw new Error('NEXT_PUBLIC_SANITY_DATASET environment variable is required')
}

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-04-19',
  useCdn: process.env.NODE_ENV === 'production',
  ...(isServer && process.env.SANITY_API_TOKEN ? { token: process.env.SANITY_API_TOKEN } : {}),
  perspective: 'published'
}) 