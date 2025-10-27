-- Schema definition for Sales Insights dashboard
-- Usage: psql "host=$(grep -E '^host' database.txt | cut -d'=' -f2 | xargs) user=$(grep -E '^user' database.txt | cut -d'=' -f2 | xargs) password=$(grep -E '^password' database.txt | cut -d'=' -f2 | xargs) dbname=$(grep -E '^database' database.txt | cut -d'=' -f2 | xargs)" -f data/seeds/sales_dashboard/01_schema.sql

CREATE SCHEMA IF NOT EXISTS sales_insights;

CREATE TABLE IF NOT EXISTS sales_insights.customers (
    customer_id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_segment TEXT NOT NULL,
    region TEXT NOT NULL,
    industry TEXT NOT NULL,
    credit_limit NUMERIC(12,2) NOT NULL DEFAULT 0,
    credit_utilized NUMERIC(12,2) NOT NULL DEFAULT 0,
    first_order_date DATE,
    last_order_date DATE
);

ALTER TABLE sales_insights.customers
    ADD COLUMN IF NOT EXISTS industry TEXT NOT NULL DEFAULT 'General';
ALTER TABLE sales_insights.customers
    ALTER COLUMN industry DROP DEFAULT;
ALTER TABLE sales_insights.customers
    ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE sales_insights.customers
    ADD COLUMN IF NOT EXISTS credit_utilized NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE sales_insights.customers
    ADD COLUMN IF NOT EXISTS first_order_date DATE;
ALTER TABLE sales_insights.customers
    ADD COLUMN IF NOT EXISTS last_order_date DATE;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status_enum') THEN
        CREATE TYPE delivery_status_enum AS ENUM ('Pending', 'Shipped', 'Delivered', 'Cancelled');
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_status_enum') THEN
        CREATE TYPE quotation_status_enum AS ENUM ('Draft', 'Active', 'Completed', 'Lost');
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS sales_insights.salespeople (
    salesperson_id TEXT PRIMARY KEY,
    salesperson_name TEXT NOT NULL,
    department TEXT NOT NULL,
    territory TEXT NOT NULL,
    hire_date DATE NOT NULL
);

ALTER TABLE sales_insights.salespeople
    ADD COLUMN IF NOT EXISTS territory TEXT NOT NULL DEFAULT 'General';
ALTER TABLE sales_insights.salespeople
    ALTER COLUMN territory DROP DEFAULT;
ALTER TABLE sales_insights.salespeople
    ADD COLUMN IF NOT EXISTS hire_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE sales_insights.salespeople
    ALTER COLUMN hire_date DROP DEFAULT;

CREATE TABLE IF NOT EXISTS sales_insights.product_catalog (
    product_id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    product_category TEXT NOT NULL,
    product_family TEXT NOT NULL,
    unit_cost NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    launch_date DATE,
    lifecycle_stage TEXT NOT NULL,
    reorder_point INTEGER NOT NULL,
    uom TEXT NOT NULL DEFAULT 'EA'
);

CREATE TABLE IF NOT EXISTS sales_insights.sales_orders (
    order_id TEXT PRIMARY KEY,
    order_date DATE NOT NULL,
    customer_id TEXT NOT NULL REFERENCES sales_insights.customers(customer_id),
    product_category TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    revenue_amount NUMERIC(12,2) NOT NULL CHECK (revenue_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'MYR',
    delivery_status delivery_status_enum NOT NULL,
    salesperson_id TEXT NOT NULL REFERENCES sales_insights.salespeople(salesperson_id),
    quotation_id TEXT,
    unit_price NUMERIC(12,2) NOT NULL,
    unit_cost NUMERIC(12,2) NOT NULL,
    gross_profit NUMERIC(12,2) NOT NULL,
    discount_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    sales_channel TEXT NOT NULL DEFAULT 'Direct',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

ALTER TABLE sales_insights.sales_orders
    ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE sales_insights.sales_orders
    ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12,2) DEFAULT 0;
ALTER TABLE sales_insights.sales_orders
    ADD COLUMN IF NOT EXISTS gross_profit NUMERIC(12,2) DEFAULT 0;
ALTER TABLE sales_insights.sales_orders
    ADD COLUMN IF NOT EXISTS discount_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE sales_insights.sales_orders
    ADD COLUMN IF NOT EXISTS sales_channel TEXT DEFAULT 'Direct';

CREATE TABLE IF NOT EXISTS sales_insights.sales_quotations (
    quotation_id TEXT PRIMARY KEY,
    quotation_date DATE NOT NULL,
    customer_id TEXT NOT NULL REFERENCES sales_insights.customers(customer_id),
    product_category TEXT NOT NULL,
    quoted_amount NUMERIC(12,2) NOT NULL CHECK (quoted_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'MYR',
    status quotation_status_enum NOT NULL,
    salesperson_id TEXT NOT NULL REFERENCES sales_insights.salespeople(salesperson_id),
    expected_close_date DATE NOT NULL,
    estimated_margin NUMERIC(12,2),
    probability NUMERIC(5,2) DEFAULT 0.5,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

ALTER TABLE sales_insights.sales_quotations
    ADD COLUMN IF NOT EXISTS estimated_margin NUMERIC(12,2);
ALTER TABLE sales_insights.sales_quotations
    ADD COLUMN IF NOT EXISTS probability NUMERIC(5,2) DEFAULT 0.5;

CREATE TABLE IF NOT EXISTS sales_insights.sales_targets (
    target_id SERIAL PRIMARY KEY,
    target_date DATE NOT NULL,
    granularity TEXT NOT NULL, -- company, category, salesperson
    entity_id TEXT NOT NULL,
    target_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_insights.inventory_snapshots (
    snapshot_date DATE NOT NULL,
    product_id TEXT NOT NULL REFERENCES sales_insights.product_catalog(product_id),
    stock_on_hand INTEGER NOT NULL,
    reserved_units INTEGER NOT NULL DEFAULT 0,
    inbound_units INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (snapshot_date, product_id)
);

CREATE TABLE IF NOT EXISTS sales_insights.sales_forecasts (
    forecast_id SERIAL PRIMARY KEY,
    forecast_date DATE NOT NULL,
    horizon TEXT NOT NULL,
    product_category TEXT NOT NULL,
    predicted_revenue NUMERIC(12,2) NOT NULL,
    predicted_margin NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

COMMENT ON SCHEMA sales_insights IS 'Mock data schema for Metabase sales insights dashboard';
