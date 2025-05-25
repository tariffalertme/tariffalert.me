export interface Tag {
  _id: string;
  name: string;
}

export interface Country {
  _id: string;
  name: string;
  code: string;
  flag?: string;
}

export interface RetailerLink {
  _id: string;
  retailerName: string;
  affiliateUrl: string;
}

export interface Product {
  _id: string;
  name: string;
  image: {
    asset: any;
    hotspot?: boolean;
  };
  retailerLinks: RetailerLink[];
  countryTags: Country[];
  tags: string[];
  dateAdded: string;
  tariffInfo: {
    currentRate: number;
    futureRate?: number;
    effectiveDate?: string;
  };
} 