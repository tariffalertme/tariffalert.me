export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>;
      };
      news_items: {
        Row: NewsItem;
        Insert: Omit<NewsItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NewsItem, 'id' | 'created_at' | 'updated_at'>>;
      };
      price_history: {
        Row: PriceHistory;
        Insert: Omit<PriceHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<PriceHistory, 'id' | 'created_at'>>;
      };
      affiliate_clicks: {
        Row: {
          id: string;
          product_id: string;
          user_id?: string;
          platform: string;
          timestamp: string;
          referrer?: string;
          device_type: string;
          converted: boolean;
          revenue?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['affiliate_clicks']['Row'],
          'created_at' | 'updated_at'
        >;
        Update: Partial<
          Omit<
            Database['public']['Tables']['affiliate_clicks']['Row'],
            'id' | 'created_at' | 'updated_at'
          >
        >;
      };
      user_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          email_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['user_profiles']['Row'],
          'created_at' | 'updated_at'
        >;
        Update: Partial<
          Omit<
            Database['public']['Tables']['user_profiles']['Row'],
            'id' | 'created_at' | 'updated_at'
          >
        >;
      };
      user_preferences: {
        Row: {
          user_id: string;
          email_notifications: boolean;
          price_alert_threshold: number;
          preferred_currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['user_preferences']['Row'],
          'created_at' | 'updated_at'
        >;
        Update: Partial<
          Omit<
            Database['public']['Tables']['user_preferences']['Row'],
            'user_id' | 'created_at' | 'updated_at'
          >
        >;
      };
      saved_products: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['saved_products']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<
          Omit<
            Database['public']['Tables']['saved_products']['Row'],
            'id' | 'created_at'
          >
        >;
      };
      price_alerts: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          target_price: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['price_alerts']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<
          Omit<
            Database['public']['Tables']['price_alerts']['Row'],
            'id' | 'created_at' | 'updated_at'
          >
        >;
      };
    };
    Views: {
      affiliate_statistics: {
        Row: {
          platform: string;
          date: string;
          total_clicks: number;
          total_conversions: number;
          total_revenue: number;
          conversion_rate: number;
          average_order_value: number;
        };
      };
    };
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  current_price: number;
  category_id: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  published_date: string;
  source_url: string;
  image_url?: string;
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

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  email_notifications: boolean;
  price_alert_threshold: number;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
}

export interface SavedProduct {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  product_id: string;
  target_price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
} 