import type { NextApiRequest, NextApiResponse } from 'next'
import { getProductsByCountry } from '@/lib/sanity/queries'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid country code' })
  }
  try {
    const products = await getProductsByCountry(code)
    res.status(200).json(products)
  } catch (err) {
    console.error('API error in products-by-country:', err)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
} 