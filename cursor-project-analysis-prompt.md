# Prompt for Project Analysis & Task Breakdown

You are a senior full-stack developer and technical architect. I have a Next.js frontend (using React 18/Next 14) and a Sanity.io studio CMS. The site's domain is a tariff-news → product-grid affiliate funnel, with three main areas—News, Countries, Products—tied together by a robust tagging system (countries, industries, product categories). We've agreed on:

- **News ⇒ Products ⇒ Purchase** flow, surfacing only the **single most urgent tariff metric**, with drill-down details on hover/click.
- **Hybrid "Countries + Products" pages:**  
  1. A `/countries` landing page with a country-card carousel + a 4×4 product grid filtered by the selected country, plus a "View all products" link.  
  2. A `/products` library page with full filter/sort (country, category, highest tariff rate first, alphabetical) and the same 4×4 display.
- **UX requirements:** progressive disclosure, strong visual hierarchy (bold rates, countdown timers, CTAs above the fold), mobile-first, performance (caching, lazy-load), A/B testing later.
- **CMS schema:** tariff events need fields for country, industry, product tags, rate(s), effective date(s), and historical rates for a 12-month sparkline.

---

## What I Need from You

1. **Current State Discovery**  
   - **File structure:** All top-level folders/files under `/pages`, `/components`, `/lib`, `/schemas`, `/studio` (if any), plus any sanity config.  
   - **Next.js pages & components:** List each page (e.g. `pages/countries/index.js`) and the major React components used (e.g. `CountryCard`, `ProductGrid`, `TariffTeaser`).  
   - **Sanity schemas:** All defined document and object types, especially those for tariffs, countries, products.  
   - **Tagging & data flow:** Where tags are defined, how queries pull in related products on a tariff page, and how front-end filtering is wired up.

2. **Gap Analysis & Detailed Task List**  
   For each of the following, specify whether it already exists or needs to be created/modified—then give a task name, type (`create`/`modify`), location (e.g. file path or schema name), and a brief description of the changes:  
   - Surfacing **single-metric teaser** + drill-down details UI  
   - Country carousel + auto-filtered product grid on `/countries`  
   - Full product library page with sort/filter controls  
   - CMS schema updates for "historical rates" (12-month sparkline data)  
   - Countdown timer component (days until effective date)  
   - A/B-testing wrapper (even if stubbed for later)  
   - Mobile-responsive layout adjustments  
   - Caching/data-fetch optimization hooks  
   - Newsletter/"watch country" subscription stub (UI + API hooks)

3. **Output Format**  
   Please reply in **Markdown** with these top-level headings:

   ```markdown
   ## 1. Project File Structure
   (render as a tree)

   ## 2. Next.js Pages & Components
   - Path → Description → Main props/API calls

   ## 3. Sanity Schemas
   - SchemaName → Fields → Relations

   ## 4. Gap Analysis & Tasks
   | Task # | Name                            | Type     | Location              | Description                         |
   |-------:|---------------------------------|----------|-----------------------|-------------------------------------|
   | 1      | Single-metric teaser component  | create   | components/TariffTeaser.js | … |
   | 2      | …                               | …        | …                     | …                                   |
