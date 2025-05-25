import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import BannerLayout from '@/components/layout/BannerLayout';
import NewsCard from '@/components/features/NewsCard';
import { NewsArticle } from '@/lib/sanity/queries';
import { Suspense } from 'react';

async function getNewsArticles(): Promise<NewsArticle[]> {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET) {
    throw new Error('Sanity configuration is missing');
  }

  try {
    const articles = await client.fetch(groq`
      *[_type == "news"] | order(publishedAt desc) {
        _id,
        title,
        slug,
        publishedAt,
        excerpt,
        "mainImage": {
          "url": mainImage.asset->url,
          "alt": mainImage.alt
        },
        category,
        content,
        featured
      }
    `);

    if (!articles || !Array.isArray(articles)) {
      throw new Error('Invalid response format from Sanity');
    }

    console.log('Fetched articles:', articles);

    return articles;
  } catch (error) {
    console.error('Error fetching news articles:', error);
    throw error;
  }
}

function NewsGrid({ articles }: { articles: NewsArticle[] }) {
  console.log('Articles in NewsGrid:', articles);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => {
        console.log('Article being passed to NewsCard:', article);
        return <NewsCard key={article._id} article={article} />;
      })}
    </div>
  );
}

export default async function NewsPage() {
  let articles: NewsArticle[] = [];
  let error: Error | null = null;

  try {
    articles = await getNewsArticles();
  } catch (e) {
    error = e as Error;
    console.error('Failed to load news articles:', e);
  }

  return (
    <main className="min-h-screen">
      <BannerLayout>
        <div className="container mx-auto px-4 pt-24">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Latest Trade News</h1>
            <p className="text-gray-600 mt-2">
              Stay informed about the latest developments in global trade and tariffs
            </p>
          </div>
          
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          }>
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">
                  Unable to load news articles. Please try again later.
                </p>
                <p className="text-red-600 text-sm mt-2">
                  {error.message}
                </p>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No news articles available at this time.</p>
              </div>
            ) : (
              <NewsGrid articles={articles} />
            )}
          </Suspense>
        </div>
      </BannerLayout>
    </main>
  );
} 