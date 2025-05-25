const { createClient } = require('@sanity/client')
const { parse } = require('csv-parse')
const fs = require('fs')
const path = require('path')
const { stringify } = require('csv-stringify')
const dotenv = require('dotenv')

interface Tag {
  name: string
  type: string
}

interface Country {
  name: string
  code: string
  region: string
  flagUrl?: string
  flagIconUrl?: string
  countryTags?: string
  majorExports?: string
  productCategories?: string
}

interface Product {
  name: string
  slug?: string
  description?: string
  image?: string
  affiliateUrl?: string
  currentPrice?: string
  productCategories?: string
  attributes?: string
  relatedTariffUpdates?: string
}

interface TariffUpdate {
  imposing_country_ref: string
  impacted_country_ref: string
  effective_date: string
  type: string
  affected_categories: string
  new_rate: string
  history_dates: string
  history_rates: string
  history_notes: string
  details: string
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-03-25'
})

const envPath = fs.existsSync(path.resolve(__dirname, '../../.env.local'))
  ? path.resolve(__dirname, '../../.env.local')
  : path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const parseCSV = <T>(filePath: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (data: T) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject)
  })
}

const importTags = async () => {
  const tags = await parseCSV<Tag>(path.join(__dirname, '../exports/current_tags.csv'))
  for (const tag of tags) {
    await client.createIfNotExists({
      _id: `tag-${tag.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      _type: 'tag',
      name: tag.name,
      type: tag.type
    })
  }
  console.log('Tags imported successfully')
}

const importCountries = async () => {
  const countries = await parseCSV<Country>(path.join(__dirname, '../exports/current_countries.csv'))
  for (const country of countries) {
    await client.createIfNotExists({
      _id: `country-${country.code}`,
      _type: 'country',
      name: country.name,
      code: country.code,
      region: country.region,
      flagUrl: country.flagUrl,
      flagIconUrl: country.flagIconUrl,
      countryTags: country.countryTags,
      majorExports: country.majorExports,
      productCategories: country.productCategories
    })
  }
  console.log('Countries imported successfully')
}

const importProducts = async () => {
  const products = await parseCSV<Product>(path.join(__dirname, '../exports/current_products.csv'))
  for (const product of products) {
    // Get tag references
    const productCategories = product.productCategories?.split(',').map((cat: string) => ({
      _type: 'reference',
      _ref: `tag-${cat.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    }))
    
    const attributes = product.attributes?.split(',').filter(Boolean).map((attr: string) => ({
      _type: 'reference',
      _ref: `tag-${attr.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    }))

    await client.createIfNotExists({
      _id: `product-${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      _type: 'product',
      name: product.name,
      slug: product.slug,
      description: product.description,
      image: product.image,
      affiliateUrl: product.affiliateUrl,
      currentPrice: product.currentPrice,
      productCategories,
      attributes,
      relatedTariffUpdates: product.relatedTariffUpdates?.split(',').filter(Boolean).map((ref: string) => ({
        _type: 'reference',
        _ref: ref.trim()
      }))
    })
  }
  console.log('Products imported successfully')
}

const importTariffUpdates = async () => {
  const updates = await parseCSV<TariffUpdate>(path.join(__dirname, '../exports/current_tariffUpdates.csv'))
  for (const update of updates) {
    const historyDates = update.history_dates.split(',')
    const historyRates = update.history_rates.split(',')
    const historyNotes = update.history_notes.split(',')
    
    const history = historyDates.map((date: string, i: number) => ({
      _type: 'rateHistory',
      date: date.trim(),
      rate: parseFloat(historyRates[i].trim()),
      notes: historyNotes[i]?.trim() || ''
    }))

    await client.createIfNotExists({
      _id: `tariff-${update.imposing_country_ref}-${update.impacted_country_ref}-${update.effective_date}`,
      _type: 'tariffUpdate',
      imposingCountry: { _type: 'reference', _ref: update.imposing_country_ref },
      impactedCountry: { _type: 'reference', _ref: update.impacted_country_ref },
      effectiveDate: update.effective_date,
      type: update.type,
      affectedCategories: update.affected_categories.split(',').map((cat: string) => ({
        _type: 'reference',
        _ref: `tag-${cat.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      })),
      newRate: parseFloat(update.new_rate),
      history,
      details: JSON.parse(update.details)
    })
  }
  console.log('Tariff updates imported successfully')
}

async function fetchCurrentSchemas() {
  const schemas = await client.fetch(`
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
  return schemas
}

async function exportCurrentData(schemas: any) {
  // Export countries
  const countriesCSV = schemas.countries.map((country: any) => ({
    name: country.name,
    code: country.code,
    region: country.region,
    flagUrl: country.flagUrl || '',
    flagIconUrl: country.flagIconUrl || '',
    countryTags: (country.countryTags || []).join(','),
    majorExports: (country.majorExports || []).join(','),
    productCategories: (country.productCategories || []).map((ref: any) => ref._ref).join(',')
  }))
  
  fs.writeFileSync(
    path.join(__dirname, '../exports/current_countries.csv'),
    stringify(countriesCSV, { header: true })
  )

  // Export products with proper image handling
  const productsCSV = schemas.products.map((product: any) => ({
    name: product.name,
    slug: product.slug?.current || '',
    description: product.description || '',
    image: product.image?.asset?._ref || '', // Store Sanity image reference
    affiliateUrl: product.affiliateUrl || '',
    currentPrice: product.currentPrice || '',
    productCategories: (product.productCategories || []).map((ref: any) => ref._ref).join(','),
    attributes: (product.attributes || []).map((ref: any) => ref._ref).join(','),
    relatedTariffUpdates: (product.relatedTariffUpdates || []).map((ref: any) => ref._ref).join(',')
  }))

  fs.writeFileSync(
    path.join(__dirname, '../exports/current_products.csv'),
    stringify(productsCSV, { header: true })
  )

  // Export tags
  const tagsCSV = schemas.tags.map((tag: any) => ({
    name: tag.name,
    type: tag.type
  }))

  fs.writeFileSync(
    path.join(__dirname, '../exports/current_tags.csv'),
    stringify(tagsCSV, { header: true })
  )

  // Export tariff updates
  const tariffUpdatesCSV = schemas.tariffUpdates.map((update: any) => ({
    imposing_country_ref: update.imposingCountry._id,
    impacted_country_ref: update.impactedCountry._id,
    effective_date: update.effectiveDate,
    type: update.type,
    affected_categories: update.affectedCategories.map((ref: any) => ref._id).join(','),
    new_rate: update.newRate,
    history_dates: update.history?.map((h: any) => h.date).join(',') || '',
    history_rates: update.history?.map((h: any) => h.rate).join(',') || '',
    history_notes: update.history?.map((h: any) => h.notes).join(',') || '',
    details: JSON.stringify(update.details || {})
  }))

  fs.writeFileSync(
    path.join(__dirname, '../exports/current_tariffUpdates.csv'),
    stringify(tariffUpdatesCSV, { header: true })
  )
}

const main = async () => {
  try {
    // First fetch and export current data
    const schemas = await fetchCurrentSchemas()
    await exportCurrentData(schemas)
    
    // Then proceed with imports in correct order
    await importTags()
    await importCountries()
    await importTariffUpdates()
    await importProducts()
    console.log('All data imported successfully')
  } catch (error) {
    console.error('Error:', error)
  }
}

main() 