-- Create tables for country impact analysis

-- Countries table
CREATE TABLE countries (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trade statistics table
CREATE TABLE trade_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(3) REFERENCES countries(code),
    period TIMESTAMPTZ NOT NULL,
    imports DECIMAL(15, 2) NOT NULL,
    exports DECIMAL(15, 2) NOT NULL,
    average_tariff_rate DECIMAL(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Industry statistics table
CREATE TABLE industry_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(3) REFERENCES countries(code),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    trade_volume DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tariff changes table
CREATE TABLE tariff_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(3) REFERENCES countries(code),
    previous_rate DECIMAL(5, 2) NOT NULL,
    new_rate DECIMAL(5, 2) NOT NULL,
    effective_date TIMESTAMPTZ NOT NULL,
    affected_categories TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consumer segments table
CREATE TABLE consumer_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(3) REFERENCES countries(code),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_categories TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Country relationships table
CREATE TABLE country_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_country VARCHAR(3) REFERENCES countries(code),
    target_country VARCHAR(3) REFERENCES countries(code),
    relationship_type VARCHAR(20) CHECK (relationship_type IN ('competitor', 'trading_partner')),
    impact_correlation DECIMAL(4, 3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source_country, target_country)
);

-- Create indexes
CREATE INDEX idx_trade_statistics_country_period ON trade_statistics(country_code, period);
CREATE INDEX idx_industry_statistics_country ON industry_statistics(country_code);
CREATE INDEX idx_tariff_changes_country_date ON tariff_changes(country_code, effective_date);
CREATE INDEX idx_consumer_segments_country ON consumer_segments(country_code);
CREATE INDEX idx_country_relationships_source ON country_relationships(source_country);
CREATE INDEX idx_country_relationships_target ON country_relationships(target_country);

-- Add triggers for updated_at
CREATE TRIGGER update_countries_updated_at
    BEFORE UPDATE ON countries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_statistics_updated_at
    BEFORE UPDATE ON trade_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_industry_statistics_updated_at
    BEFORE UPDATE ON industry_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tariff_changes_updated_at
    BEFORE UPDATE ON tariff_changes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consumer_segments_updated_at
    BEFORE UPDATE ON consumer_segments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_country_relationships_updated_at
    BEFORE UPDATE ON country_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 