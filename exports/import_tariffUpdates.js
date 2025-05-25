const fs = require('fs');
const readline = require('readline');
const { createClient } = require('@sanity/client');

// Load env vars from .env.local in the project root
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-04-19',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function importTariffUpdates(ndjsonPath) {
  const fileStream = fs.createReadStream(ndjsonPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  let count = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const doc = JSON.parse(line);
      await client.createOrReplace(doc);
      count++;
      console.log(`Upserted: ${doc._id}`);
    } catch (err) {
      console.error('Error processing line:', line, err);
    }
  }
  console.log(`Imported ${count} tariffUpdate documents.`);
}

importTariffUpdates('exports/tariffUpdates_consolidated.ndjson'); 