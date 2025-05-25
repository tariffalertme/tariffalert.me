# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Country impact analysis database schema
- TypeScript types for country impact tables
- Basic `CountryImpactService` class structure
- Comprehensive `CountryImpactService` implementation with:
  - Trade statistics analysis
  - Tariff change tracking
  - Consumer segment management
  - Country relationship handling
  - Impact score calculation
  - AI-powered recommendations
- Data access layer (`CountryDataService`) for country impact tables
- UI components for country impact visualization:
  - Card component for structured content display
  - Table component for data presentation
  - Badge component for status indicators
  - Progress component for metrics visualization
- React component for country impact analysis with:
  - Overview section with impact score
  - Trade statistics visualization
  - Tariff changes tracking
  - Consumer segments display
  - Country relationships network
  - AI-generated recommendations
- Implemented data population script (`scripts/populate-country-data.ts`) with:
  - Country data population
  - Trade statistics population
  - Tariff changes recording
  - Consumer segments population
  - Country relationships population
- Proper error handling and logging in data population script
- Created comprehensive task list for website redesign
- Planned new homepage layout with improved UX/UI
- Added placeholder for newsletter subscription feature
- Planned ad space integration for future monetization

### Changed
- Enhanced `OpenAIService` with recommendation generation
- Updated `TemplateEngine` with country impact templates
- Improved error handling and logging across services
- Updated database configuration:
  - Switched to session pooler connection for IPv4 compatibility
  - Configured SSL mode for enhanced security
  - Updated connection string format and credentials
  - Fixed database connectivity issues in deployment
- Updated path aliases in tsconfig.json to point to src/ directory:
  - Changed `@/*` to point to `./src/*`
  - Changed `@/components/*` to point to `./src/components/*`
  - Changed `@/lib/*` to point to `./src/lib/*`
  - Ensures consistent import paths across the project
- Removed authentication component in favor of simpler design
- Updated product showcase to display randomized new products
- Moved filtering functionality to dedicated Explore page
- Improved GROQ queries to return full slug objects instead of just current values
- Enhanced UI components with new Heading component implementation
- Restructured portable-text components for better maintainability
- Fixed TwitterFeed component styling:
  - Reduced font sizes from text-sm to text-xs
  - Adjusted avatar size from 32px to 24px
  - Changed spacing classes for better compactness
  - Fixed header overlap with exact pixel mt-[64px]
  - Added z-10 to ensure proper layering
- Marked Country Detail Page as complete: Implemented as a modal on the /countries page; [code].tsx route not required for current requirements.

### Technical Notes

#### Sanity Integration Fixes
1. **GROQ Query Structure Issue**
   - Previous Implementation:
     ```groq
     *[_type == "article" && slug.current == $slug][0] {
       title,
       "slug": slug.current,  // Was transforming the slug object into just the string
       publishedAt,
       // ... other fields
     }
     ```
   - Current Implementation:
     ```groq
     *[_type == "article" && slug.current == $slug][0] {
       title,
       slug,  // Now returns the full slug object {_type: "slug", current: string}
       publishedAt,
       // ... other fields
     }
     ```
   - Impact: Maintains type consistency between Sanity schema and TypeScript interfaces

2. **Failed Attempts That Were Tried:**
   - Modifying TypeScript interfaces to expect string instead of object (caused type mismatches)
   - Adding explicit type casting (masked the underlying data structure issue)
   - Updating Sanity schema (unnecessary as schema was correct)
   - Modifying the component to handle both formats (added complexity without solving root cause)

3. **Root Cause Analysis:**
   - Sanity stores slugs as objects with {_type: "slug", current: string}
   - TypeScript interfaces correctly expected this structure
   - GROQ query was transforming the data unnecessarily
   - This caused a mismatch between expected and received data structures

4. **Solution Components:**
   - Keep Sanity schema as is (slug field as type 'slug')
   - Keep TypeScript interfaces as is (expecting slug object)
   - Modify GROQ queries to return full slug object
   - Ensure consistency across all queries (news, products, etc.)

