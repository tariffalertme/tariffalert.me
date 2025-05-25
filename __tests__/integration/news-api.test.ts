import { GET } from '@/app/api/sanity/news/route'
import { NextResponse } from 'next/server'
import * as queries from '@/lib/sanity/queries'
import { NewsArticle } from '@/lib/sanity/queries'

jest.mock('@/lib/sanity/queries')
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
      // Simulate instanceof check
      __proto__: {
        constructor: { name: 'NextResponse' }
      }
    })
  }
}))

describe('News API', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns news articles', async () => {
    const mockNews: NewsArticle[] = [
      {
        _id: 'test-1',
        title: 'Test News 1',
        slug: { current: 'test-1' },
        publishedAt: '2024-03-20',
        content: ['Test content 1']
      },
      {
        _id: 'test-2',
        title: 'Test News 2',
        slug: { current: 'test-2' },
        publishedAt: '2024-03-21',
        content: ['Test content 2']
      }
    ]
    jest.spyOn(queries, 'getLatestNews').mockResolvedValue(mockNews)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toEqual(mockNews)
    expect(queries.getLatestNews).toHaveBeenCalledWith(10)
  })

  it('handles errors gracefully', async () => {
    jest.spyOn(queries, 'getLatestNews').mockRejectedValue(new Error('Test error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch news')
  })
}) 