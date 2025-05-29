import { groq } from 'next-sanity'
import { client } from '@/sanity/lib/client'

export interface NewsArticle {
  _id: string
  title: string
  slug: {
    current: string
  }
  publishedAt: string
  mainImage?: {
    url: string
    alt?: string
  }
  excerpt?: string
  content: any[]
  category?: string
  featured?: boolean
  relatedTariffUpdate?: {
    newRate?: number;
    effectiveDate?: string;
    history?: { date: string; rate: number }[];
  }
}

// Define RateHistoryPoint interface (if not defined elsewhere)
export interface RateHistoryPoint {
  _key?: string; // Array items in Sanity often have a _key
  date: string;
  rate: number;
  countryCode?: string; // Optional for non-US views
  countryName?: string; // Optional for non-US views
}

export interface Product {
  _id: string
  name: string
  slug: {
    current: string
  }
  description: string
  image: {
    asset: {
      url: string
    }
    alt?: string
  }
  category: {
    _id: string
    name: string
  }
  impactScore: number
  dateAdded: string
  tags: Array<{
    _id: string
    name: string
    type: string
  }>
  affiliateUrl: string
  relatedTariffUpdates?: Array<{
    _id: string
    effectiveDate: string
    newRate?: number
    history?: RateHistoryPoint[]
    country: {
      name: string
      code: string
    }
    impactedCountry?: {
      name: string
      code: string
    }
  }>
  currentPrice: number
  priceHistory: any[]
}

export interface Country {
  _id: string
  name: string
  code: string
  flagUrl: string
  flagIconUrl: string
  tags: Array<{
    _id: string
    name: string
    type: string
  }>
  majorExports: Array<{
    _id: string
    name: string
    type: string
  }>
}

// Fetch featured news articles
export async function getFeaturedNews(): Promise<NewsArticle[]> {
  const query = groq`*[_type == "news" && featured == true] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    "mainImage": {
      "url": mainImage.asset->url,
      "alt": mainImage.alt
    },
    excerpt,
    content,
    category,
    featured
  }`

  return client.fetch(query)
}

// Fetch latest news articles
export async function getLatestNews(limit: number = 5): Promise<NewsArticle[]> {
  const query = groq`*[_type == "news"] | order(publishedAt desc)[0...${limit}] {
    _id,
    title,
    slug,
    publishedAt,
    "mainImage": {
      "url": mainImage.asset->url,
      "alt": mainImage.alt
    },
    excerpt,
    content,
    category,
    featured,
    relatedTariffUpdate->{
      newRate,
      effectiveDate,
      history
    }
  }`

  return client.fetch(query)
}

// Fetch all products
export async function getAllProducts(): Promise<Product[]> {
  const query = groq`*[_type == "product"] | order(dateAdded desc) {
    _id,
    name,
    "slug": { "current": slug.current },
    description,
    "image": {
      "asset": {
        "url": image.asset->url
      },
      "alt": image.alt
    },
    category->{
      _id,
      name
    },
    currentPrice,
    priceHistory,
    "tags": coalesce(productCategories[]-> { _id, name, type }, []) + coalesce(attributes[]-> { _id, name, type }, []),
    affiliateUrl,
    impactScore,
    dateAdded,
    "relatedTariffUpdates": relatedTariffUpdates[]-> {
      _id,
      effectiveDate,
      newRate,
      history,
      "country": imposingCountry-> { _id, name, code },
      "impactedCountry": impactedCountry-> { _id, name, code }
    }
  }`

  return client.fetch(query)
}

// Fetch limited number of products
export async function getProducts(limit: number = 4): Promise<Product[]> {
  const query = groq`*[_type == "product"] | order(dateAdded desc)[0...${limit}] {
    _id,
    name,
    "slug": { "current": slug.current },
    description,
    "image": {
      "asset": {
        "url": image.asset->url
      },
      "alt": image.alt
    },
    category->{
      _id,
      name
    },
    currentPrice,
    priceHistory,
    "tags": coalesce(productCategories[]-> { _id, name, type }, []) + coalesce(attributes[]-> { _id, name, type }, []),
    affiliateUrl,
    impactScore,
    dateAdded,
    "relatedTariffUpdates": relatedTariffUpdates[]-> {
      _id,
      effectiveDate,
      newRate,
      history,
      "country": imposingCountry-> { _id, name, code },
      "impactedCountry": impactedCountry-> { _id, name, code }
    }
  }`

  const products = await client.fetch(query)
  console.log('Fetched products:', JSON.stringify(products, null, 2))
  return products
}

// Fetch all countries
export async function getAllCountries(): Promise<Country[]> {
  const query = groq`*[_type == "country"] | order(name asc) {
    _id,
    name,
    code,
    flagUrl,
    flagIconUrl,
    "tags": tags[]-> {
      _id,
      name,
      type
    },
    "majorExports": majorExports[]-> {
      _id,
      name,
      type
    }
  }`
  
  if (!client.config()) {
    throw new Error('Sanity client configuration is missing')
  }

  const countries = await client.fetch(query)
  console.log('Fetched countries:', countries) // Debug log
  return countries
}

