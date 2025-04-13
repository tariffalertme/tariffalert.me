import type { EcommerceProduct } from '../api/BaseEcommerceClient';
import { Logger } from '../../../lib/utils/logger';

export interface NormalizedProduct {
  id: string;
  platformId: string;
  platform: string;
  title: string;
  description: string;
  brand?: string;
  price: {
    current: number;
    currency: string;
    lastUpdated: Date;
  };
  images: {
    primary: string;
    additional?: string[];
  };
  url: string;
  affiliateUrl: string;
  origin: {
    country?: string;
    confidence: 'high' | 'medium' | 'low';
  };
  categories: {
    raw: string[];
    normalized: string[];
    tariffCodes?: string[];
  };
  availability: {
    status: 'in_stock' | 'out_of_stock' | 'limited';
    quantity?: number;
  };
  specifications: Record<string, string>;
  metadata: {
    lastChecked: Date;
    firstSeen: Date;
    platform: string;
    platformId: string;
  };
}

export class ProductNormalizationService {
  private readonly logger: Logger;
  private categoryMappings: Map<string, string[]>;
  private readonly confidenceThresholds = {
    high: 0.8,
    medium: 0.5
  };

  constructor() {
    this.logger = new Logger('ProductNormalizationService');
    this.categoryMappings = new Map();
    this.initializeCategoryMappings();
  }

  /**
   * Normalize a product from any supported e-commerce platform
   */
  public normalizeProduct(product: EcommerceProduct): NormalizedProduct {
    try {
      return {
        id: this.generateGlobalId(product),
        platformId: product.id,
        platform: product.merchant.toLowerCase(),
        title: this.normalizeTitle(product.title),
        description: this.normalizeDescription(product.description),
        brand: product.brand,
        price: {
          current: product.currentPrice,
          currency: product.currency,
          lastUpdated: new Date()
        },
        images: {
          primary: product.imageUrl
        },
        url: product.url,
        affiliateUrl: product.url, // Already affiliate URL from the API client
        origin: this.normalizeOrigin(product),
        categories: this.normalizeCategories(product.categories, product.merchant),
        availability: {
          status: product.availability,
          quantity: this.extractQuantity(product)
        },
        specifications: this.extractSpecifications(product),
        metadata: {
          lastChecked: new Date(),
          firstSeen: new Date(), // This should be updated from database if product exists
          platform: product.merchant.toLowerCase(),
          platformId: product.id
        }
      };
    } catch (error) {
      this.logger.error('Failed to normalize product:', {
        error,
        productId: product.id,
        platform: product.merchant
      });
      throw new Error(`Product normalization failed: ${error.message}`);
    }
  }

  /**
   * Normalize multiple products
   */
  public normalizeProducts(products: EcommerceProduct[]): NormalizedProduct[] {
    return products.map(product => {
      try {
        return this.normalizeProduct(product);
      } catch (error) {
        this.logger.error('Failed to normalize product in batch:', {
          error,
          productId: product.id,
          platform: product.merchant
        });
        return null;
      }
    }).filter((product): product is NormalizedProduct => product !== null);
  }

  /**
   * Generate a global unique ID for a product
   */
  private generateGlobalId(product: EcommerceProduct): string {
    return `${product.merchant.toLowerCase()}_${product.id}`;
  }

  /**
   * Normalize product title
   */
  private normalizeTitle(title: string): string {
    return title
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s-]/g, ''); // Remove special characters except spaces and hyphens
  }

  /**
   * Normalize product description
   */
  private normalizeDescription(description: string): string {
    return description
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/(<([^>]+)>)/gi, ''); // Remove HTML tags
  }

  /**
   * Normalize country of origin information
   */
  private normalizeOrigin(product: EcommerceProduct): NormalizedProduct['origin'] {
    if (!product.countryOfOrigin) {
      return { confidence: 'low' };
    }

    const country = product.countryOfOrigin.trim().toUpperCase();
    const confidence = this.determineOriginConfidence(country);

    return {
      country,
      confidence
    };
  }

  /**
   * Determine confidence in country of origin data
   */
  private determineOriginConfidence(
    country: string
  ): NormalizedProduct['origin']['confidence'] {
    // This is a simplified version. In reality, we would have more sophisticated
    // confidence determination based on multiple factors.
    if (country.length === 2) return 'high'; // ISO country code
    if (country.length === 3) return 'high'; // ISO-3 country code
    if (country.includes('MADE IN')) return 'medium';
    return 'low';
  }

  /**
   * Initialize category mappings from standard categories to tariff codes
   */
  private initializeCategoryMappings(): void {
    // This would typically load from a database or configuration file
    this.categoryMappings.set('electronics', ['85', '84']);
    this.categoryMappings.set('clothing', ['61', '62']);
    this.categoryMappings.set('food', ['16', '17', '18', '19', '20', '21']);
    // Add more mappings as needed
  }

  /**
   * Normalize product categories and map to tariff codes
   */
  private normalizeCategories(
    categories: string[],
    platform: string
  ): NormalizedProduct['categories'] {
    const normalized = categories.map(category => 
      category.toLowerCase().trim()
    );

    const tariffCodes = normalized.flatMap(category => 
      this.categoryMappings.get(category) || []
    );

    return {
      raw: categories,
      normalized,
      tariffCodes: tariffCodes.length > 0 ? tariffCodes : undefined
    };
  }

  /**
   * Extract quantity information from availability
   */
  private extractQuantity(product: EcommerceProduct): number | undefined {
    // This would need to be implemented based on platform-specific data
    // as quantity information varies by platform
    return undefined;
  }

  /**
   * Extract product specifications
   */
  private extractSpecifications(product: EcommerceProduct): Record<string, string> {
    // This would need to be implemented based on platform-specific data
    // as specification format varies by platform
    return {};
  }
} 