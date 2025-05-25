# Prompt for Filling in Missing Project Details

You are a senior full-stack developer and technical architect analyzing an existing Next.js + Sanity.io project. I already have:

- A top-level `/pages` folder with `index.tsx`, `products/index.tsx`, `countries/index.tsx`
- Some components (`ProductGrid`, etc.) and basic Sanity schemas for Product, Country, TariffUpdate, Tag
- A preliminary tasks table

But I still need detailed info on these areas:

---

## 1. File & Folder Structure  
List all top-level directories and files—including but not limited to:  
- `/lib` or `/utils` (data-fetching, sanity client)  
- `/schemas` or `/studio` (Sanity schema config, dataset settings)  
- `/pages/news`: `index.tsx` + dynamic `[slug].tsx`  
- `/pages/countries/[code].tsx`  
- `/pages/api/subscribe.ts`  
- Global UI components not yet inventoried (`TariffTeaser`, `DrilldownTable`, `Modal`, `CountdownTimer`, etc.)

Render as a tree, e.g.:


---

## 2. Next.js Pages & Components Inventory  
For **every** page and component in the tree above, list:

- **Path**  
- **Purpose** (e.g. "News list", "Country detail" etc.)  
- **Key props or data hooks** (e.g. `getNewsArticles`, `useProductData`, `getAllCountries`)

Example:


---

## 3. Sanity Schema Inventory  
List every Sanity schema/doc and object type, with:

- **Name**  
- **Fields** (name + type)  
- **Relations/reference fields**  

Include the existing ones and **also confirm** whether these are defined:

- `NewsArticle` (title, slug, body, featuredImage, tags, relatedProducts)  
- `RateHistory` object (date, rate)  
- `Subscriber` (email, countriesWatched)  
- `Industry` doc (if exists)  
- Validation/enums on `Tag.type`

---

## 4. Confirmation of Existing Features vs. Gaps  
For each of these features, state "Exists" or "Missing":

- News listing & detail pages  
- Country detail dynamic page (`[code].tsx`)  
- TariffTeaser + DrilldownTable UI  
- Sparkline chart for 12-month history  
- CountdownTimer component  
- API route for email subscription  
- A/B testing stub (abTest flag)  
- Tag-based filtering on Lists  
- SWR/React-Query or caching hooks  
- SEO meta tags (`<Head>`) per page  

---

**Output Format:** Reply in **Markdown** with four sections titled:

1. File & Folder Structure
(tree view)

2. Pages & Components Inventory
path → purpose → key props/hooks

3. Sanity Schema Inventory
SchemaName → fields → relations

4. Feature Confirmation