import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const client = createClient({
  projectId: process.env.SANITY_STUDIO_API_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_API_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-04-19'
})

const countries = [
  {
    _type: 'country',
    name: 'United States',
    code: 'US',
    majorExports: ['Technology', 'Agriculture', 'Manufacturing', 'Services']
  },
  {
    _type: 'country',
    name: 'China',
    code: 'CN',
    majorExports: ['Electronics', 'Textiles', 'Machinery', 'Chemicals']
  },
  {
    _type: 'country',
    name: 'Germany',
    code: 'DE',
    majorExports: ['Automotive', 'Machinery', 'Chemicals', 'Electronics']
  },
  {
    _type: 'country',
    name: 'Japan',
    code: 'JP',
    majorExports: ['Automotive', 'Electronics', 'Machinery', 'Chemicals']
  }
]

async function seedCountries() {
  console.log('🌱 Seeding countries...')
  
  try {
    for (const country of countries) {
      console.log(`Creating country: ${country.name}`)
      await client.create(country)
    }
    console.log('✅ Countries seeded successfully!')
  } catch (error) {
    console.error('Error seeding countries:', error)
    process.exit(1)
  }
}

seedCountries() 