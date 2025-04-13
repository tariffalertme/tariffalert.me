-- Create affiliate_clicks table
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id TEXT PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    platform TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    referrer TEXT,
    device_type TEXT NOT NULL,
    converted BOOLEAN NOT NULL DEFAULT FALSE,
    revenue DECIMAL(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product ON affiliate_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user ON affiliate_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_platform ON affiliate_clicks(platform);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_timestamp ON affiliate_clicks(timestamp);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_converted ON affiliate_clicks(converted);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_affiliate_clicks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_affiliate_clicks_updated_at
    BEFORE UPDATE ON affiliate_clicks
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_clicks_updated_at();

-- Create RLS policies
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own clicks
CREATE POLICY "Users can view their own clicks"
    ON affiliate_clicks FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow authenticated users to create clicks
CREATE POLICY "Users can create clicks"
    ON affiliate_clicks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage all clicks
CREATE POLICY "Service role can manage all clicks"
    ON affiliate_clicks
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create view for affiliate statistics
CREATE OR REPLACE VIEW affiliate_statistics AS
SELECT
    platform,
    DATE_TRUNC('day', timestamp) as date,
    COUNT(*) as total_clicks,
    COUNT(CASE WHEN converted THEN 1 END) as total_conversions,
    COALESCE(SUM(revenue), 0) as total_revenue,
    COALESCE(COUNT(CASE WHEN converted THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100, 0) as conversion_rate,
    COALESCE(SUM(revenue) / NULLIF(COUNT(CASE WHEN converted THEN 1 END), 0), 0) as average_order_value
FROM affiliate_clicks
GROUP BY platform, DATE_TRUNC('day', timestamp);

-- Create affiliate_conversions table
CREATE TABLE IF NOT EXISTS affiliate_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    user_id UUID REFERENCES users(id),
    platform VARCHAR(50) NOT NULL,
    revenue DECIMAL(10,2) NOT NULL,
    converted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_product_id ON affiliate_conversions(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_user_id ON affiliate_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_platform ON affiliate_conversions(platform);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_converted_at ON affiliate_conversions(converted_at);

-- Add triggers to update updated_at columns
CREATE TRIGGER update_affiliate_conversions_updated_at
    BEFORE UPDATE ON affiliate_conversions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for aggregated statistics
CREATE OR REPLACE VIEW affiliate_product_stats AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    COUNT(DISTINCT ac.id) as total_clicks,
    COUNT(DISTINCT acv.id) as total_conversions,
    COALESCE(SUM(acv.revenue), 0) as total_revenue,
    MAX(GREATEST(ac.timestamp, acv.converted_at)) as last_activity
FROM products p
LEFT JOIN affiliate_clicks ac ON p.id = ac.product_id
LEFT JOIN affiliate_conversions acv ON p.id = acv.product_id
GROUP BY p.id, p.name; 