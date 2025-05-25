import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = fs.existsSync(path.resolve(__dirname, '../../.env.local'))
  ? path.resolve(__dirname, '../../.env.local')
  : path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'NEXT_PUBLIC_SANITY_API_VERSION',
  'SANITY_API_TOKEN'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Initialize Sanity client
function initSanityClient() {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  });
}

// Full dataset
const countries = [
  {
    _type: 'country',
    _id: 'KC6KRTtNL6jVBSHZqXBk9j',
    name: 'United States',
    code: 'US',
    flagUrl: 'https://flagcdn.com/h120/us.png',
    flagIconUrl: 'https://flagcdn.com/h24/us.png'
  },
  {
    _type: 'country',
    _id: 'KC6KRTtNL6jVBSHZqXBkNu',
    name: 'China',
    code: 'CN',
    flagUrl: 'https://flagcdn.com/h120/cn.png',
    flagIconUrl: 'https://flagcdn.com/h24/cn.png'
  },
  {
    _type: 'country',
    _id: 'country.DE',
    name: 'Germany',
    code: 'DE',
    flagUrl: 'https://flagcdn.com/h120/de.png',
    flagIconUrl: 'https://flagcdn.com/h24/de.png'
  },
  {
    _type: 'country',
    _id: 'country.FR',
    name: 'France',
    code: 'FR',
    flagUrl: 'https://flagcdn.com/h120/fr.png',
    flagIconUrl: 'https://flagcdn.com/h24/fr.png'
  },
  {
    _type: 'country',
    _id: 'country.IT',
    name: 'Italy',
    code: 'IT',
    flagUrl: 'https://flagcdn.com/h120/it.png',
    flagIconUrl: 'https://flagcdn.com/h24/it.png'
  },
  {
    _type: 'country',
    _id: 'country.JP',
    name: 'Japan',
    code: 'JP',
    flagUrl: 'https://flagcdn.com/h120/jp.png',
    flagIconUrl: 'https://flagcdn.com/h24/jp.png'
  },
  {
    _type: 'country',
    _id: 'country.KR',
    name: 'South Korea',
    code: 'KR',
    flagUrl: 'https://flagcdn.com/h120/kr.png',
    flagIconUrl: 'https://flagcdn.com/h24/kr.png'
  },
  {
    _type: 'country',
    _id: 'country.VN',
    name: 'Vietnam',
    code: 'VN',
    flagUrl: 'https://flagcdn.com/h120/vn.png',
    flagIconUrl: 'https://flagcdn.com/h24/vn.png'
  },
  {
    _type: 'country',
    _id: 'country.TH',
    name: 'Thailand',
    code: 'TH',
    flagUrl: 'https://flagcdn.com/h120/th.png',
    flagIconUrl: 'https://flagcdn.com/h24/th.png'
  },
  {
    _type: 'country',
    _id: 'country.MY',
    name: 'Malaysia',
    code: 'MY',
    flagUrl: 'https://flagcdn.com/h120/my.png',
    flagIconUrl: 'https://flagcdn.com/h24/my.png'
  },
  {
    _type: 'country',
    _id: 'country.IN',
    name: 'India',
    code: 'IN',
    flagUrl: 'https://flagcdn.com/h120/in.png',
    flagIconUrl: 'https://flagcdn.com/h24/in.png'
  },
  {
    _type: 'country',
    _id: 'country.BR',
    name: 'Brazil',
    code: 'BR',
    flagUrl: 'https://flagcdn.com/h120/br.png',
    flagIconUrl: 'https://flagcdn.com/h24/br.png'
  }
];

const tags = [
  {
    _type: 'tag',
    _id: '3abf556c-ed8c-491c-964b-675262070d1e',
    name: 'Electronics',
    type: 'product_category'
  },
  {
    _type: 'tag',
    _id: 'e3b22fc4-8bf1-44b6-9acc-81b034b4c195',
    name: 'Electronics Industry',
    type: 'industry'
  },
  {
    _type: 'tag',
    _id: '41e9f325-baf2-4320-bbe8-d645343af187',
    name: 'Medications',
    type: 'product_category'
  },
  {
    _type: 'tag',
    _id: 'cfd60cfc-e9c6-47b9-b69f-31c1d050d51d',
    name: 'Pharmaceuticals',
    type: 'industry'
  },
  {
    _type: 'tag',
    _id: 'f0937c3f-f22b-447a-9cd5-086a6fcff6e0',
    name: 'Cell Phones & Accessories',
    type: 'product_category'
  },
  {
    _type: 'tag',
    _id: '11111111-aaaa-bbbb-cccc-222222222222',
    name: 'Samsung',
    type: 'attribute'
  },
  {
    _type: 'tag',
    _id: '33333333-aaaa-bbbb-cccc-444444444444',
    name: 'Braun',
    type: 'attribute'
  },
  {
    _type: 'tag',
    _id: '55555555-aaaa-bbbb-cccc-666666666666',
    name: 'Dualit',
    type: 'attribute'
  },
  {
    _type: 'tag',
    _id: '77777777-aaaa-bbbb-cccc-888888888888',
    name: 'Luxury Goods',
    type: 'product_category'
  },
  {
    _type: 'tag',
    _id: '99999999-aaaa-bbbb-cccc-000000000000',
    name: 'Generic Drugs',
    type: 'product_category'
  }
];

