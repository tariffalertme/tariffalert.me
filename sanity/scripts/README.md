# Sanity Data Import/Export Scripts

This directory contains scripts for importing and exporting data to/from your Sanity dataset.

## Prerequisites

1. Make sure you have the required environment variables in your `.env` file:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_DATASET=your_dataset
   SANITY_API_TOKEN=your_api_token
   ```

2. Install dependencies:
   ```bash
   npm install @sanity/client dotenv csv-parser slugify
   ```

## Available Scripts

### 1. Export Data (export-data.js)

Exports all documents from your Sanity dataset to JSON files.

```bash
node export-data.js
```

This will create JSON files in the `exports` directory for each document type:
- country.json
- product.json
- tariffUpdate.json
- tag.json

### 2. Import Data (import-data.js)

Imports documents from JSON files back into your Sanity dataset.

```bash
# Import all document types
node import-data.js

# Import a specific document type
node import-data.js tag
```

### 3. CSV to Sanity (csv-to-sanity.js)

Converts CSV files to Sanity documents and imports them.

```bash
node csv-to-sanity.js <csv-file> <document-type>
```

Example:
```bash
node csv-to-sanity.js ../templates/tag.csv tag
```

## CSV Templates

Template CSV files are provided in the `templates` directory:

1. `country.csv`:
   - name: Country name
   - code: ISO 2-letter country code
   - flag_asset_ref: Sanity image asset reference
   - tags: Comma-separated tag references
   - major_exports: Comma-separated export categories

2. `product.csv`:
   - name: Product name
   - image_asset_ref: Sanity image asset reference
   - image_alt: Alt text for image
   - affiliate_url: Product URL
   - tags: Comma-separated tag references
   - tariff_updates: Comma-separated tariff update references

3. `tariffUpdate.csv`:
   - imposing_country_ref: Reference to imposing country
   - impacted_country_ref: Reference to impacted country
   - effective_date: YYYY-MM-DD format
   - type: 'new', 'modification', or 'removal'
   - affected_categories: Comma-separated category references
   - new_rate: Numeric tariff rate
   - details: Text description

4. `tag.csv`:
   - name: Tag name
   - type: 'product_category', 'country', 'attribute', or 'industry'

## Workflow Example

1. Export existing data:
   ```bash
   node export-data.js
   ```

2. Modify the exported JSON files or prepare new CSV files

3. Import data:
   ```bash
   # From JSON
   node import-data.js

   # From CSV
   node csv-to-sanity.js ../templates/tag.csv tag
   node csv-to-sanity.js ../templates/country.csv country
   node csv-to-sanity.js ../templates/product.csv product
   node csv-to-sanity.js ../templates/tariffUpdate.csv tariffUpdate
   ```

## Notes

- When importing from CSV, make sure to import tags first, then countries, then products, and finally tariff updates to maintain proper references
- Image assets must be uploaded separately through the Sanity Studio before referencing them in CSV files
- The scripts handle basic error cases but may need adjustment for specific use cases
- Always backup your data before running imports
- Test imports on a development dataset first if possible 