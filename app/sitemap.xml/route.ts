import { NextResponse } from 'next/server'
import { getAllProducts, getAllCountries } from '@/lib/sanity/queries'
import { client } from '@/sanity/lib/client'

// Helper to fetch all news slugs and publishedAt
async function getAllNewsSlugs(): Promise<{ slug: string; updatedAt?: string }[]> {
  const query = `*[_type == "news" && defined(slug.current)]{ "slug": slug.current, "updatedAt": publishedAt }`
  return client.fetch(query)
}

export async function GET(req: Request, ctx: { params: any }) {
  // Fetch all slugs from Sanity
  const [products, news, countries] = await Promise.all([
    getAllProducts(),
    getAllNewsSlugs(),
    getAllCountries()
  ])

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tariffalert.me'
  const urls = [
    { loc: `${baseUrl}/`, priority: 1.0 },
    { loc: `${baseUrl}/news`, priority: 0.8 },
    { loc: `${baseUrl}/countries`, priority: 0.8 },
    { loc: `${baseUrl}/products`, priority: 0.8 },
    ...products.map((product: any) => ({ loc: `${baseUrl}/products/${product.slug.current}`, priority: 0.7, lastmod: product.dateAdded })),
    ...news.map((article: { slug: string; updatedAt?: string }) => ({ loc: `${baseUrl}/news/${article.slug}`, priority: 0.6, lastmod: article.updatedAt })),
    ...countries.map((country: any) => ({ loc: `${baseUrl}/countries/${country.code}`, priority: 0.6 }))
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(url =>
      `<url>\n` +
      `  <loc>${url.loc}</loc>\n` +
      ('lastmod' in url && url.lastmod ? `  <lastmod>${new Date(url.lastmod).toISOString()}</lastmod>\n` : '') +
      `  <priority>${url.priority}</priority>\n` +
      `</url>`
    ).join('\n') +
    `\n</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml'
    }
  })
} 