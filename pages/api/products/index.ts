import { NextApiRequest, NextApiResponse } from 'next'
import { getAllProducts } from '../../../lib/sanity'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Set caching headers
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    )

    const products = await getAllProducts()
    return res.status(200).json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return res.status(500).json({ message: 'Error fetching products' })
  }
} 