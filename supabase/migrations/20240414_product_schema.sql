-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE product_availability AS ENUM ('in_stock', 'out_of_stock', 'limited');
CREATE TYPE origin_confidence AS ENUM ('high', 'medium', 'low');

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  current_price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  price_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  primary_image_url TEXT NOT NULL,
  additional_image_urls TEXT[],
  product_url TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  origin_country TEXT,
  origin_confidence origin_confidence NOT NULL DEFAULT 'low',
  availability product_availability NOT NULL DEFAULT 'out_of_stock',
  availability_quantity INTEGER,
  specifications JSONB DEFAULT '{}'::jsonb,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform, platform_id)
);

-- Create categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  raw_category TEXT NOT NULL,
  normalized_category TEXT NOT NULL,
  tariff_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, normalized_category)
);

-- Create price history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_products_platform_id ON products(platform, platform_id);
CREATE INDEX idx_products_title_trgm ON products USING gin (title gin_trgm_ops);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_current_price ON products(current_price);
CREATE INDEX idx_products_availability ON products(availability);
CREATE INDEX idx_products_origin_country ON products(origin_country);
CREATE INDEX idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX idx_product_categories_normalized ON product_categories(normalized_category);
CREATE INDEX idx_product_categories_tariff ON product_categories(tariff_code);
CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to record price history
CREATE OR REPLACE FUNCTION record_price_history()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.current_price != NEW.current_price) THEN
    INSERT INTO price_history (product_id, price, currency)
    VALUES (NEW.id, NEW.current_price, NEW.currency);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for price history
CREATE TRIGGER record_product_price_history
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION record_price_history();

-- Create RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to product categories"
  ON product_categories FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to price history"
  ON price_history FOR SELECT
  USING (true);

-- Create policies for authenticated write access
CREATE POLICY "Allow authenticated write access to products"
  ON products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to product categories"
  ON product_categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to price history"
  ON price_history FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated'); 