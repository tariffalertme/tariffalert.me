import Redis from 'ioredis';
import type { 
  Product, 
  Category, 
  UserProfile, 
  UserPreferences, 
  PriceHistory,
  SavedProduct,
  NormalizedNewsItem 
} from '@/types/api';
import { Logger } from '@/lib/utils/logger';

type CacheableTypes = {
  product: Product;
  category: Category;
  userProfile: UserProfile;
  userPreferences: UserPreferences;
  priceHistory: PriceHistory[];
  savedProducts: SavedProduct[];
  newsItems: NormalizedNewsItem[];
};

type CacheStats = {
  hits: number;
  misses: number;
  errors: number;
  lastError?: Error;
};

export class CacheService {
  private redis: Redis;
  private readonly logger: Logger;
  private readonly defaultTTL: number = 3600; // 1 hour in seconds
  private readonly ttlMap: Record<keyof CacheableTypes, number> = {
    product: 3600, // 1 hour
    category: 86400, // 24 hours
    userProfile: 1800, // 30 minutes
    userPreferences: 1800, // 30 minutes
    priceHistory: 3600, // 1 hour
    savedProducts: 1800, // 30 minutes
    newsItems: 3600 // 1 hour
  };
  private stats: Record<keyof CacheableTypes, CacheStats> = {
    product: { hits: 0, misses: 0, errors: 0 },
    category: { hits: 0, misses: 0, errors: 0 },
    userProfile: { hits: 0, misses: 0, errors: 0 },
    userPreferences: { hits: 0, misses: 0, errors: 0 },
    priceHistory: { hits: 0, misses: 0, errors: 0 },
    savedProducts: { hits: 0, misses: 0, errors: 0 },
    newsItems: { hits: 0, misses: 0, errors: 0 }
  };

