import type { AxiosRequestConfig, AxiosResponse, RawAxiosRequestHeaders } from 'axios';
import { Database } from './database';

/**
 * Authentication configuration for API clients
 */
export interface AuthConfig {
  type: 'none' | 'apiKey' | 'oauth2' | 'basic';
  apiKey?: string;
  username?: string;
  password?: string;
  oauth2Config?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    scope?: string[];
  };
}

/**
 * Base configuration for API clients
 */
export interface ApiClientConfig {
  baseUrl: string;
  auth: AuthConfig;
  retryConfig?: RetryConfig;
  rateLimit?: RateLimitConfig;
  timeout?: number;
  headers?: RawAxiosRequestHeaders;
}

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
}

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  requestsPerSecond: number;
  burstSize?: number;
}

/**
 * Error types that can be thrown by the API client
 */
export enum ApiErrorType {
  Network = 'NETWORK_ERROR',
  Authentication = 'AUTHENTICATION_ERROR',
  RateLimit = 'RATE_LIMIT_ERROR',
  NotFound = 'NOT_FOUND_ERROR',
  Validation = 'VALIDATION_ERROR',
  Server = 'SERVER_ERROR',
  Unknown = 'UNKNOWN_ERROR'
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    public statusCode?: number,
    public response?: any,
    public retryable: boolean = false
  ) {
    super(`API Error: ${type}`);
    this.name = 'ApiError';
  }
}

/**
 * Interface for request transformers
 */
export interface RequestTransformer {
  transform(config: AxiosRequestConfig): Promise<AxiosRequestConfig>;
}

/**
 * Interface for response transformers
 */
export interface ResponseTransformer {
  transform<T>(response: AxiosResponse<T>): Promise<AxiosResponse<T>>;
}

/**
 * Interface for the normalized news item format
 */
export interface NormalizedNewsItem {
  id: string;
  title: string;
  content: string;
  publishedDate: string;
  sourceUrl: string;
  imageUrl?: string;
  category?: string;
}

/**
 * Interface for news source configuration
 */
export interface NewsSourceConfig extends ApiClientConfig {
  sourceId: string;
  sourceName: string;
  sourceType: 'government' | 'news' | 'social';
  transformers?: {
    request?: RequestTransformer[];
    response?: ResponseTransformer[];
  };
}

export type Product = Database['public']['Tables']['products']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type PriceHistory = Database['public']['Tables']['price_history']['Row'];
export type SavedProduct = Database['public']['Tables']['saved_products']['Row']; 