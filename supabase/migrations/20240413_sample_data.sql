-- Sample data for development and testing

-- Categories
INSERT INTO categories (id, name, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Electronics', 'Electronic devices and accessories'),
    ('22222222-2222-2222-2222-222222222222', 'Clothing', 'Apparel and fashion items'),
    ('33333333-3333-3333-3333-333333333333', 'Home & Garden', 'Home improvement and garden supplies');

-- Products
INSERT INTO products (id, name, description, current_price, category_id, image_url) VALUES
    ('44444444-4444-4444-4444-444444444444', 'Smartphone X', 'Latest smartphone model', 999.99, '11111111-1111-1111-1111-111111111111', 'https://example.com/smartphone.jpg'),
    ('55555555-5555-5555-5555-555555555555', 'Designer Jeans', 'Premium denim jeans', 79.99, '22222222-2222-2222-2222-222222222222', 'https://example.com/jeans.jpg'),
    ('66666666-6666-6666-6666-666666666666', 'Garden Tools Set', 'Complete gardening toolkit', 149.99, '33333333-3333-3333-3333-333333333333', 'https://example.com/tools.jpg');

-- News Items
INSERT INTO news_items (id, title, content, published_date, source_url, image_url) VALUES
    ('77777777-7777-7777-7777-777777777777', 'New Tariffs on Electronics', 'The government announces new tariffs on imported electronics...', CURRENT_TIMESTAMP - INTERVAL '7 days', 'https://example.com/news1', 'https://example.com/news1.jpg'),
    ('88888888-8888-8888-8888-888888888888', 'Clothing Import Regulations Update', 'Updates to clothing import regulations affecting retail prices...', CURRENT_TIMESTAMP - INTERVAL '3 days', 'https://example.com/news2', 'https://example.com/news2.jpg');

-- Price History
INSERT INTO price_history (product_id, price, recorded_at) VALUES
    ('44444444-4444-4444-4444-444444444444', 1099.99, CURRENT_TIMESTAMP - INTERVAL '30 days'),
    ('44444444-4444-4444-4444-444444444444', 1049.99, CURRENT_TIMESTAMP - INTERVAL '20 days'),
    ('44444444-4444-4444-4444-444444444444', 999.99, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('55555555-5555-5555-5555-555555555555', 89.99, CURRENT_TIMESTAMP - INTERVAL '15 days'),
    ('55555555-5555-5555-5555-555555555555', 79.99, CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Users (passwords would be handled by Supabase Auth in production)
INSERT INTO users (id, email, display_name) VALUES
    ('99999999-9999-9999-9999-999999999999', 'test.user@example.com', 'Test User'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'jane.doe@example.com', 'Jane Doe');

-- User Product Alerts
INSERT INTO user_product_alerts (user_id, product_id, price_threshold) VALUES
    ('99999999-9999-9999-9999-999999999999', '44444444-4444-4444-4444-444444444444', 950.00),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 70.00);

-- Product News Items (Junction)
INSERT INTO product_news_items (product_id, news_item_id) VALUES
    ('44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777'),
    ('55555555-5555-5555-5555-555555555555', '88888888-8888-8888-8888-888888888888'); 