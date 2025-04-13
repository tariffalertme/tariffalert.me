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
      tariff_news: {
        Row: {
          id: string
          title: string
          content: string
          countries: string[]
          categories: string[]
          impact_level: 'high' | 'medium' | 'low'
          price_impact: Json | null
          source_urls: string[]
          publish_date: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          countries: string[]
          categories: string[]
          impact_level: 'high' | 'medium' | 'low'
          price_impact?: Json | null
          source_urls?: string[]
          publish_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          countries?: string[]
          categories?: string[]
          impact_level?: 'high' | 'medium' | 'low'
          price_impact?: Json | null
          source_urls?: string[]
          publish_date?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          country: string
          current_price: number | null
          predicted_price: number | null
          keywords: string[]
          affiliate_links: Json
          trends: string[]
          impacted_by_tariffs: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          country: string
          current_price?: number | null
          predicted_price?: number | null
          keywords?: string[]
          affiliate_links?: Json
          trends?: string[]
          impacted_by_tariffs?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          country?: string
          current_price?: number | null
          predicted_price?: number | null
          keywords?: string[]
          affiliate_links?: Json
          trends?: string[]
          impacted_by_tariffs?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string
          countries: string[]
          trend_keywords: string[]
          active_products: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          countries?: string[]
          trend_keywords?: string[]
          active_products?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          countries?: string[]
          trend_keywords?: string[]
          active_products?: number
          created_at?: string
          updated_at?: string
        }
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