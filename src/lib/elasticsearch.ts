import { Client } from '@elastic/elasticsearch';

if (!process.env.ELASTICSEARCH_URL || !process.env.ELASTICSEARCH_API_KEY) {
  throw new Error('Missing required Elasticsearch configuration');
}

const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  },
  tls: {
    rejectUnauthorized: true
  }
});

client.ping()
  .then(() => console.log('Connected to Elasticsearch Cloud'))
  .catch(error => console.error('Elasticsearch connection error:', error));

export default client; 