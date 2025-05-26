# Next.js <Image /> Upgrade Notes

## Context
This document tracks all changes made to update legacy Next.js `<Image />` usage (with `layout` and `objectFit` props) to the Next.js 13+ image API. This is necessary due to breaking changes in the Next.js image component, and to resolve warnings like:

- `Image with src ... has legacy prop "layout". Did you forget to run the codemod?`
- `Image with src ... has legacy prop "objectFit". Did you forget to run the codemod?`

## Steps and Changes

### 1. **Codebase Search and Refactor**
- Searched for all usages of `<Image ... layout=... objectFit=... />` in the codebase.
- Updated each instance to use the new Next.js 13+ image API:
  - Removed `layout` and `objectFit` props.
  - Used `fill`, `width`, `height`, and `style` as appropriate.
  - Ensured all images have explicit `width` and `height` or use the `fill` prop for responsive images.

### 2. **Package Version Notes**
- **Before making changes:**
  - Next.js version: 14.2.4
  - `next/image` is compatible with the new API.
- **If any issues arise:**
  - Revert to this document for a list of all files and changes made.
  - If a downgrade is needed, restore the previous `<Image />` usage and package versions.

### 3. **Files Modified**
- [x] components/features/NewsCard.tsx
- [x] app/components/features/NewsCard.tsx
- [x] components/features/DrilldownTable.tsx
- [x] components/features/BreakingNews.tsx
- [x] components/features/CountryModal.tsx
- [x] components/features/CountryGridClient.tsx
- [x] components/features/ProductModal.tsx
- [x] components/features/ProductGrid.tsx
- [x] app/news/[slug]/page.tsx
- [x] app/products/[slug]/page.tsx
- [x] components/layout/Header.tsx
- [x] components/layout/TwitterFeed.tsx
- [x] app/components/portable-text/components.tsx

#### Summary of changes:
- Removed deprecated `layout` and `objectFit` props from all `<Image />` usages.
- Replaced with `fill`, `width`, `height`, and `className`/`style` as appropriate for each context.
- Ensured all images have explicit sizing or use `fill` for responsive layouts.
- Used `object-cover` or `object-contain` via `className` for image fit.
- Updated all usages in both `/components` and `/app/components` directories.

### 4. **References**
- [Next.js Image Upgrade Guide](https://nextjs.org/docs/messages/next-image-upgrade-to-13)
- [Next.js 13+ Image Component Docs](https://nextjs.org/docs/app/api-reference/components/image)

---

**All changes will be logged below as they are made.** 