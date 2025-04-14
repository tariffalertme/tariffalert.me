import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
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
  apiKey: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  rateLimit?: RateLimitConfig;
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
  transform(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig>;
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
  source: string;
  url: string;
  publishedAt: Date;
  relevanceScore: number;
  categories: string[];
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

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  source: string;
  sourceId: string;
  url: string;
  imageUrl?: string;
  category?: string;
  tariffCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  tariffCode?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  emailNotifications: boolean;
  priceAlertThreshold: number;
  currency: string;
}

export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  currency: string;
  timestamp: Date;
}

export interface SavedProduct {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
  alertEnabled: boolean;
  priceThreshold?: number;
} 