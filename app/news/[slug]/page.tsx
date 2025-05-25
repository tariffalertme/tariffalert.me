import { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import { getArticle } from '@/lib/sanity/queries'
import { formatDate } from '@/lib/utils'
import { components } from '@/app/components/portable-text/components'
import { Container } from '@/app/components/ui/container'
import { Heading } from '@/app/components/ui/heading'
import { Text } from '@/app/components/ui/text'
import { Badge } from '@/app/components/ui/badge'
import Image from 'next/image'
import { NewsArticle } from '@/lib/sanity/queries'
import Head from 'next/head'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  const article = await getArticle(slug);
  if (!article) {
    return {
      title: 'News Not Found | TariffAlert.me',
      description: 'This news article could not be found.',
      alternates: {
        canonical: `https://yourdomain.com/news/${slug}`
      }
    }
  }
  return {
    title: `${article.title} | TariffAlert.me`,
    description: article.excerpt || '',
    alternates: {
      canonical: `https://yourdomain.com/news/${slug}`
    },
    openGraph: {
      title: article.title,
      description: article.excerpt || '',
      images: [
        {
          url: article.mainImage?.url || '/placeholder.png',
          width: 1200,
          height: 630,
          alt: article.title
        }
      ],
      type: 'article'
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || '',
      images: [article.mainImage?.url || '/placeholder.png']
    }
  }
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-800">
        Unable to load article. Please try again later.
      </p>
      <p className="text-red-600 text-sm mt-2">
        {message}
      </p>
    </div>
  )
}

export default async function NewsArticlePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  try {
    const article = await getArticle(slug)

    const articleJsonLd = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: article.title,
      image: [article.mainImage?.url || '/placeholder.png'],
      datePublished: article.publishedAt,
      author: [{
        "@type": "Person",
        name: "TariffAlert Editorial"
      }],
      publisher: {
        "@type": "Organization",
        name: "TariffAlert.me",
        logo: {
          "@type": "ImageObject",
          url: "https://yourdomain.com/logo.png"
        }
      },
      description: article.excerpt || ''
    }

    return (
      <>
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
          />
        </Head>
        <Container className="py-8 max-w-3xl">
          <header className="mb-8">
            {article.category && (
              <Badge variant="secondary" className="mb-4">
                {article.category}
              </Badge>
            )}
            <Heading as="h1" size="sm" className="mb-4 font-bold">
              {article.title}
            </Heading>
            <Text size="sm" className="text-muted-foreground">
              {formatDate(article.publishedAt)}
            </Text>
          </header>

          {article.mainImage && (
            <figure className="mb-8">
              <Image
                src={article.mainImage.url}
                alt={article.mainImage.alt || article.title}
                width={1200}
                height={675}
                className="w-full rounded-lg"
                priority
              />
            </figure>
          )}

          {article.excerpt && (
            <Text size="lg" className="mb-8 text-muted-foreground">
              {article.excerpt}
            </Text>
          )}

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <PortableText value={article.content} components={components} />
          </div>
        </Container>
      </>
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Article not found') {
      return (
        <Container className="py-8">
          <Heading as="h1" size="xl" className="mb-4">
            Article not found
          </Heading>
          <Text>The article you are looking for does not exist.</Text>
        </Container>
      )
    }
    throw error
  }
} 