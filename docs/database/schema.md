# Database Schema Documentation

## Overview
This document describes the database schema for the Tariffalert.me application. The schema is designed to support tracking products, prices, tariff-related news, and user interactions.

## Tables

### Categories
Stores product categories for organization and filtering.

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- Primary Key on `id`
- Index on `name` for faster lookups

### Products
Stores product information from various e-commerce platforms.

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    current_price DECIMAL(10,2),
    category_id UUID REFERENCES categories(id),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- Primary Key on `id`
- Foreign Key on `category_id`
- Index on `name` for search performance
- Index on `current_price` for price-based queries

### News Items
Stores tariff-related news articles and updates.

```sql
CREATE TABLE news_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    published_date TIMESTAMPTZ NOT NULL,
    source_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- Primary Key on `id`
- Index on `published_date` for chronological queries
- Index on `title` for search functionality

### Price History
Tracks historical price data for products.

```sql
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    price DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- Primary Key on `id`
- Foreign Key on `product_id`
- Composite index on `(product_id, recorded_at)` for efficient time-series queries

### Users
Stores user account information.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- Primary Key on `id`
- Unique index on `email`

### User Product Alerts
Stores user preferences for product price alerts.

```sql
CREATE TABLE user_product_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    price_threshold DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);
```

**Indexes:**
- Primary Key on `id`
- Foreign Keys on `user_id` and `product_id`
- Unique constraint on `(user_id, product_id)`

### Product News Items
Junction table linking products to relevant news items.

```sql
CREATE TABLE product_news_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    news_item_id UUID REFERENCES news_items(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, news_item_id)
);
```

**Indexes:**
- Primary Key on `id`
- Foreign Keys on `product_id` and `news_item_id`
- Unique constraint on `(product_id, news_item_id)`

## Triggers

### update_updated_at_column
Updates the `updated_at` timestamp whenever a record is modified.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

Applied to tables:
- categories
- products
- news_items
- users
- user_product_alerts

## Row Level Security (RLS) Policies

### Public Access
The following tables allow public read access:
- categories
- products
- news_items
- product_news_items

### Authenticated User Access
Users can only access their own data in:
- users (own profile only)
- user_product_alerts (own alerts only)
- price_history (read access)

### Admin Access
Administrators have full access to all tables for management purposes.

## Relationships

### One-to-Many
- Category → Products
- Product → Price History entries
- User → Product Alerts

### Many-to-Many
- Products ↔ News Items (through product_news_items)

## Migration Management
Migrations are stored in `supabase/migrations/` and are executed in order based on their timestamp prefix. Each migration includes both `up` and `down` functions for reversibility. 