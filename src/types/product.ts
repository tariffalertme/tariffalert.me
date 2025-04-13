export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  currentPrice: number;
  categories: {
    normalized: string[];
    original: string[];
  };
  origin: {
    country: string;
    region?: string;
  };
  tariffImpact?: {
    level: 'high' | 'medium' | 'low';
    description: string;
    currentRate: number;
    predictedRate?: number;
  };
  platform: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
} 