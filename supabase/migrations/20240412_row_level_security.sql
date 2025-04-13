-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_news_items ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Categories are viewable by everyone"
    ON categories FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Categories are editable by authenticated users"
    ON categories FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Products policies
CREATE POLICY "Products are viewable by everyone"
    ON products FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Products are editable by authenticated users"
    ON products FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- News items policies
CREATE POLICY "News items are viewable by everyone"
    ON news_items FOR SELECT
    TO public
    USING (true);

CREATE POLICY "News items are editable by authenticated users"
    ON news_items FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Price history policies
CREATE POLICY "Price history is viewable by everyone"
    ON price_history FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Price history is editable by authenticated users"
    ON price_history FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Product news items junction table policies
CREATE POLICY "Product news items are viewable by everyone"
    ON product_news_items FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Product news items are editable by authenticated users"
    ON product_news_items FOR ALL
    TO authenticated
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated'); 