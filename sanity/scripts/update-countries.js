import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { config } from 'dotenv'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from the root .env.local file
const envPath = fs.existsSync(resolve(__dirname, '../../.env.local'))
  ? resolve(__dirname, '../../.env.local')
  : resolve(__dirname, '../../.env');
config({ path: envPath })

// Initialize the client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-04-19',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const countries = [
  {
    _id: 'country.US',
    name: 'United States',
    code: 'US',
    flagUrl: 'https://flagcdn.com/h120/us.png',
    flagIconUrl: 'https://flagcdn.com/h24/us.png',
  },
  {
    _id: 'country.CN',
    name: 'China',
    code: 'CN',
    flagUrl: 'https://flagcdn.com/h120/cn.png',
    flagIconUrl: 'https://flagcdn.com/h24/cn.png',
  },
  {
    _id: 'country.JP',
    name: 'Japan',
    code: 'JP',
    flagUrl: 'https://flagcdn.com/h120/jp.png',
    flagIconUrl: 'https://flagcdn.com/h24/jp.png',
  },
  {
    _id: 'country.KR',
    name: 'South Korea',
    code: 'KR',
    flagUrl: 'https://flagcdn.com/h120/kr.png',
    flagIconUrl: 'https://flagcdn.com/h24/kr.png',
  },
  {
    _id: 'country.DE',
    name: 'Germany',
    code: 'DE',
    flagUrl: 'https://flagcdn.com/h120/de.png',
    flagIconUrl: 'https://flagcdn.com/h24/de.png',
  },
  {
    _id: 'country.FR',
    name: 'France',
    code: 'FR',
    flagUrl: 'https://flagcdn.com/h120/fr.png',
    flagIconUrl: 'https://flagcdn.com/h24/fr.png',
  },
  {
    _id: 'country.GB',
    name: 'United Kingdom',
    code: 'GB',
    flagUrl: 'https://flagcdn.com/h120/gb.png',
    flagIconUrl: 'https://flagcdn.com/h24/gb.png',
  },
  {
    _id: 'country.IT',
    name: 'Italy',
    code: 'IT',
    flagUrl: 'https://flagcdn.com/h120/it.png',
    flagIconUrl: 'https://flagcdn.com/h24/it.png',
  },
  {
    _id: 'country.CA',
    name: 'Canada',
    code: 'CA',
    flagUrl: 'https://flagcdn.com/h120/ca.png',
    flagIconUrl: 'https://flagcdn.com/h24/ca.png',
  },
  {
    _id: 'country.AU',
    name: 'Australia',
    code: 'AU',
    flagUrl: 'https://flagcdn.com/h120/au.png',
    flagIconUrl: 'https://flagcdn.com/h24/au.png',
  },
]

async function updateCountries() {
  console.log('Starting country data update...')
  console.log('Using Sanity project:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
  console.log('Using Sanity dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET)
  
  try {
    // Create transactions for each country
    const transaction = countries.map(country => ({
      createOrReplace: {
        _type: 'country',
        ...country
      }
    }))

    // Execute the transaction
    const result = await client.transaction(transaction).commit()
    console.log('Successfully updated countries:', result)
  } catch (error) {
    console.error('Error updating countries:', error)
    console.error('Error details:', error.message)
  }
}

// Run the update
updateCountries() 