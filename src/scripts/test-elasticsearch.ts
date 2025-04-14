import { Client } from '@elastic/elasticsearch';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Check for required environment variables
const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL;
const ELASTICSEARCH_API_KEY = process.env.ELASTICSEARCH_API_KEY;

if (!ELASTICSEARCH_URL || !ELASTICSEARCH_API_KEY) {
  console.error('Missing required environment variables: ELASTICSEARCH_URL or ELASTICSEARCH_API_KEY');
  process.exit(1);
}

// Initialize Elasticsearch client
const client = new Client({
  node: ELASTICSEARCH_URL,
  auth: {
    apiKey: ELASTICSEARCH_API_KEY
  }
});

interface ElasticsearchError {
  meta?: {
    body?: {
      error?: {
        type?: string;
        reason?: string;
      };
    };
  };
  message?: string;
}

async function testElasticsearchConnection() {
  try {
    // Test index name
    const indexName = 'test-products';

    // Test 1: Create index
    console.log('Test 1: Creating index...');
    const indexExists = await client.indices.exists({ index: indexName });
    
    if (!indexExists) {
      await client.indices.create({
        index: indexName,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'text' },
            description: { type: 'text' },
            price: { type: 'float' },
            timestamp: { type: 'date' }
          }
        }
      });
      console.log('✅ Successfully created index');
    } else {
      console.log('✅ Index already exists');
    }

    // Test document
    const testDoc = {
      id: 'test-doc-001',
      name: 'Test Product',
      description: 'This is a test product',
      price: 99.99,
      timestamp: new Date().toISOString()
    };

    // Test 2: Index a document
    console.log('\nTest 2: Indexing document...');
    await client.index({
      index: indexName,
      id: testDoc.id,
      document: testDoc
    });
    console.log('✅ Successfully indexed document');

    // Test 3: Update the document
    console.log('\nTest 3: Updating document...');
    await client.update({
      index: indexName,
      id: testDoc.id,
      doc: {
        price: 89.99,
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Successfully updated document');

    // Test 4: Search for the document
    console.log('\nTest 4: Searching for document...');
    const searchResult = await client.search({
      index: indexName,
      query: {
        match: {
          name: 'Test Product'
        }
      }
    });
    console.log('✅ Successfully searched for document');
    console.log('Found:', searchResult.hits.total);

    // Test 5: Delete the document
    console.log('\nTest 5: Deleting document...');
    await client.delete({
      index: indexName,
      id: testDoc.id
    });
    console.log('✅ Successfully deleted document');

    // Test 6: Delete the test index
    console.log('\nTest 6: Cleaning up - deleting test index...');
    await client.indices.delete({ index: indexName });
    console.log('✅ Successfully deleted test index');

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error during Elasticsearch operations:');
    const esError = error as ElasticsearchError;
    
    if (esError.meta?.body?.error) {
      console.error('Error type:', esError.meta.body.error.type);
      console.error('Error reason:', esError.meta.body.error.reason);
      console.error('Detailed error:', JSON.stringify(esError.meta.body.error, null, 2));
    } else {
      console.error('Error message:', esError.message || 'Unknown error');
    }
    process.exit(1);
  }
}

// Run the test
testElasticsearchConnection(); 