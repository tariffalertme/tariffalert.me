import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../lib/sanity/client' // Corrected import name

interface SubscribeRequestBody {
  email: string
  countries?: string[] // Array of country document _ids
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
  }

  const { email, countries }: SubscribeRequestBody = req.body

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Email is required and must be a string.' })
  }

  // Basic email format validation (consider a more robust library if needed)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' })
  }

  // Validate countries if provided (optional)
  if (countries && (!Array.isArray(countries) || countries.some(c => typeof c !== 'string'))) {
    return res.status(400).json({ message: 'Countries must be an array of strings (document IDs).' })
  }

  try {
    // Check if email already exists (using GROQ query)
    // Note: Unique validation was removed from schema, checking here instead.
    const existingSubscriber = await client.fetch<any>(
      `*[_type == "subscriber" && email == $email][0]`,
      { email }
    )

    if (existingSubscriber) {
      // Optionally update existing subscriber's watched countries instead of erroring
      // For now, return conflict
      return res.status(409).json({ message: 'Email already subscribed.' })
    }

    // Prepare country references
    const countryReferences = countries
      ? countries.map(countryId => ({ _type: 'reference', _ref: countryId }))
      : []

    // Create new subscriber document
    const newSubscriber = await client.create({
      _type: 'subscriber',
      email: email,
      countriesWatched: countryReferences,
      createdAt: new Date().toISOString(), // Can also rely on initialValue in schema
    })

    return res.status(201).json({
      message: 'Subscription successful!',
      subscriberId: newSubscriber._id
    })

  } catch (error) {
    console.error('Subscription API Error:', error)
    // Check for specific Sanity errors if possible
    return res.status(500).json({ message: 'Internal Server Error' })
  }
} 