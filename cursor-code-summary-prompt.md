# Prompt for Detailed File & Code Summary

You’re an expert full-stack engineer examining an existing Next.js (App + Pages Routers) + Sanity.io project. I need exact details for the following files so I can map out what already exists vs. what we must build:

## 1. Page & API Routes  
- `app/page.tsx`  
- `pages/news/index.tsx`  
- `pages/news/[slug].tsx`  
- `pages/countries/[code].tsx`  
- `pages/api/subscribe.ts`  

## 2. Key UI Components  
- `components/features/TariffMetric.tsx`  
- `components/features/CountryWatch.tsx`  
- `components/ui/CountdownTimer.tsx`  
- `components/ui/SparklineChart.tsx`  
- `components/ui/DrilldownTable.tsx`  
- `components/ui/Modal.tsx`  
- `components/utils/ABTestWrapper.tsx`  

## 3. Data-Fetching & Queries  
- `lib/sanity/queries.ts`  

## 4. Sanity Schemas  
- `sanity/schemaTypes/news.ts`  
- `sanity/schemaTypes/tag.ts`  
- `sanity/schemaTypes/tariffUpdate.ts`  

---

For each file above, **please output**:

1. **Path**  
2. **Purpose / What it renders or provides**  
3. **Exports** (components, functions, handlers)  
4. **Key logic**  
   - For pages: which Sanity query or hook it calls (e.g. `getNewsBySlug(slug)`)  
   - For components: which props it expects and any hooks or utilities it uses  
   - For `queries.ts`: list each exported function and its GROQ query string  
   - For schemas: list each field name + type, and any `reference` or `array` relations

---

### Output Format

```markdown
## File Summaries

### app/page.tsx
- **Purpose:** Homepage with featured news + products
- **Exports:** default Page
- **Data:** calls `getFeaturedNews()` and `getProducts({ limit: 8 })`
- **UI:** uses `TariffTeaser`, `ProductGrid`
- …

### pages/news/index.tsx
- **Purpose:** News listing
- **Exports:** default NewsIndex
- **Data:** calls `getAllNewsArticles()`
- **UI:** maps `articles` → uses `NewsCard` (show slug, excerpt, teaser metric)
- …

(Continue for every file)

## Queries Inventory

- **getAllNewsArticles**  
  ```js
  export async function getAllNewsArticles() {
    return sanityClient.fetch(`
      *[_type == "news"]{…}
    `)
  }
…

Sanity Schemas
news (in news.ts)
Fields:

title: string

slug: { type: "slug", … }

publishedAt: datetime

tags: [reference->tag]

relatedProducts: [reference->product]

…

Validation/enums:

category is a string with allowed values: “electronics” | “apparel” | “food”

…

tag (in tag.ts)
Fields:

name: string

type: { type: "string", options: { list: ["country","industry","product_category","attribute"] } }

…

(And so on…)