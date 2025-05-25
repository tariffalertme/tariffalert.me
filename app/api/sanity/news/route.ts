import { NextResponse } from 'next/server'
import { getLatestNews } from '@/lib/sanity/queries'

export async function GET() {
  try {
    const news = await getLatestNews(10) // Fetch 10 latest news articles
    return NextResponse.json(news)
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
} 