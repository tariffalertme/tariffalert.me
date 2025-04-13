-- Create tables for product categorization and tariff rates

-- Category keywords for automatic categorization
CREATE TABLE category_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword TEXT NOT NULL,
    category TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Category to tariff code mappings
CREATE TABLE category_tariff_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name TEXT NOT NULL,
    tariff_codes TEXT[] NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tariff rates by country and code
CREATE TABLE tariff_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country TEXT NOT NULL,
    tariff_code TEXT NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    effective_date TIMESTAMPTZ NOT NULL,
    expiry_date TIMESTAMPTZ,
    description TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_category_keywords_keyword ON category_keywords USING gin (keyword gin_trgm_ops);
CREATE INDEX idx_category_keywords_category ON category_keywords(category);
CREATE INDEX idx_category_tariff_mappings_category ON category_tariff_mappings(category_name);
CREATE INDEX idx_tariff_rates_country_code ON tariff_rates(country, tariff_code);
CREATE INDEX idx_tariff_rates_effective_date ON tariff_rates(effective_date);

-- Add triggers for updated_at
CREATE TRIGGER update_category_keywords_updated_at
    BEFORE UPDATE ON category_keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_tariff_mappings_updated_at
    BEFORE UPDATE ON category_tariff_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tariff_rates_updated_at
    BEFORE UPDATE ON tariff_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial category keywords
INSERT INTO category_keywords (keyword, category, confidence) VALUES
    ('smartphone', 'electronics', 0.95),
    ('laptop', 'electronics', 0.95),
    ('tablet', 'electronics', 0.95),
    ('tv', 'electronics', 0.90),
    ('shirt', 'clothing', 0.95),
    ('pants', 'clothing', 0.95),
    ('dress', 'clothing', 0.95),
    ('shoes', 'clothing', 0.90),
    ('rice', 'food', 0.95),
    ('pasta', 'food', 0.95),
    ('vegetables', 'food', 0.95),
    ('fruits', 'food', 0.95);

-- Insert initial category to tariff code mappings
INSERT INTO category_tariff_mappings (category_name, tariff_codes, description) VALUES
    ('electronics', ARRAY['85', '84'], 'Electronic devices and machinery'),
    ('clothing', ARRAY['61', '62'], 'Apparel and clothing accessories'),
    ('food', ARRAY['16', '17', '18', '19', '20', '21'], 'Food products and preparations'),
    ('automotive', ARRAY['87'], 'Vehicles and automotive parts'),
    ('furniture', ARRAY['94'], 'Furniture and furnishings'),
    ('toys', ARRAY['95'], 'Toys, games, and sports equipment'),
    ('cosmetics', ARRAY['33'], 'Cosmetics and beauty products'),
    ('jewelry', ARRAY['71'], 'Jewelry and precious metals'),
    ('textiles', ARRAY['50', '51', '52', '53', '54', '55'], 'Textiles and textile materials'),
    ('metals', ARRAY['72', '73', '74', '75', '76'], 'Base metals and metal products');

-- Insert some sample tariff rates
INSERT INTO tariff_rates (country, tariff_code, rate, effective_date, description) VALUES
    ('CN', '85', 25.00, '2024-01-01', 'Section 301 tariffs on Chinese electronics'),
    ('CN', '84', 25.00, '2024-01-01', 'Section 301 tariffs on Chinese machinery'),
    ('CN', '61', 7.50, '2024-01-01', 'Tariffs on Chinese apparel'),
    ('CN', '62', 7.50, '2024-01-01', 'Tariffs on Chinese clothing accessories'),
    ('VN', '85', 0.00, '2024-01-01', 'No tariffs on Vietnamese electronics'),
    ('VN', '84', 0.00, '2024-01-01', 'No tariffs on Vietnamese machinery'),
    ('IN', '61', 2.50, '2024-01-01', 'Reduced tariffs on Indian apparel'),
    ('IN', '62', 2.50, '2024-01-01', 'Reduced tariffs on Indian clothing'); 