// Fetch a single news article by slug
export async function getArticle(slug: string): Promise<NewsArticle> {
  if (!client.config()) {
    throw new Error('Sanity client configuration is missing')
  }

  const query = groq`*[_type == "news" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    "mainImage": {
      "url": mainImage.asset->url,
      "alt": mainImage.alt
    },
    excerpt,
    content,
    category,
    featured
  }`

  const article = await client.fetch(query, { slug })
  
  if (!article) {
    throw new Error('Article not found')
  }

  return article
}

// Fetch products with tags and tariff information
export async function getProductsWithTariffs(limit?: number): Promise<Product[]> {
  // Add limit logic if needed, e.g., [0...${limit}] if limit is defined
  const limitClause = typeof limit === 'number' ? `[0...${limit}]` : ''
  const query = groq`*[_type == "product" && defined(relatedTariffUpdates)] | order(dateAdded desc) ${limitClause} {
    _id,
    name,
    "slug": { "current": slug.current },
    description,
    "image": {
      "asset": {
        "url": image.asset->url
      },
      "alt": image.alt
    },
    category->{
      _id,
      name
    },
    currentPrice,
    priceHistory,
    "tags": tags[]-> {
      _id,
      name
      // type // Add type if needed and available in tag schema
    },
    affiliateUrl,
    impactScore,
    dateAdded,
    // Modify relatedTariffUpdates projection
    "relatedTariffUpdates": *[_type == "tariffUpdate" && references(^._id)] | order(effectiveDate desc) {
      _id,
      effectiveDate,
      newRate, // Fetch newRate field
      history, // Fetch history field
      // Fetch imposing country details
      "country": imposingCountry-> {
        _id,
        name,
        code
      }
    }
  }`

  console.log("Fetching products with tariffs...")
  try {
    const products = await client.fetch<Product[]>(query)
    console.log(`Fetched ${products.length} products with tariffs.`)
    return products
  } catch (error) {
    console.error('Error fetching products with tariffs:', error)
    return []
  }
}

// Fetch a single product by slug with full details
export async function getProductById(slug: string): Promise<Product> {
  const query = groq`*[_type == "product" && slug.current == $slug][0] {
    _id,
    name,
    "slug": { "current": slug.current },
    description,
    "image": {
      "asset": {
        "url": image.asset->url
      },
      "alt": image.alt
    },
    category->{
      _id,
      name
    },
    currentPrice,
    priceHistory,
    impactScore,
    dateAdded,
    "tags": tags[]-> {
      _id,
      name,
      type
    },
    affiliateUrl,
    "relatedTariffUpdates": relatedTariffUpdates[]-> {
      _id,
      title,
      effectiveDate,
      tariffRate,
      description,
      "country": country-> {
        _id,
        name,
        code
      }
    }
  }`

  const product = await client.fetch(query, { slug })
  if (!product) {
    throw new Error('Product not found')
  }
  return product
}

// --- Add getRateHistory function --- 
export async function getRateHistory(tariffUpdateId: string): Promise<RateHistoryPoint[] | null> {
  const query = groq`*[_type == "tariffUpdate" && _id == $tariffUpdateId][0].history`;
  try {
    // Fetching history which is an array of rateHistory objects
    const history = await client.fetch<RateHistoryPoint[] | null>(query, { tariffUpdateId });
    return history || null; // Return null if no history or document not found
  } catch (error) {
    console.error(`Error fetching rate history for ID ${tariffUpdateId}:`, error);
    return null;
  }
}

// Fetch a single country by its code
export async function getCountryByCode(code: string): Promise<Country | null> {
  const query = groq`*[_type == "country" && code == $code][0] {
    _id,
    name,
    code,
    flagUrl,
    flagIconUrl,
    "tags": tags[]-> {
      _id,
      name,
      type
    },
    "majorExports": majorExports[]-> {
      _id,
      name,
      type
    }
  }`;
  if (!client.config()) throw new Error('Sanity client configuration is missing');
  const country = await client.fetch<Country | null>(query, { code });
  return country || null;
}

// Fetch all products related to a country by country code
export async function getProductsByCountry(code: string): Promise<Product[]> {
  const query = groq`*[_type == "product" && $code in relatedTariffUpdates[]->impactedCountry->code] {
    _id,
    name,
    "slug": { "current": slug.current },
    description,
    "image": {
      "asset": {
        "url": image.asset->url
      },
      "alt": image.alt
    },
    category->{
      _id,
      name
    },
    currentPrice,
    priceHistory,
    "tags": tags[]-> {
      _id,
      name
    },
    affiliateUrl,
    impactScore,
    dateAdded,
    // Dereference relatedTariffUpdates for this country
    "relatedTariffUpdates": relatedTariffUpdates[]-> {
      _id,
      effectiveDate,
      newRate,
      history,
      "country": imposingCountry-> {
        _id,
        name,
        code
      },
      "impactedCountry": impactedCountry-> {
        _id,
        name,
        code
      }
    }
  }`;
  if (!client.config()) throw new Error('Sanity client configuration is missing');
  return client.fetch<Product[]>(query, { code });
}

