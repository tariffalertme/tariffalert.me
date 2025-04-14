export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
      }
      price_history: {
        Row: PriceHistory
        Insert: Omit<PriceHistory, 'id'>
        Update: Partial<Omit<PriceHistory, 'id'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>
      }
      tariff_news: {
        Row: TariffNews
        Insert: Omit<TariffNews, 'id' | 'created_at'>
        Update: Partial<Omit<TariffNews, 'id' | 'created_at'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      user_product_alerts: {
        Row: UserProductAlert
        Insert: Omit<UserProductAlert, 'id' | 'created_at'>
        Update: Partial<Omit<UserProductAlert, 'id' | 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      impact_level: 'high' | 'medium' | 'low'
      price_direction: 'increase' | 'decrease'
    }
  }
}

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

export interface Country {
  code: string;
  name: string;
  region: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradeStatistics {
  id: string;
  country_code: string;
  period: string;
  imports: number;
  exports: number;
  average_tariff_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface IndustryStatistics {
  id: string;
  country_code: string;
  name: string;
  category: string;
  trade_volume: number;
  created_at: string;
  updated_at: string;
}

export interface TariffChange {
  id: string;
  country_code: string;
  previous_rate: number;
  new_rate: number;
  effective_date: string;
  affected_categories: string[];
  created_at: string;
  updated_at: string;
}

export interface ConsumerSegment {
  id: string;
  country_code: string;
  name: string;
  description: string;
  affected_categories: string[];
  created_at: string;
  updated_at: string;
}

export interface CountryRelationship {
  id: string;
  source_country: string;
  target_country: string;
  relationship_type: 'competitor' | 'trading_partner';
  impact_correlation: number;
  created_at: string;
  updated_at: string;
} 