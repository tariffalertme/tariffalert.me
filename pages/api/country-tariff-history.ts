import type { NextApiRequest, NextApiResponse } from 'next'
import { getCountryTariffHistory } from '@/lib/sanity/queries'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid country code' })
  }
  try {
    const history = await getCountryTariffHistory(code)
    res.status(200).json(history)
  } catch (err) {
    console.error('API error in country-tariff-history:', err)
    res.status(500).json({ error: 'Failed to fetch tariff history' })
  }
} 