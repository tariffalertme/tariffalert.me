import { AmazonApiClient, AmazonProduct } from '../api/AmazonApiClient';
import { WalmartApiClient, WalmartProduct } from '../api/WalmartApiClient';
import { Logger } from '../../src/lib/utils/logger';

export interface NormalizedProduct {
  id: string;
  source: 'amazon' | 'walmart';
  name: string;
  description: string;
  brand?: string;
  price: {
    amount: number;
    currency: string;
  };
  images: {
    thumbnail: string;
    main: string;
  };
  url: string;
  categories: string[];
  lastUpdated: Date;
}

export class ProductNormalizationService {
  private readonly logger: Logger;

  constructor(
    private readonly amazonClient: AmazonApiClient,
    private readonly walmartClient: WalmartApiClient,
    logger?: Logger
  ) {
    this.logger = logger || new Logger('ProductNormalizationService');
  }

  private normalizeAmazonProduct(product: AmazonProduct): NormalizedProduct {
    return {
      id: `amazon-${product.ASIN}`,
      source: 'amazon',
      name: product.title,
      description: '',
      brand: product.brand,
      price: product.price || {
        amount: 0,
        currency: 'USD'
      },
      images: {
        thumbnail: '',
        main: ''
      },
      url: product.DetailPageURL,
      categories: [product.productGroup || 'uncategorized'],
      lastUpdated: new Date()
    };
  }

  private normalizeWalmartProduct(product: WalmartProduct): NormalizedProduct {
    return {
      id: `walmart-${product.itemId}`,
      source: 'walmart',
      name: product.name,
      description: '',
      brand: product.brandName,
      price: {
        amount: product.salePrice,
        currency: 'USD'
      },
      images: {
        thumbnail: product.thumbnailImage || '',
        main: product.largeImage || product.mediumImage || product.thumbnailImage || ''
      },
      url: product.productUrl,
      categories: [product.categoryPath],
      lastUpdated: new Date()
    };
  }

  async searchProducts(query: string, limit: number = 20): Promise<NormalizedProduct[]> {
    try {
      const [amazonProducts, walmartProducts] = await Promise.all([
        this.amazonClient.searchProducts({ keywords: query, limit }),
        this.walmartClient.searchProducts({ query, numItems: limit })
      ]);

      const normalizedProducts = [
        ...amazonProducts.map(p => this.normalizeAmazonProduct(p)),
        ...walmartProducts.map(p => this.normalizeWalmartProduct(p))
      ];

      return normalizedProducts.slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to search products', { error: String(error), query });
      return [];
    }
  }

  async getProductsByCategory(category: string, limit: number = 20): Promise<NormalizedProduct[]> {
    try {
      const [amazonProducts, walmartProducts] = await Promise.all([
        this.amazonClient.getProductsByCategory(category, limit),
        this.walmartClient.searchProducts({ query: category, numItems: limit })
      ]);

      const normalizedProducts = [
        ...amazonProducts.map(p => this.normalizeAmazonProduct(p)),
        ...walmartProducts.map(p => this.normalizeWalmartProduct(p))
      ];

      return normalizedProducts.slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to get products by category', { error: String(error), category });
      return [];
    }
  }

  async getProductDetails(source: 'amazon' | 'walmart', productId: string): Promise<NormalizedProduct | null> {
    try {
      if (source === 'amazon') {
        const product = await this.amazonClient.getProductDetails(productId);
        return product ? this.normalizeAmazonProduct(product) : null;
      } else {
        const product = await this.walmartClient.getProductById(productId);
        return product ? this.normalizeWalmartProduct(product) : null;
      }
    } catch (error) {
      this.logger.error('Failed to get product details', { error: String(error), source, productId });
      return null;
    }
  }

  async getTrendingProducts(limit: number = 20): Promise<NormalizedProduct[]> {
    try {
      const [amazonProducts, walmartProducts] = await Promise.all([
        this.amazonClient.getTrendingProducts(limit),
        this.walmartClient.getTrendingProducts()
      ]);

      const normalizedProducts = [
        ...amazonProducts.map(p => this.normalizeAmazonProduct(p)),
        ...walmartProducts.map(p => this.normalizeWalmartProduct(p))
      ];

      return normalizedProducts.slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to get trending products', { error: String(error) });
      return [];
    }
  }
} 