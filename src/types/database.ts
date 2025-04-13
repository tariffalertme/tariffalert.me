export type ImpactLevel = 'high' | 'medium' | 'low';
export type PriceDirection = 'increase' | 'decrease';

export interface TariffNews {
  id: string;
  title: string;
  content: string;
  countries: string[];
  categories: string[];
  impact_level: ImpactLevel;
  price_impact: {
    percentage: number;
    direction: PriceDirection;
  } | null;
  source_urls: string[];
  publish_date: string;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  country: string;
  current_price: number | null;
  predicted_price: number | null;
  keywords: string[];
  affiliate_links: {
    amazon?: string;
    walmart?: string;
    target?: string;
  };
  trends: string[];
  impacted_by_tariffs: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  countries: string[];
  trend_keywords: string[];
  active_products: number;
  created_at: string;
  updated_at: string;
}

export interface PriceHistory {
  id: string;
  product_id: string;
  price: number;
  retailer: string;
  recorded_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserProductAlert {
  id: string;
  user_id: string;
  product_id: string;
  price_threshold: number | null;
  created_at: string;
} 