import axios from 'redaxios';
import type { Options, Response, RequestHeaders } from 'redaxios';
import { RateLimiter } from 'limiter';
import {
  ApiClientConfig,
  ApiError,
  ApiErrorType,
  RequestTransformer,
  ResponseTransformer
} from '@/types/api';

export class BaseApiClient {
  protected readonly axios: typeof axios;
  protected readonly config: ApiClientConfig;
  protected readonly rateLimiter?: RateLimiter;
  protected readonly requestTransformers: RequestTransformer[] = [];
  protected readonly responseTransformers: ResponseTransformer[] = [];

  constructor(config: ApiClientConfig) {
    this.config = config;
    
    // Create axios instance with base configuration
    const headers: RequestHeaders = {};
    if (config.headers) {
      Object.assign(headers, config.headers);
    }
    
    this.axios = axios.create({
      baseURL: config.baseUrl,
      headers
    });

    // Set up rate limiting if configured
    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter({
        tokensPerInterval: config.rateLimit.requestsPerSecond,
        interval: 'second',
        fireImmediately: true
      });
    }
  }

  /**
   * Add a request transformer to the pipeline
   */
  public addRequestTransformer(transformer: RequestTransformer): void {
    this.requestTransformers.push(transformer);
  }

  /**
   * Add a response transformer to the pipeline
   */
  public addResponseTransformer(transformer: ResponseTransformer): void {
    this.responseTransformers.push(transformer);
  }

  /**
   * Make an HTTP request with retry logic and transformations
   */
  protected async request<T>(config: Options): Promise<T> {
    let retryCount = 0;
    const maxRetries = this.config.retryConfig?.maxRetries || 0;

    while (true) {
      try {
        // Apply rate limiting if configured
        if (this.rateLimiter) {
          await this.rateLimiter.removeTokens(1);
        }

        // Apply request transformers
        let transformedConfig: Options = { ...config };
        for (const transformer of this.requestTransformers) {
          transformedConfig = await transformer.transform(transformedConfig);
        }

        // Add authentication if configured
        if (this.config.auth) {
          const headers = transformedConfig.headers || {};
          
          switch (this.config.auth.type) {
            case 'apiKey':
              Object.assign(headers, {
                authorization: `Bearer ${this.config.auth.apiKey}`
              });
              break;
            case 'basic': {
              const credentials = btoa(`${this.config.auth.username}:${this.config.auth.password}`);
              Object.assign(headers, {
                authorization: `Basic ${credentials}`
              });
              break;
            }
            case 'oauth2':
              // OAuth2 token management would be implemented here
              break;
          }
          
          transformedConfig.headers = headers;
        }

        // Make the request
        const response = await this.axios(transformedConfig);

        // Apply response transformers
        let transformedResponse = response;
        for (const transformer of this.responseTransformers) {
          transformedResponse = await transformer.transform(transformedResponse);
        }

        return transformedResponse.data as T;
      } catch (error) {
        const apiError = this.normalizeError(error);

        // Check if we should retry
        if (
          retryCount < maxRetries &&
          this.shouldRetry(apiError, retryCount)
        ) {
          retryCount++;
          await this.delay(this.getRetryDelay(retryCount));
          continue;
        }

        throw apiError;
      }
    }
  }

  /**
   * Normalize different error types into ApiError
   */
  private normalizeError(error: unknown): ApiError {
    if (error && typeof error === 'object' && 'response' in error) {
      const status = (error as any).response?.status;
      const data = (error as any).response?.data;

      switch (status) {
        case 401:
        case 403:
          return new ApiError(ApiErrorType.Authentication, status, data, true);
        case 404:
          return new ApiError(ApiErrorType.NotFound, status, data, false);
        case 429:
          return new ApiError(ApiErrorType.RateLimit, status, data, true);
        case 422:
          return new ApiError(ApiErrorType.Validation, status, data, false);
        default:
          if (status >= 500) {
            return new ApiError(ApiErrorType.Server, status, data, true);
          }
      }
    }

    if (error instanceof Error) {
      return new ApiError(ApiErrorType.Network, undefined, error.message, true);
    }

    return new ApiError(ApiErrorType.Unknown, undefined, String(error), false);
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: ApiError, retryCount: number): boolean {
    if (!error.retryable) return false;

    const { retryConfig } = this.config;
    if (!retryConfig) return false;

    if (error.statusCode && retryConfig.retryableStatusCodes) {
      return retryConfig.retryableStatusCodes.includes(error.statusCode);
    }

    return true;
  }

  /**
   * Calculate delay before retry using exponential backoff
   */
  private getRetryDelay(retryCount: number): number {
    const { retryConfig } = this.config;
    if (!retryConfig) return 1000;

    const delay = Math.min(
      retryConfig.initialDelayMs * Math.pow(retryConfig.backoffFactor || 2, retryCount - 1),
      retryConfig.maxDelayMs || 30000
    );

    return delay;
  }

  /**
   * Utility function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 