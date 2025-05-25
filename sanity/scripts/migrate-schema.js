import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config()

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN, // needs write access
  apiVersion: '2024-03-20',
  useCdn: false
})

// Migrate products
async function migrateProducts() {
  const products = await client.fetch('*[_type == "product"]')
  
  for (const product of products) {
    const updates = {
      // Remove fields we don't want anymore
      $unset: ['slug', 'description', 'price', 'url', 'imageUrl', 'imageAlt'],
      
      // Add new fields with default values
      $set: {
        image: null, // Images will need to be uploaded manually
        retailerLinks: [{
          _type: 'object',
          retailerName: 'Original Source',
          affiliateUrl: product.url || ''
        }],
        dateAdded: new Date().toISOString(),
        tariffInfo: {
          _type: 'object',
          currentRate: 0,
          futureRate: null,
          effectiveDate: null
        },
        // Convert tag references to strings
        tags: Array.isArray(product.tags) 
          ? product.tags.map(tag => tag.name || tag)
          : []
      }
    }

    try {
      await client
        .patch(product._id)
        .set(updates.$set)
        .unset(updates.$unset)
        .commit()
      
      console.log(`✓ Migrated product: ${product.name}`)
    } catch (error) {
      console.error(`✗ Failed to migrate product ${product.name}:`, error.message)
    }
  }
}

// Migrate countries
async function migrateCountries() {
  // First rename the document type from countryProfile to country
  const countries = await client.fetch('*[_type == "countryProfile"]')
  
  for (const country of countries) {
    try {
      // Create new country document
      const newCountry = {
        _type: 'country',
        name: country.name,
        code: country.code,
        flag: null, // Images will need to be uploaded manually
        // Convert majorExports references to strings
        majorExports: Array.isArray(country.majorExports) 
          ? country.majorExports.map(exp => exp.name || exp)
          : []
      }

      // Create new document and delete old one
      await client.create(newCountry)
      await client.delete(country._id)
      
      console.log(`✓ Migrated country: ${country.name}`)
    } catch (error) {
      console.error(`✗ Failed to migrate country ${country.name}:`, error.message)
    }
  }
}

// Run migrations
async function runMigrations() {
  console.log('Starting migrations...')
  
  try {
    await migrateProducts()
    console.log('✓ Products migration complete')
    
    await migrateCountries()
    console.log('✓ Countries migration complete')
  } catch (error) {
    console.error('Migration failed:', error)
  }
  
  console.log('Migration complete!')
}

runMigrations() 