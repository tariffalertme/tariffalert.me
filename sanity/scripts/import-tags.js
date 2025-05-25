import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-03-19',
  useCdn: false,
})

// Example tags - replace with your own
const tags = [
  { name: 'Trade Policy', slug: 'trade-policy' },
  { name: 'Import Duties', slug: 'import-duties' },
  { name: 'Export Regulations', slug: 'export-regulations' },
  // Add more tags here
]

async function importTags() {
  console.log('Starting tag import...')
  
  const transaction = client.transaction()
  
  for (const tag of tags) {
    transaction.create({
      _type: 'tag',
      name: tag.name,
      slug: {
        _type: 'slug',
        current: tag.slug
      }
    })
  }
  
  try {
    await transaction.commit()
    console.log('Successfully imported tags!')
  } catch (error) {
    console.error('Error importing tags:', error)
  }
}

// Run the import
importTags() 