# TariffAlert.me Frontend Architecture

## Global Components

### Header Component (`src/components/layout/Header.tsx`)
- Fixed position at top
- Full width
- Contains:
  - Logo (left): Globe icon + "TariffAlert.me" text
  - Navigation links (center):
    - Home
    - News
    - Products
    - Countries
    - About
  - NO authentication components
  - NO search functionality

### Twitter Feed Component (`src/components/layout/TwitterFeed.tsx`)
- Positioned immediately below header
- Full width
- Horizontal scrolling ticker
- Features:
  - Continuous smooth scrolling
  - Trade-related tweets
  - Auto-duplicates content for seamless loop
  - Hover to pause
- Data:
  - Uses Twitter API with fallback to mock data
  - Filters for trade/tariff related content

### Footer Component (`src/components/layout/Footer.tsx`)
- Full width
- Contains:
  - Copyright information
  - Links (About, Contact, Privacy Policy)
  - Three-column layout
    - About section
    - Quick Links
    - Legal Links

## Page Layouts

### Home Page (`src/app/page.tsx`)
1. Breaking News Carousel
   - Full width hero section
   - Features latest news articles from Sanity
   - Auto-rotating slides with navigation
   - Current articles:
     - "Tariff Alert: Executive Order Imposes New Trade Restrictions"
     - "Tariff Alert: How U.S. Trade Tariffs Impact Global Markets"

2. Product Showcase Section
   - Full width
   - Grid layout for product cards
   - Shows newest additions
   - Each card contains:
     - Product image
     - Title
     - Brief description
     - Category/tags
     - Impact score

3. Country Impact Analysis Section
   - Full width
   - Uses CountryImpactAnalysis component
   - Default country: USA
   - Features:
     - Trade statistics visualization
     - Relationship mapping
     - Impact metrics
     - Recommendations

### News Page (`src/app/news/page.tsx`)
- Grid layout of news articles
- Filterable by category
- Each article shows:
  - Featured image
  - Title
  - Publication date
  - Category
  - Brief excerpt

### Products Page (`src/app/products/page.tsx`)
- Filterable grid of products
- Search functionality
- Category filters
- Each product shows:
  - Image
  - Name
  - Category
  - Impact score
  - Brief description

### Countries Page (`src/app/countries/page.tsx`)
- Interactive map visualization
- List of countries with:
  - Flag
  - Name
  - Key metrics
  - Relationship status
- Detailed view when selected

### About Page (`src/app/about/page.tsx`)
- Mission statement
- Service overview
- Team information
- Contact form

## Component Details

### CountryImpactAnalysis Component
```typescript
interface CountryImpactAnalysisProps {
  analysis: CountryImpactAnalysis;
  isLoading?: boolean;
}
```
- Features:
  - Trade statistics chart
  - Tariff changes table
  - Consumer segments analysis
  - Country relationships visualization
  - Impact score display
  - Recommendations list

### BreakingNewsCarousel Component
```typescript
interface NewsItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  date: string;
}
```
- Features:
  - Auto-rotating slides
  - Navigation arrows
  - Progress indicators
  - Hover to pause
  - Mobile responsive

### ProductShowcase Component
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  impactScore: number;
  dateAdded: string;
}
```
- Features:
  - Grid layout
  - Sorting options
  - Category filtering
  - Impact score display
  - New product indicators

## Implementation Priority

1. Core Layout Components
   - [x] Header
   - [ ] Twitter Feed (horizontal scroll)
   - [x] Footer

2. Home Page Components
   - [x] Breaking News Carousel
   - [ ] Product Showcase
   - [x] Country Impact Analysis

3. Additional Pages
   - [ ] News Page
   - [ ] Products Page
   - [ ] Countries Page
   - [ ] About Page

## Component Dependencies

- Twitter Feed requires:
  - Twitter API integration
  - Auto-scroll functionality
  - Pause on hover

- Breaking News Carousel requires:
  - Sanity CMS integration
  - Image optimization
  - Touch controls for mobile

- Product Showcase requires:
  - Sanity CMS integration
  - Image optimization
  - Sorting/filtering logic

## Data Flow

1. Sanity CMS → Next.js
   - News articles
   - Product information
   - Country data

2. Twitter API → Next.js
   - Real-time tweets
   - Fallback to mock data

3. Analytics → CountryImpactAnalysis
   - Trade statistics
   - Impact calculations
   - Relationship data

## Styling Guidelines

- Use Tailwind CSS
- Maintain consistent spacing
- Full-width sections
- Responsive breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

## Testing Requirements

- Component unit tests
- Integration tests
- Responsive design tests
- Performance monitoring
- Accessibility compliance

## Next Steps

1. Remove TariffNewsFeed component completely
2. Implement Twitter Feed horizontal scroll
3. Fix homepage layout to be full-width sections
4. Create Product Showcase component
5. Implement remaining pages 