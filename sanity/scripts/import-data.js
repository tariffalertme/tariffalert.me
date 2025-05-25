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

// Verify token format
const token = process.env.SANITY_API_TOKEN;
if (!token) {
  console.error('No token found');
  process.exit(1);
}
console.log('Token format check:');
console.log('- Starts with "sk":', token.startsWith('sk'));
console.log('- Length:', token.length);

const projectId = 'wvfxas7s';  // Hardcoded since we know it's correct
const dataset = 'production';   // Hardcoded since we know it's correct

// Create client with debug mode enabled
const client = createClient({
  projectId,
  dataset,
  token,
  useCdn: false,
  apiVersion: '2024-04-19',
  // Enable request logging
  requestTagPrefix: 'sanity-import',
  logging: true
});

// Test the connection first
console.log('\nTesting connection...');
client.fetch('*[_type == "country"][0]')
  .then(result => {
    console.log('Connection test successful:', result ? 'Data found' : 'No data found');
    return importData();
  })
  .catch(error => {
    console.error('Connection test failed:', error);
    process.exit(1);
  });

async function importData() {
  console.log('\nStarting data import...');
  
  // Read the JSON file
  const dataPath = path.resolve(__dirname, '../exports/tariff_full_dataset.json');
  console.log('Reading data from:', dataPath);
  
  if (!fs.existsSync(dataPath)) {
    console.error('Error: Data file not found at', dataPath);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  try {
    // Import countries first
    console.log('\nImporting countries...');
    for (const doc of data.countries || []) {
      try {
        await client.createOrReplace({
          _type: 'country',
          ...doc
        });
        console.log(`✓ Imported country: ${doc.name}`);
      } catch (err) {
        console.error(`× Failed to import country: ${doc.name}`, err.message);
      }
    }
    
    // Import tags second
    console.log('\nImporting tags...');
    for (const doc of data.tags || []) {
      try {
        await client.createOrReplace({
          _type: 'tag',
          ...doc
        });
        console.log(`✓ Imported tag: ${doc.name}`);
      } catch (err) {
        console.error(`× Failed to import tag: ${doc.name}`, err.message);
      }
    }
    
    // Import tariff updates third
    console.log('\nImporting tariff updates...');
    for (const doc of data.tariffUpdates || []) {
      try {
        await client.createOrReplace({
          _type: 'tariffUpdate',
          ...doc
        });
        console.log(`✓ Imported tariff update: ${doc._id}`);
      } catch (err) {
        console.error(`× Failed to import tariff update: ${doc._id}`, err.message);
  }
}

    // Import products last
    console.log('\nImporting products...');
    for (const doc of data.products || []) {
      try {
        // Filter out any references to non-existent tariff updates
        if (doc.relatedTariffUpdates) {
          const validUpdates = [];
          for (const update of doc.relatedTariffUpdates) {
            try {
              // Check if the referenced tariff update exists
              const exists = await client.fetch(`*[_type == "tariffUpdate" && _id == $id][0]`, {
                id: update._ref
              });
              if (exists) {
                validUpdates.push(update);
              } else {
                console.log(`⚠ Skipping invalid tariff update reference in product ${doc.name}: ${update._ref}`);
              }
            } catch (err) {
              console.error(`Error checking tariff update reference: ${update._ref}`, err.message);
            }
          }
          doc.relatedTariffUpdates = validUpdates;
        }

        await client.createOrReplace({
          _type: 'product',
          ...doc
        });
        console.log(`✓ Imported product: ${doc.name}`);
      } catch (err) {
        console.error(`× Failed to import product: ${doc.name}`, err.message);
      }
  }
  
    console.log('\nImport completed successfully!');
    return true;
  } catch (error) {
    console.error('Import failed:', error);
    if (error.response) {
      console.error('Response details:');
      console.error('- Status:', error.statusCode);
      console.error('- Error code:', error.response.body.errorCode);
      console.error('- Message:', error.response.body.message);
      console.error('- Headers:', JSON.stringify(error.response.headers, null, 2));
    }
    throw error;
  }
}

// Run the import
importData()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  }); 