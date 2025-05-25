# Project Architecture

## Directory Structure

```
tariffalert.me/
├── app/                    # Next.js app directory
├── components/            # React components
│   ├── layout/           # Layout components (Header, Footer, etc.)
│   ├── features/         # Feature-specific components
│   └── shared/           # Shared/reusable components
├── lib/                   # Utility functions and shared code
│   ├── sanity/           # Sanity.io integration
│   └── utils/            # General utilities
├── public/               # Static assets
│   └── images/          # Image assets
├── styles/               # Global styles and CSS modules
├── types/                # TypeScript type definitions
└── sanity/              # Sanity Studio
    └── schemas/         # Content type definitions
```

## Import Conventions

- Use `@/` alias for all imports from the project root
- Examples:
  ```typescript
  // ✅ Correct
  import { Component } from '@/components/shared/Component'
  import { useUtil } from '@/lib/utils/useUtil'
  
  // ❌ Incorrect
  import { Component } from '../../components/Component'
  import { useUtil } from './utils/useUtil'
  ```

## Component Organization

### Layout Components (`components/layout/`)
- Header
- Footer
- TwitterFeed
- BannerLayout

### Feature Components (`components/features/`)
- ProductGrid
- CountryGrid
- BreakingNews

### Shared Components (`components/shared/`)
- Button
- Card
- Input
- Loading

## Data Flow

1. Sanity Integration
   - Schemas defined in `sanity/schemas/`
   - Queries in `lib/sanity/queries.ts`
   - Types in `types/sanity.ts`

2. API Integration
   - API routes in `app/api/`
   - External API utilities in `lib/api/`

## Backup Strategy

- Use Git for version control
- Major changes backed up to `backups/YYYYMMDD_HHMMSS_description/`
- Document changes in backup README.md

## Development Guidelines

1. Component Creation
   - Place in appropriate directory based on usage
   - Use TypeScript interfaces/types
   - Include JSDoc comments
   - Follow naming conventions

2. Import Management
   - Use `@/` alias consistently
   - Group imports by type
   - Order: React, Next.js, External, Internal

3. File Naming
   - Components: PascalCase
   - Utilities: camelCase
   - Types: PascalCase
   - Constants: UPPER_SNAKE_CASE

4. Testing
   - Tests alongside components
   - End-to-end tests in `e2e/`
   - Integration tests in `__tests__/` 