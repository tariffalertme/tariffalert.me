import { NextResponse } from 'next/server'
import { getProductById } from '@/lib/sanity/queries'

export const revalidate = 3600 // Revalidate every hour

export async function GET(req: Request, context: any) {
  try {
    const id = context.params.id
    if (!id) {
      return new NextResponse(null, {
        status: 400,
        statusText: 'Product ID is required'
      })
    }
    const product = await getProductById(id)

    if (!product) {
      return new NextResponse(null, {
        status: 404,
        statusText: 'Product not found'
      })
    }

    // Set cache headers
    const headers = new Headers()
    headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    headers.set('Content-Type', 'application/json')

    return new NextResponse(JSON.stringify(product), {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return new NextResponse(null, {
      status: 500,
      statusText: 'Internal Server Error'
    })
  }
} 