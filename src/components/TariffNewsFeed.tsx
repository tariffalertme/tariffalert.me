import { useEffect, useState } from 'react';
import { TwitterApi } from 'twitter-api-v2';

interface Tweet {
  id: string;
  text: string;
  author: string;
  created_at: string;
}

const TRACKED_ACCOUNTS = [
  'AP',
  'nytimes',
  'SenateGOP',
  'elonmusk',
  'KamalaHarris',
  'AOC',
  'realDonaldTrump'
];

const SEARCH_KEYWORDS = ['tariff', '#tariffs'];

export default function TariffNewsFeed() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const response = await fetch('/api/tweets');
        if (!response.ok) throw new Error('Failed to fetch tweets');
        const data = await response.json();
        setTweets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tweets');
      } finally {
        setLoading(false);
      }
    };

    fetchTweets();
    // Refresh every 5 minutes
    const interval = setInterval(fetchTweets, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading tweets...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Latest Tariff News</h2>
      <div className="space-y-4">
        {tweets.map((tweet) => (
          <div key={tweet.id} className="p-4 border rounded-lg shadow-sm">
            <div className="font-semibold">{tweet.author}</div>
            <p className="mt-2">{tweet.text}</p>
            <div className="text-sm text-gray-500 mt-2">
              {new Date(tweet.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 