// Fetch all tariff rate history for a country by code
export async function getCountryTariffHistory(code: string): Promise<RateHistoryPoint[]> {
  console.log(`Fetching tariff history for country code: ${code}`);
  
  interface TariffUpdate {
    _id: string;
    effectiveDate: string;
    type: string;
    newRate: number;
    imposingCountry: { code: string; name: string };
    impactedCountry: { code: string; name: string };
    history?: Array<{
      _key: string;
      date: string;
      rate: number;
    }>;
  }

  // For non-US countries, only show tariffs where they are impacted by US
  const query = code !== 'US' 
    ? `*[_type == "tariffUpdate" && impactedCountry->code == $code && imposingCountry->code == "US"] | order(effectiveDate asc)`
    : `*[_type == "tariffUpdate" && impactedCountry->code == $code] | order(effectiveDate asc)`;

  // Query for tariff updates based on country context
  const tariffUpdates = await client.fetch<TariffUpdate[]>(`
    ${query} {
      _id,
      effectiveDate,
      type,
      newRate,
      imposingCountry->{code, name},
      impactedCountry->{code, name},
      history[] {
        _key,
        date,
        rate
      }
    }
  `, { code });

  console.log(`Found ${tariffUpdates.length} tariff updates for country ${code}`);
  console.log('Raw tariff updates:', JSON.stringify(tariffUpdates, null, 2));

  // Combine all history points and current rates
  const historyPoints: RateHistoryPoint[] = [];
  
  tariffUpdates.forEach((update: TariffUpdate) => {
    const countryPrefix = code === 'US' ? `${update.imposingCountry.code}_` : '';
    
    // Add points from the history array
    if (update.history && Array.isArray(update.history)) {
      update.history.forEach((point) => {
        if (point.date && typeof point.rate === 'number') {
          historyPoints.push({
            _key: countryPrefix + (point._key || `history_${point.date}`),
            date: point.date,
            rate: point.rate,
            countryCode: update.imposingCountry.code, // Add imposing country for US view
            countryName: update.imposingCountry.name // Add country name for legend
          });
        } else {
          console.warn(`Invalid history point in update ${update._id}:`, point);
        }
      });
    }
    
    // Add the current rate if it exists
    if (update.effectiveDate && typeof update.newRate === 'number') {
      historyPoints.push({
        _key: countryPrefix + `${update._id}_current`,
        date: update.effectiveDate,
        rate: update.newRate,
        countryCode: update.imposingCountry.code, // Add imposing country for US view
        countryName: update.imposingCountry.name // Add country name for legend
      });
    }
  });

  console.log(`Total history points before processing: ${historyPoints.length}`);

  // For US, group by imposing country and sort within each group
  // For other countries, just sort by date
  const sortedPoints = historyPoints
    .filter(point => {
      const isValid = point.date && typeof point.rate === 'number' && !isNaN(point.rate);
      if (!isValid) {
        console.warn('Filtering out invalid point:', point);
      }
      return isValid;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // For non-US countries, remove duplicates by date
  // For US, remove duplicates by date within each country group
  const finalPoints = code !== 'US'
    ? sortedPoints.filter((point, index, self) => 
        index === self.findIndex(p => p.date === point.date)
      )
    : sortedPoints;

  console.log(`Final processed points: ${finalPoints.length}`);
  console.log('Processed history points:', JSON.stringify(finalPoints, null, 2));
  
  return finalPoints;
}

// Get aggregated statistics for US tariff impact
export async function getUSTariffImpactStats(): Promise<{
  totalCountries: number;
  averageRate: number;
  maxRate: number;
  recentChanges: Array<{
    countryName: string;
    rateDelta: number;
    date: string;
  }>;
}> {
  const query = groq`{
    "allUpdates": *[_type == "tariffUpdate" && impactedCountry->code == "US"] {
      imposingCountry->{name},
      effectiveDate,
      newRate,
      previousRate
    },
    "uniqueCountries": count(*[_type == "tariffUpdate" && impactedCountry->code == "US"].imposingCountry->{name})
  }`;

  const result = await client.fetch(query);
  
  const updates = result.allUpdates;
  const totalCountries = result.uniqueCountries;
  
  // Calculate statistics
  const rates = updates.map((u: any) => u.newRate).filter((r: number) => !isNaN(r));
  const averageRate = rates.reduce((a: number, b: number) => a + b, 0) / rates.length;
  const maxRate = Math.max(...rates);
  
  // Get recent changes (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentChanges = updates
    .filter((u: any) => new Date(u.effectiveDate) >= thirtyDaysAgo)
    .map((u: any) => ({
      countryName: u.imposingCountry.name,
      rateDelta: u.newRate - (u.previousRate || 0),
      date: u.effectiveDate
    }))
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    totalCountries,
    averageRate,
    maxRate,
    recentChanges
  };
} 