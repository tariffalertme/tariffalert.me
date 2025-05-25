import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = fs.existsSync(path.resolve(__dirname, '../../.env.local'))
  ? path.resolve(__dirname, '../../.env.local')
  : path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const client = createClient({
  projectId: 'wvfxas7s',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-04-19'
});

async function checkData() {
  try {
    console.log('\nChecking Tariff Updates:');
    const tariffUpdates = await client.fetch(`
      *[_type == "tariffUpdate"] {
        _id,
        imposingCountry->{name, code},
        impactedCountry->{name, code},
        effectiveDate,
        type,
        newRate
      }
    `);
    console.log(JSON.stringify(tariffUpdates, null, 2));

    console.log('\nChecking Products:');
    const products = await client.fetch(`
      *[_type == "product"] {
        _id,
        name,
        affiliateUrl,
        "categories": productCategories[]->name,
        "attributes": attributes[]->name,
        "tariffUpdates": relatedTariffUpdates[]->{ 
          _id,
          effectiveDate,
          newRate,
          "imposingCountry": imposingCountry->name,
          "impactedCountry": impactedCountry->name
        }
      }
    `);
    console.log(JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

checkData(); 