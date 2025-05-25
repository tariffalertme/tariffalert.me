import { createClient } from '@sanity/client'
import csv from 'csv-parser'
import fs from 'fs'
import dotenv from 'dotenv'
import slugify from 'slugify'

dotenv.config({ path: '../.env' })

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-03-19',
  useCdn: false,
})

// Usage: node import-from-csv.js <csv-file> <content-type>
// Example: node import-from-csv.js tags.csv tag
const [,, csvFile, contentType] = process.argv

if (!csvFile || !contentType) {
  console.error('Please provide a CSV file and content type')
  process.exit(1)
}

const results = []

fs.createReadStream(csvFile)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    console.log(`Importing ${results.length} items...`)
    
    const transaction = client.transaction()
    
    for (const item of results) {
      const doc = {
        _type: contentType,
        name: item.name,
        slug: {
          _type: 'slug',
          current: slugify(item.name, { lower: true })
        }
      }
      
      // Add any additional fields from CSV
      Object.keys(item).forEach(key => {
        if (key !== 'name' && key !== 'slug') {
          doc[key] = item[key]
        }
      })
      
      transaction.create(doc)
    }
    
    try {
      await transaction.commit()
      console.log('Successfully imported data!')
    } catch (error) {
      console.error('Error importing data:', error)
    }
  }) 