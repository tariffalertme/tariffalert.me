import { createClient } from '@sanity/client'
import csv from 'csv-parser'
import fs from 'fs'
import dotenv from 'dotenv'
import path from 'path'
import slugify from 'slugify'

dotenv.config({ path: '../.env' })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-03-19',
  useCdn: false,
})

// CSV field mappings for each document type
const fieldMappings = {
  country: {
    name: 'name',
    code: 'code',
    flag: (row) => ({
      _type: 'image',
      asset: { _ref: row.flag_asset_ref }
    }),
    tags: (row) => row.tags ? row.tags.split(',').map(tag => ({
      _type: 'reference',
      _ref: tag.trim()
    })) : [],
    majorExports: (row) => row.major_exports ? row.major_exports.split(',').map(e => e.trim()) : []
  },
  product: {
    name: 'name',
    image: (row) => ({
      _type: 'image',
      asset: { _ref: row.image_asset_ref },
      alt: row.image_alt || row.name
    }),
    affiliateUrl: 'affiliate_url',
    tags: (row) => row.tags ? row.tags.split(',').map(tag => ({
      _type: 'reference',
      _ref: tag.trim()
    })) : [],
    relatedTariffUpdates: (row) => row.tariff_updates ? row.tariff_updates.split(',').map(ref => ({
      _type: 'reference',
      _ref: ref.trim()
    })) : []
  },
  tariffUpdate: {
    imposingCountry: (row) => ({
      _type: 'reference',
      _ref: row.imposing_country_ref
    }),
    impactedCountry: (row) => ({
      _type: 'reference',
      _ref: row.impacted_country_ref
    }),
    effectiveDate: 'effective_date',
    type: 'type',
    affectedCategories: (row) => row.affected_categories ? row.affected_categories.split(',').map(cat => ({
      _type: 'reference',
      _ref: cat.trim()
    })) : [],
    newRate: 'new_rate',
    details: (row) => [{
      _type: 'block',
      children: [{
        _type: 'span',
        text: row.details || ''
      }]
    }]
  },
  tag: {
    name: 'name',
    type: 'type'
  }
}

// Convert CSV row to Sanity document
function convertToSanityDoc(row, type) {
  const mapping = fieldMappings[type]
  const doc = {
    _type: type
  }

  for (const [field, mapper] of Object.entries(mapping)) {
    if (typeof mapper === 'function') {
      doc[field] = mapper(row)
    } else {
      doc[field] = row[mapper]
    }
  }

  return doc
}

// Process CSV file and create Sanity documents
async function processCsvFile(csvPath, type) {
  if (!fieldMappings[type]) {
    throw new Error(`Unknown document type: ${type}`)
  }

  const results = []
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => results.push(convertToSanityDoc(row, type)))
      .on('end', async () => {
        try {
          console.log(`Converting ${results.length} rows to ${type} documents...`)
          
          const transaction = client.transaction()
          
          for (const doc of results) {
            transaction.create(doc)
          }
          
          await transaction.commit()
          console.log(`✓ Successfully imported ${results.length} ${type} documents`)
          resolve(results)
        } catch (error) {
          console.error('Error importing documents:', error)
          reject(error)
        }
      })
      .on('error', reject)
  })
}

// Usage check
const [,, csvFile, documentType] = process.argv

if (!csvFile || !documentType) {
  console.error('Please provide a CSV file path and document type')
  console.error('Usage: node csv-to-sanity.js <csv-file> <document-type>')
  console.error('Available document types:', Object.keys(fieldMappings).join(', '))
  process.exit(1)
}

processCsvFile(csvFile, documentType).catch(console.error) 