const tariffUpdates = [
  {
    _type: 'tariffUpdate',
    _id: 'tariff.20250410.us-eu-delay.DE',
    imposingCountry: { _ref: 'KC6KRTtNL6jVBSHZqXBk9j' },
    impactedCountry: { _ref: 'country.DE' },
    effectiveDate: '2025-04-10',
    type: 'modification',
    newRate: 0,
    affectedCategories: []
  },
  {
    _type: 'tariffUpdate',
    _id: 'tariff.20250411.us-cn-hike',
    imposingCountry: { _ref: 'KC6KRTtNL6jVBSHZqXBk9j' },
    impactedCountry: { _ref: 'KC6KRTtNL6jVBSHZqXBkNu' },
    effectiveDate: '2025-04-11',
    type: 'modification',
    newRate: 145,
    affectedCategories: [{ _ref: '3abf556c-ed8c-491c-964b-675262070d1e' }]
  }
];

// Image URLs for products (using placeholder images)
const productImages = {
  'prod.0001': 'https://picsum.photos/800/600?random=1',
  'prod.0002': 'https://picsum.photos/800/600?random=2',
  'prod.0003': 'https://picsum.photos/800/600?random=3'
};

const products = [
  {
    _type: 'product',
    _id: 'prod.0001',
    name: 'Apple AirTag (4-Pack)',
    affiliateUrl: 'https://amzn.to/airtag4pack',
    productCategories: [{ _ref: 'f0937c3f-f22b-447a-9cd5-086a6fcff6e0' }],
    attributes: [],
    relatedTariffUpdates: [{ _ref: 'tariff.20250411.us-cn-hike' }],
    dateAdded: new Date().toISOString(),
    lastChecked: new Date().toISOString()
  },
  {
    _type: 'product',
    _id: 'prod.0002',
    name: 'Anker 733 Power Bank',
    affiliateUrl: 'https://amzn.to/anker733',
    productCategories: [{ _ref: '3abf556c-ed8c-491c-964b-675262070d1e' }],
    attributes: [],
    relatedTariffUpdates: [{ _ref: 'tariff.20250411.us-cn-hike' }],
    dateAdded: new Date().toISOString(),
    lastChecked: new Date().toISOString()
  },
  {
    _type: 'product',
    _id: 'prod.0003',
    name: 'Braun Series 9 Electric Shaver',
    affiliateUrl: 'https://amzn.to/braunseries9',
    productCategories: [
      { _ref: '3abf556c-ed8c-491c-964b-675262070d1e' },
      { _ref: '77777777-aaaa-bbbb-cccc-888888888888' }
    ],
    attributes: [{ _ref: '33333333-aaaa-bbbb-cccc-444444444444' }],
    relatedTariffUpdates: [{ _ref: 'tariff.20250410.us-eu-delay.DE' }],
    dateAdded: new Date().toISOString(),
    lastChecked: new Date().toISOString()
  }
];

// Function to upload image asset to Sanity
async function uploadImageAsset(imageUrl, client, retries = 3) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const cacheBustUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
      const filename = imageUrl.split('/').pop() || 'image';
      
      const response = await fetch(cacheBustUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      
      const asset = await client.assets.upload('image', Buffer.from(buffer), {
        filename,
        contentType: response.headers.get('content-type'),
        metadata: {
          description: `Image for ${filename}`,
          source: {
            url: imageUrl,
            name: filename
          }
        }
      });

      console.log(`Successfully uploaded image: ${filename}`);
      return asset._id;

    } catch (error) {
      attempt++;
      const backoff = Math.min(1000 * Math.pow(2, attempt), 10000);
      console.error(`Attempt ${attempt}/${retries} failed for ${imageUrl}:`, error.message);
      
      if (attempt === retries) {
        throw new Error(`Failed to upload image after ${retries} attempts: ${error.message}`);
      }
      
      console.log(`Retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}

function validateEnvVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'NEXT_PUBLIC_SANITY_DATASET',
    'NEXT_PUBLIC_SANITY_API_VERSION',
    'SANITY_API_TOKEN'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function updateSanityData() {
  try {
    validateEnvVariables();
    const client = initSanityClient();
    console.log('Initialized Sanity client');

    // Upload countries
    console.log('Uploading countries...');
    for (const country of countries) {
      await client.createOrReplace(country);
      console.log(`Uploaded country: ${country.name}`);
    }

    // Upload tags
    console.log('Uploading tags...');
    for (const tag of tags) {
      await client.createOrReplace(tag);
      console.log(`Uploaded tag: ${tag.name}`);
    }

    // Upload tariff updates
    console.log('Uploading tariff updates...');
    for (const update of tariffUpdates) {
      await client.createOrReplace(update);
      console.log(`Uploaded tariff update: ${update._id}`);
    }

    // Process products with images
    console.log('Processing products...');
    for (const product of products) {
      try {
        console.log(`Processing product ${product._id}...`);
        
        const imageUrl = productImages[product._id];
        if (imageUrl) {
          try {
            console.log(`Uploading image for product ${product._id}...`);
            const imageAssetId = await uploadImageAsset(imageUrl, client);
            console.log(`Successfully uploaded image for product ${product._id}`);
            
            product.image = {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: imageAssetId
              }
            };
          } catch (imageError) {
            console.error(`Failed to upload image for product ${product._id}:`, imageError.message);
            throw imageError;
          }
        }
        
        await client.createOrReplace(product);
        console.log(`Successfully updated product ${product._id} in Sanity`);

      } catch (error) {
        console.error(`Error processing product ${product._id}:`, error.message);
        throw error;
      }
    }

    console.log('Successfully completed data update process');
  } catch (error) {
    console.error('Failed to update Sanity data:', error.message);
    throw error;
  }
}

// Run the update
updateSanityData(); 