5. **Lessons for Future Sanity Integration:**
   - Always check Sanity Studio schema structure first
   - Match TypeScript interfaces to Sanity's native data structures
   - Keep GROQ queries aligned with both schema and interfaces
   - Test with actual content in Sanity Studio before extensive debugging

#### TwitterFeed Component Styling Guidelines
1. **Spacing Requirements**
   - Top margin MUST use exact pixels: `mt-[64px]` (matches header height)
   - Component MUST have `z-10` to maintain proper layer order
   - Never use relative margins (mt-16, etc.) as they cause header overlap

2. **Font Sizes**
   - All text MUST use `text-xs` class
   - This includes:
     - Author name
     - Handle
     - Timestamp
     - Tweet content
   - Never increase beyond `text-xs` to maintain compact design

3. **Component Dimensions**
   - Avatar size: 24x24px (w-6 h-6)
   - Verified badge: 10x10px (w-2.5 h-2.5)
   - Padding: px-4 py-1.5
   - Spacing between elements: space-x-2 or space-x-1.5

4. **Implementation Checklist**
   - [ ] Verify mt-[64px] is present
   - [ ] Confirm z-10 is set
   - [ ] Check all text elements use text-xs
   - [ ] Validate avatar and badge sizes
   - [ ] Test header overlap on all screen sizes

#### Deployment Strategy
1. **Initial Setup**
   - Deploy to Vercel (recommended for Next.js):
     ```bash
     # Install Vercel CLI
     npm i -g vercel
     
     # Deploy
     vercel
     ```
   - Configure domains:
     - Production: tariffalert.me
     - Staging: staging.tariffalert.me
     - Preview: *.vercel.app

2. **Environment Configuration**
   - Production variables in Vercel dashboard:
     ```env
     NEXT_PUBLIC_SANITY_PROJECT_ID=xxx
     NEXT_PUBLIC_SANITY_DATASET=production
     SANITY_API_TOKEN=xxx
     ```
   - Staging variables for testing:
     ```env
     NEXT_PUBLIC_SANITY_DATASET=staging
     ```

3. **Deployment Workflow**
   - Feature branches → Preview deployments
   - Staging branch → staging.tariffalert.me
   - Main branch → tariffalert.me
   - Each PR gets a unique preview URL
   - Automatic deployment on merge

4. **Content Updates**
   - Sanity Studio changes reflect immediately
   - No deployment needed for content updates
   - Content can be previewed before publishing

5. **Code Update Process**
   - Push changes to feature branch
   - Vercel creates preview deployment
   - Test on preview URL
   - Create PR to staging
   - Test on staging environment
   - Merge to main for production

6. **Rollback Process**
   - Instant rollback in Vercel dashboard
   - Or revert commit and auto-deploy
   - Content rollback via Sanity versioning

7. **Monitoring**
   - Vercel Analytics for performance
   - Error tracking with Sentry
   - Real-time logs in Vercel dashboard
   - Uptime monitoring with UptimeRobot

### Security
- Enabled SSL mode for database connections
- Configured secure session pooler for database access
- Updated database credentials and connection parameters

### Fixed
- Database connectivity issues in deployment
- IPv4 compatibility problems with direct database connection
- Connection string format and credentials
- Slug object transformation in GROQ queries to match TypeScript interfaces
- News article page data fetching and display
- Loading states and error handling in news and product pages

### Missing (To Be Implemented)
- ETL processes for trade statistics
- Integration with product recommendations
- Integration with price predictions
- Data population scripts
- Automated tariff change updates

## [0.1.0] - 2024-04-15
### Added
- Initial project setup with Next.js 14
- Supabase integration
- Basic authentication system
- Product management system
- News aggregation system
- Price prediction service
- Basic frontend components
- Initial project setup
- Basic homepage layout
- Country impact analysis component
- Twitter feed integration 