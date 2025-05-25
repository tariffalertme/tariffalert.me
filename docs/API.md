# API Documentation

## External APIs

### 1. Sanity CMS API
- **Purpose**: Content management and delivery
- **Configuration**:
  ```env
  NEXT_PUBLIC_SANITY_PROJECT_ID=wvfxas7s
  NEXT_PUBLIC_SANITY_DATASET=production
  SANITY_API_TOKEN=<token>
  ```
- **Usage**:
  - Content fetching via GROQ queries
  - Real-time content updates
  - Image asset management
- **Rate Limits**: None (self-hosted)

### 2. Twitter API
- **Purpose**: Social media integration and updates
- **Configuration**:
  ```env
  TWITTER_API_KEY=<key>
  TWITTER_API_SECRET=<secret>
  TWITTER_BEARER_TOKEN=<token>
  ```
- **Rate Limits**: 
  - 500,000 tweets/month
  - 50 requests/15-minute window
- **Endpoints Used**:
  - Tweet search
  - User timeline

## Internal API Routes

### 1. News API
**Endpoint**: `/api/sanity/news`
- **Method**: GET
- **Purpose**: Fetch latest news articles
- **Response**:
  ```typescript
  interface NewsArticle {
    _id: string
    title: string
    slug: { current: string }
    publishedAt: string
    mainImage?: {
      url: string
      alt?: string
    }
    excerpt?: string
    content: any[]
    category?: string
    featured?: boolean
  }
  ```
- **Error Handling**:
  ```json
  {
    "error": "Failed to fetch news",
    "status": 500
  }
  ```

### 2. Products API
**Endpoint**: `/api/sanity/products`
- **Method**: GET
- **Purpose**: Fetch product information
- **Response**:
  ```typescript
  interface Product {
    _id: string
    name: string
    image: {
      asset: any
      alt?: string
    }
    affiliateUrl: string
    tags: string[]
    relatedTariffUpdates?: Array<{
      _id: string
      title: string
      effectiveDate: string
      tariffRate: number
    }>
  }
  ```

### 3. Countries API
**Endpoint**: `/api/sanity/countries`
- **Method**: GET
- **Purpose**: Fetch country information and tariff impacts
- **Response**:
  ```typescript
  interface Country {
    _id: string
    name: string
    code: string
    flag: {
      url: string
      alt: string
    }
    metrics: any
    description: string
  }
  ```

## Error Handling
All API routes implement standard error handling:
- 404: Resource not found
- 500: Server error
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden

## Rate Limiting
Rate limiting is implemented using the following configuration:
- Public endpoints: 100 requests per IP per hour
- Authenticated endpoints: 1000 requests per token per hour

## Caching
- Sanity queries: 60 seconds cache (production only)
- Static pages: ISR with 1-hour revalidation
- API responses: Cache-Control headers set to 1 hour

## Security
- All endpoints validate request origin
- API tokens are required for mutations
- CORS is configured for specific domains
- Request validation middleware in place 