  constructor(config: {
    host: string;
    port: number;
    password?: string;
    defaultTTL?: number;
  }) {
    this.redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      lazyConnect: true
    });

    this.logger = new Logger('CacheService');

    if (config.defaultTTL) {
      this.defaultTTL = config.defaultTTL;
    }

    this.setupRedisEventHandlers();
  }

  private setupRedisEventHandlers(): void {
    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', { error });
    });

    this.redis.on('connect', () => {
      this.logger.info('Redis connected successfully');
    });

    this.redis.on('ready', () => {
      this.logger.info('Redis ready to accept commands');
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      this.logger.info('Redis attempting to reconnect');
    });
  }

  /**
   * Generic method to set a cache item with compression for large objects
   */
  private async setCacheItem<T extends keyof CacheableTypes>(
    type: T,
    key: string,
    data: CacheableTypes[T],
    ttl?: number
  ): Promise<void> {
    try {
      const cacheKey = `${type}:${key}`;
      const serializedData = JSON.stringify(data);
      const shouldCompress = serializedData.length > 1024; // Compress if larger than 1KB
      
      if (shouldCompress) {
        const compressedData = await this.compress(serializedData);
        await this.redis.setex(
          `${cacheKey}:compressed`,
          ttl || this.ttlMap[type] || this.defaultTTL,
          compressedData
        );
      } else {
        await this.redis.setex(
          cacheKey,
          ttl || this.ttlMap[type] || this.defaultTTL,
          serializedData
        );
      }
    } catch (error) {
      this.stats[type].errors++;
      this.stats[type].lastError = error as Error;
      this.logger.error(`Failed to cache ${type}`, { error, key });
    }
  }

  /**
   * Generic method to get a cache item with decompression support
   */
  private async getCacheItem<T extends keyof CacheableTypes>(
    type: T,
    key: string
  ): Promise<CacheableTypes[T] | null> {
    try {
      const cacheKey = `${type}:${key}`;
      let cached = await this.redis.get(cacheKey);
      
      if (!cached) {
        // Try compressed key
        const compressedData = await this.redis.get(`${cacheKey}:compressed`);
        if (compressedData) {
          cached = await this.decompress(compressedData);
        }
      }

      if (!cached) {
        this.stats[type].misses++;
        return null;
      }

      this.stats[type].hits++;
      return JSON.parse(cached) as CacheableTypes[T];
    } catch (error) {
      this.stats[type].errors++;
      this.stats[type].lastError = error as Error;
      this.logger.error(`Failed to get cached ${type}`, { error, key });
      return null;
    }
  }

  /**
   * Compress data using gzip
   */
  private async compress(data: string): Promise<string> {
    const { gzip } = await import('zlib');
    const { promisify } = await import('util');
    const gzipAsync = promisify(gzip);
    const buffer = await gzipAsync(data);
    return buffer.toString('base64');
  }

  /**
   * Decompress data using gunzip
   */
  private async decompress(data: string): Promise<string> {
    const { gunzip } = await import('zlib');
    const { promisify } = await import('util');
    const gunzipAsync = promisify(gunzip);
    const buffer = await gunzipAsync(Buffer.from(data, 'base64'));
    return buffer.toString();
  }

  /**
   * Get cache statistics
   */
  public getStats(): Record<keyof CacheableTypes, CacheStats> {
    return this.stats;
  }

  /**
   * Reset cache statistics
   */
  public resetStats(): void {
    for (const type in this.stats) {
      this.stats[type as keyof CacheableTypes] = { hits: 0, misses: 0, errors: 0 };
    }
  }

  /**
   * Check Redis connection health
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis health check failed', { error });
      return false;
    }
  }

  /**
   * Cache a product
   */
  public async cacheProduct(productId: string, product: Product, ttl?: number): Promise<void> {
    return this.setCacheItem('product', productId, product, ttl);
  }

  /**
   * Get a cached product
   */
  public async getCachedProduct(productId: string): Promise<Product | null> {
    return this.getCacheItem('product', productId);
  }

  /**
   * Cache a category
   */
  public async cacheCategory(categoryId: string, category: Category, ttl?: number): Promise<void> {
    return this.setCacheItem('category', categoryId, category, ttl);
  }

  /**
   * Get a cached category
   */
  public async getCachedCategory(categoryId: string): Promise<Category | null> {
    return this.getCacheItem('category', categoryId);
  }

  /**
   * Cache a user profile
   */
  public async cacheUserProfile(userId: string, profile: UserProfile, ttl?: number): Promise<void> {
    return this.setCacheItem('userProfile', userId, profile, ttl);
  }

  /**
   * Get a cached user profile
   */
  public async getCachedUserProfile(userId: string): Promise<UserProfile | null> {
    return this.getCacheItem('userProfile', userId);
  }

  /**
   * Cache user preferences
   */
  public async cacheUserPreferences(userId: string, preferences: UserPreferences, ttl?: number): Promise<void> {
    return this.setCacheItem('userPreferences', userId, preferences, ttl);
  }

  /**
   * Get cached user preferences
   */
  public async getCachedUserPreferences(userId: string): Promise<UserPreferences | null> {
    return this.getCacheItem('userPreferences', userId);
  }

  /**
   * Cache price history
   */
  public async cachePriceHistory(productId: string, history: PriceHistory[], ttl?: number): Promise<void> {
    return this.setCacheItem('priceHistory', productId, history, ttl);
  }

  /**
   * Get cached price history
   */
  public async getCachedPriceHistory(productId: string): Promise<PriceHistory[] | null> {
    return this.getCacheItem('priceHistory', productId);
  }

  /**
   * Cache saved products
   */
  public async cacheSavedProducts(userId: string, products: SavedProduct[], ttl?: number): Promise<void> {
    return this.setCacheItem('savedProducts', userId, products, ttl);
  }

  /**
   * Get cached saved products
   */
  public async getCachedSavedProducts(userId: string): Promise<SavedProduct[] | null> {
    return this.getCacheItem('savedProducts', userId);
  }

  /**
   * Cache news items
   */
  public async cacheNewsItems(key: string, items: NormalizedNewsItem[], ttl?: number): Promise<void> {
    return this.setCacheItem('newsItems', key, items, ttl);
  }

  /**
   * Get cached news items
   */
  public async getCachedNewsItems(key: string): Promise<NormalizedNewsItem[] | null> {
    return this.getCacheItem('newsItems', key);
  }

  /**
   * Invalidate a specific cache item
   */
  public async invalidateCache(type: keyof CacheableTypes, key: string): Promise<void> {
    try {
      await this.redis.del(`${type}:${key}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate ${type} cache`, { error, key });
    }
  }

  /**
   * Clear all caches of a specific type
   */
  public async clearTypeCache(type: keyof CacheableTypes): Promise<void> {
    try {
      const keys = await this.redis.keys(`${type}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Failed to clear ${type} caches`, { error });
    }
  }

  /**
   * Batch get multiple items of the same type
   */
  public async batchGet<T extends keyof CacheableTypes>(
    type: T,
    keys: string[]
  ): Promise<(CacheableTypes[T] | null)[]> {
    try {
      const pipeline = this.redis.pipeline();
      const cacheKeys = keys.map(key => `${type}:${key}`);
      const compressedKeys = keys.map(key => `${type}:${key}:compressed`);
      
      // Get both normal and compressed keys
      cacheKeys.forEach(key => pipeline.get(key));
      compressedKeys.forEach(key => pipeline.get(key));
      
      const results = await pipeline.exec();
      if (!results) return keys.map(() => null);

      const values = await Promise.all(
        results.slice(0, keys.length).map(async (result, index) => {
          if (!result || !result[1]) {
            // Check compressed version
            const compressedResult = results[index + keys.length];
            if (compressedResult && compressedResult[1]) {
              const decompressed = await this.decompress(compressedResult[1] as string);
              this.stats[type].hits++;
              return JSON.parse(decompressed);
            }
            this.stats[type].misses++;
            return null;
          }
          this.stats[type].hits++;
          return JSON.parse(result[1] as string);
        })
      );

      return values as (CacheableTypes[T] | null)[];
    } catch (error) {
      this.stats[type].errors++;
      this.stats[type].lastError = error as Error;
      this.logger.error(`Failed to batch get ${type}`, { error, keys });
      return keys.map(() => null);
    }
  }

  /**
   * Batch set multiple items of the same type
   */
  public async batchSet<T extends keyof CacheableTypes>(
    type: T,
    items: { key: string; data: CacheableTypes[T] }[],
    ttl?: number
  ): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const item of items) {
        const serializedData = JSON.stringify(item.data);
        const shouldCompress = serializedData.length > 1024;
        
        if (shouldCompress) {
          const compressedData = await this.compress(serializedData);
          pipeline.setex(
            `${type}:${item.key}:compressed`,
            ttl || this.ttlMap[type] || this.defaultTTL,
            compressedData
          );
        } else {
          pipeline.setex(
            `${type}:${item.key}`,
            ttl || this.ttlMap[type] || this.defaultTTL,
            serializedData
          );
        }
      }
      
      await pipeline.exec();
    } catch (error) {
      this.stats[type].errors++;
      this.stats[type].lastError = error as Error;
      this.logger.error(`Failed to batch set ${type}`, { error, items });
    }
  }

  /**
   * Close Redis connection
   */
  public async disconnect(): Promise<void> {
    await this.redis.quit();
  }
} 