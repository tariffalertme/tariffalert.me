const sanityClient = require('@sanity/client');

const client = sanityClient({
  projectId: process.env.SANITY_STUDIO_API_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_API_DATASET || 'production',
  apiVersion: '2024-04-19', // Use today's date or your preferred version
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false, // We want fresh data
});

// Test connection before proceeding
async function testConnection() {
  try {
    // Try a simple query to test connection
    const result = await client.fetch('*[_type == "country"][0]');
    console.log('Connection test successful');
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    if (error.statusCode === 401) {
      console.log('Token details:');
      console.log('- Length:', process.env.SANITY_AUTH_TOKEN?.length);
      console.log('- Starts with:', process.env.SANITY_AUTH_TOKEN?.substring(0, 2));
      console.log('- Last character code:', process.env.SANITY_AUTH_TOKEN?.charCodeAt(process.env.SANITY_AUTH_TOKEN.length - 1));
    }
    return false;
  }
}

// Main import function
async function importData() {
  // Test connection first
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('Failed to connect to Sanity. Please check your token and configuration.');
    process.exit(1);
  }

  try {
    // Your existing import code here
    // ... rest of the import logic ...
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importData(); 