import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { NewsArticle } from '@/lib/sanity/queries';

interface NewsCardProps {
  article: NewsArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
  return (
    <Link href={`/news/${article.slug.current}`}>
      <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {article.mainImage?.url && (
          <div className="relative aspect-video">
            <Image
              src={article.mainImage.url}
              alt={article.mainImage.alt || article.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-4">
          {article.featured && (
            <div className="inline-block bg-red-600 text-white px-2 py-1 rounded text-xs font-medium mb-2">
              Featured Article
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            {article.category && (
              <>
                <span>{article.category}</span>
                <span>•</span>
              </>
            )}
            <time dateTime={article.publishedAt}>
              {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
            </time>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h3>
          {article.excerpt && (
            <p className="text-gray-600 line-clamp-3">{article.excerpt}</p>
          )}
        </div>
      </article>
    </Link>
  );
} 