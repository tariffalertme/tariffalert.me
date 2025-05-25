import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-03-25'
})

async function exportData() {
  try {
    const data = await client.fetch(`
      {
        "countries": *[_type == "country"] {
          _id,
          name,
          code,
          region,
          flagUrl,
          flagIconUrl,
          countryTags,
          majorExports,
          productCategories
        },
        "products": *[_type == "product"] {
          _id,
          name,
          slug,
          description,
          image,
          affiliateUrl,
          currentPrice,
          productCategories,
          attributes,
          relatedTariffUpdates
        },
        "tags": *[_type == "tag"] {
          _id,
          name,
          type
        },
        "tariffUpdates": *[_type == "tariffUpdate"] {
          _id,
          imposingCountry->{_id},
          impactedCountry->{_id},
          effectiveDate,
          type,
          affectedCategories[]->{_id},
          newRate,
          history
        }
      }
    `)

    // Save raw data for inspection
    fs.writeFileSync(
      path.join(__dirname, '../exports/raw_data.json'),
      JSON.stringify(data, null, 2)
    )

    console.log('Data exported successfully to raw_data.json')
    console.log('Schema structure:')
    Object.keys(data).forEach(type => {
      if (data[type].length > 0) {
        console.log(`\n${type} fields:`, Object.keys(data[type][0]))
      } else {
        console.log(`\n${type}: No documents found`)
      }
    })
  } catch (error) {
    console.error('Error exporting data:', error)
  }
}

exportData() 