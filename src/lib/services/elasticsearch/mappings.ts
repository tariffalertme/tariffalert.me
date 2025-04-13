export const productIndexMappings = {
  properties: {
    id: { type: 'keyword' },
    name: {
      type: 'text',
      analyzer: 'standard',
      fields: {
        keyword: { type: 'keyword' },
        completion: { type: 'completion' }
      }
    },
    description: { type: 'text', analyzer: 'standard' },
    category: {
      type: 'keyword',
      fields: {
        text: { type: 'text', analyzer: 'standard' }
      }
    },
    price: { type: 'float' },
    currency: { type: 'keyword' },
    country: { type: 'keyword' },
    tariffCode: { type: 'keyword' },
    tariffRate: { type: 'float' },
    attributes: {
      type: 'nested',
      properties: {
        name: { type: 'keyword' },
        value: { type: 'keyword' }
      }
    },
    trends: {
      type: 'keyword',
      fields: {
        text: { type: 'text', analyzer: 'standard' }
      }
    },
    updatedAt: { type: 'date' },
    createdAt: { type: 'date' }
  }
};

export const newsIndexMappings = {
  properties: {
    id: { type: 'keyword' },
    title: {
      type: 'text',
      analyzer: 'standard',
      fields: {
        keyword: { type: 'keyword' }
      }
    },
    content: { type: 'text', analyzer: 'standard' },
    source: { type: 'keyword' },
    category: { type: 'keyword' },
    tags: {
      type: 'keyword',
      fields: {
        text: { type: 'text', analyzer: 'standard' }
      }
    },
    relatedProducts: {
      type: 'nested',
      properties: {
        id: { type: 'keyword' },
        name: { type: 'keyword' }
      }
    },
    publishedAt: { type: 'date' },
    createdAt: { type: 'date' }
  }
}; 