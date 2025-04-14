interface Config {
  supabase: {
    url: string;
    anonKey: string;
    serviceKey: string;
  };
  environment: {
    isProduction: boolean;
    isDevelopment: boolean;
    isTest: boolean;
  };
  api: {
    baseUrl: string;
  };
  elasticsearch: {
    url: string;
    apiKey: string;
    index: string;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    ttl: number;
    tls: boolean;
  };
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

const config: Config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  environment: {
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
  },
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || '',
    apiKey: process.env.ELASTICSEARCH_API_KEY || '',
    index: process.env.ELASTICSEARCH_INDEX || 'products',
  },
  redis: {
    host: process.env.REDIS_HOST || '',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
    tls: process.env.REDIS_TLS_ENABLED === 'true',
  },
};

export { config };
export type { Config }; 