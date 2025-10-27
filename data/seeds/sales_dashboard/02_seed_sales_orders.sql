-- Seed sales orders with enriched mock data anchored to workbook metrics
-- Usage: PGPASSWORD=$(grep -E '^password' database.txt | cut -d'=' -f2 | xargs) psql \
--   --host=$(grep -E '^host' database.txt | cut -d'=' -f2 | xargs) \
--   --username=$(grep -E '^user' database.txt | cut -d'=' -f2 | xargs) \
--   --dbname=$(grep -E '^database' database.txt | cut -d'=' -f2 | xargs) \
--   --file=data/seeds/sales_dashboard/02_seed_sales_orders.sql

SET search_path TO sales_insights, public;

-- Clear existing data to allow reseeding
TRUNCATE TABLE sales_orders CASCADE;
TRUNCATE TABLE sales_quotations;
TRUNCATE TABLE inventory_snapshots;
TRUNCATE TABLE sales_targets RESTART IDENTITY;
TRUNCATE TABLE sales_forecasts RESTART IDENTITY;
TRUNCATE TABLE product_catalog CASCADE;
TRUNCATE TABLE salespeople CASCADE;
TRUNCATE TABLE customers CASCADE;

-- Sales team metadata
INSERT INTO salespeople (salesperson_id, salesperson_name, department, territory, hire_date) VALUES
    ('SP001', 'Elaine Tan', 'Sales', 'Central', CURRENT_DATE - INTERVAL '6 years'),
    ('SP002', 'Ravi Kumar', 'Sales', 'North', CURRENT_DATE - INTERVAL '5 years'),
    ('SP003', 'Nur Aisyah', 'Sales', 'South', CURRENT_DATE - INTERVAL '4 years'),
    ('SP004', 'Gerald Lim', 'Sales', 'East', CURRENT_DATE - INTERVAL '7 years'),
    ('SP005', 'Melissa Wong', 'Sales', 'Key Accounts', CURRENT_DATE - INTERVAL '3 years'),
    ('SP006', 'Hafiz Rahman', 'Sales', 'Export', CURRENT_DATE - INTERVAL '2 years')
ON CONFLICT (salesperson_id) DO NOTHING;

-- Customers enriched for customer insight metrics
INSERT INTO customers (customer_id, customer_name, customer_segment, region, industry, credit_limit, credit_utilized, first_order_date, last_order_date) VALUES
    ('C001', 'Kintex Retail', 'Retail', 'Kuala Lumpur', 'Furniture Retail', 250000, 182000, CURRENT_DATE - INTERVAL '2 years', CURRENT_DATE - INTERVAL '1 day'),
    ('C002', 'Alpha Designers', 'Commercial', 'Penang', 'Interior Design', 180000, 92000, CURRENT_DATE - INTERVAL '18 months', CURRENT_DATE - INTERVAL '2 days'),
    ('C003', 'Vision Builders', 'Commercial', 'Johor Bahru', 'Construction', 320000, 150000, CURRENT_DATE - INTERVAL '30 months', CURRENT_DATE - INTERVAL '3 days'),
    ('C004', 'Eco Living', 'Retail', 'Kuching', 'Home & Living', 120000, 46000, CURRENT_DATE - INTERVAL '12 months', CURRENT_DATE - INTERVAL '6 days'),
    ('C005', 'Delta Auto Upholstery', 'Industrial', 'Melaka', 'Automotive', 210000, 87000, CURRENT_DATE - INTERVAL '20 months', CURRENT_DATE - INTERVAL '1 day'),
    ('C006', 'CanvasPro Supplies', 'Distributor', 'Ipoh', 'Outdoor Equipment', 160000, 98000, CURRENT_DATE - INTERVAL '26 months', CURRENT_DATE - INTERVAL '4 days'),
    ('C007', 'Pacific Hotels Group', 'Hospitality', 'Langkawi', 'Hospitality', 400000, 265000, CURRENT_DATE - INTERVAL '15 months', CURRENT_DATE - INTERVAL '8 days'),
    ('C008', 'Northern Awning', 'Industrial', 'Alor Setar', 'Construction', 140000, 88000, CURRENT_DATE - INTERVAL '22 months', CURRENT_DATE - INTERVAL '5 days'),
    ('C009', 'Glide Interiors', 'Commercial', 'Singapore', 'Interior Design', 500000, 350000, CURRENT_DATE - INTERVAL '28 months', CURRENT_DATE - INTERVAL '3 days'),
    ('C010', 'Matrix Marine', 'Industrial', 'Port Klang', 'Marine', 300000, 112000, CURRENT_DATE - INTERVAL '16 months', CURRENT_DATE - INTERVAL '2 days'),
    ('C011', 'Serenity Resorts', 'Hospitality', 'Sabah', 'Hospitality', 280000, 154000, CURRENT_DATE - INTERVAL '18 months', CURRENT_DATE - INTERVAL '7 days'),
    ('C012', 'Urban Canvas Collective', 'Distributor', 'Kuala Lumpur', 'Outdoor Equipment', 220000, 105000, CURRENT_DATE - INTERVAL '24 months', CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT (customer_id) DO NOTHING;

-- Product catalog aligned with workbook categories
INSERT INTO product_catalog (product_id, product_name, product_category, product_family, unit_cost, unit_price, launch_date, lifecycle_stage, reorder_point, uom) VALUES
    ('PRD-UF-001', 'LuxeWeave Sofa Fabric', 'Upholstery Fabric', 'Premium Upholstery', 45.00, 95.00, CURRENT_DATE - INTERVAL '420 days', 'Growth', 120, 'ROLL'),
    ('PRD-UF-002', 'EcoGuard Stainproof Fabric', 'Upholstery Fabric', 'Performance Upholstery', 38.00, 82.00, CURRENT_DATE - INTERVAL '390 days', 'Growth', 150, 'ROLL'),
    ('PRD-UF-003', 'Classic Weave Fabric', 'Upholstery Fabric', 'Classic Upholstery', 32.00, 68.00, CURRENT_DATE - INTERVAL '820 days', 'Mature', 200, 'ROLL'),
    ('PRD-PVC-001', 'FlexShield PVC Leather', 'PVC Leather', 'Automotive PVC', 28.00, 62.00, CURRENT_DATE - INTERVAL '500 days', 'Mature', 180, 'ROLL'),
    ('PRD-PVC-002', 'UltraSoft PVC Leather', 'PVC Leather', 'Hospitality PVC', 31.00, 72.00, CURRENT_DATE - INTERVAL '360 days', 'Growth', 160, 'ROLL'),
    ('PRD-PVC-003', 'MarineGuard PVC', 'PVC Leather', 'Marine PVC', 36.00, 80.00, CURRENT_DATE - INTERVAL '300 days', 'Launch', 140, 'ROLL'),
    ('PRD-CAN-001', 'StormShield Canvas', 'Canvas', 'Outdoor Canvas', 25.00, 58.00, CURRENT_DATE - INTERVAL '900 days', 'Mature', 220, 'ROLL'),
    ('PRD-CAN-002', 'LiteFlex Canvas', 'Canvas', 'Lightweight Canvas', 21.00, 50.00, CURRENT_DATE - INTERVAL '700 days', 'Growth', 200, 'ROLL'),
    ('PRD-CAN-003', 'ThermaGuard Insulated Canvas', 'Canvas', 'Specialty Canvas', 34.00, 76.00, CURRENT_DATE - INTERVAL '260 days', 'Launch', 110, 'ROLL'),
    ('PRD-TARP-001', 'MegaSpan Tarpaulin', 'Tarpaulin', 'Heavy Duty Tarpaulin', 19.00, 46.00, CURRENT_DATE - INTERVAL '640 days', 'Mature', 240, 'ROLL'),
    ('PRD-TARP-002', 'RapidDeploy Tarpaulin', 'Tarpaulin', 'Light Tarpaulin', 16.50, 38.00, CURRENT_DATE - INTERVAL '500 days', 'Growth', 210, 'ROLL'),
    ('PRD-TARP-003', 'ThermoShield Tarpaulin', 'Tarpaulin', 'Insulated Tarpaulin', 22.00, 54.00, CURRENT_DATE - INTERVAL '320 days', 'Launch', 150, 'ROLL'),
    ('PRD-ACC-001', 'ProEdge Foam Backing', 'Accessories', 'Accessories', 8.00, 18.00, CURRENT_DATE - INTERVAL '450 days', 'Growth', 300, 'BOX'),
    ('PRD-ACC-002', 'SecureGrip Fasteners', 'Accessories', 'Accessories', 3.50, 9.00, CURRENT_DATE - INTERVAL '300 days', 'Growth', 400, 'BOX'),
    ('PRD-ACC-003', 'AquaSeal Treatment Kit', 'Accessories', 'Accessories', 12.00, 28.00, CURRENT_DATE - INTERVAL '200 days', 'Launch', 180, 'KIT')
ON CONFLICT (product_id) DO NOTHING;

-- Main sales fact table (six months of activity minimum)
WITH day_series AS (
    SELECT generate_series(CURRENT_DATE - INTERVAL '179 days', CURRENT_DATE, INTERVAL '1 day')::date AS order_date
),
category_seed AS (
    SELECT c.product_category, gs.multiplier
    FROM (SELECT DISTINCT product_category FROM product_catalog) c
    CROSS JOIN generate_series(1,3) AS gs(multiplier)
),
expanded AS (
    SELECT
        format('SO-%s-%s',
               to_char(ds.order_date, 'YYYYMMDD'),
               lpad((ROW_NUMBER() OVER (PARTITION BY ds.order_date ORDER BY cat.product_category, cat.multiplier, cust.customer_id))::text, 3, '0')) AS order_id,
        ds.order_date,
        cust.customer_id,
        pc.product_category,
        pc.product_name,
        pc.unit_price,
        pc.unit_cost,
        6 + (random() * 24)::int AS quantity,
        CASE WHEN EXTRACT(DOW FROM ds.order_date) IN (0,6) THEN 9 + (random()*6)::int ELSE 3 + (random()*5)::int END AS discount_percentage,
        (ARRAY['Delivered','Delivered','Delivered','Shipped','Pending'])[1 + (random()*4)::int]::delivery_status_enum AS delivery_status,
        (ARRAY['SP001','SP002','SP003','SP004','SP005','SP006'])[1 + (random()*5)::int] AS salesperson_id,
        CASE WHEN random() < 0.38 THEN format('SQ-%s-%s', to_char(ds.order_date, 'YYYYMMDD'), lpad((cat.multiplier + (random()*4)::int)::text, 3, '0')) END AS quotation_id,
        (ARRAY['Direct','Distributor','Online','Key Account'])[1 + (random()*3)::int] AS sales_channel
    FROM day_series ds
    CROSS JOIN category_seed cat
    JOIN LATERAL (
        SELECT *
        FROM product_catalog pc
        WHERE pc.product_category = cat.product_category
        ORDER BY random()
        LIMIT 1
    ) pc ON TRUE
    JOIN LATERAL (
        SELECT * FROM customers c ORDER BY random() LIMIT 1
    ) cust ON TRUE
)
INSERT INTO sales_orders (
    order_id,
    order_date,
    customer_id,
    product_category,
    product_name,
    quantity,
    revenue_amount,
    currency,
    delivery_status,
    salesperson_id,
    quotation_id,
    unit_price,
    unit_cost,
    gross_profit,
    discount_rate,
    sales_channel,
    created_at
)
SELECT
    order_id,
    order_date,
    customer_id,
    product_category,
    product_name,
    quantity,
    ROUND((unit_price * quantity * (1 - (discount_percentage / 100.0)))::NUMERIC, 2) AS revenue_amount,
    'MYR',
    delivery_status,
    salesperson_id,
    quotation_id,
    unit_price,
    unit_cost,
    ROUND(((unit_price - unit_cost) * quantity * (1 - (discount_percentage / 100.0)))::NUMERIC, 2) AS gross_profit,
    ROUND(discount_percentage::NUMERIC, 2),
    sales_channel,
    NOW()
FROM expanded
ORDER BY order_date;

-- Inventory snapshots (support stock alerts & fast/slow moving metrics)
WITH weekly AS (
    SELECT generate_series(CURRENT_DATE - INTERVAL '84 days', CURRENT_DATE, INTERVAL '7 days')::date AS snapshot_date
),
inventory AS (
    SELECT
        w.snapshot_date,
        pc.product_id,
        GREATEST(pc.reorder_point + (random()*120)::int - 50, 60) AS stock_on_hand,
        (random()*40)::int AS reserved_units,
        (random()*60)::int AS inbound_units
    FROM weekly w
    CROSS JOIN product_catalog pc
)
INSERT INTO inventory_snapshots (snapshot_date, product_id, stock_on_hand, reserved_units, inbound_units)
SELECT snapshot_date, product_id, stock_on_hand, reserved_units, inbound_units
FROM inventory;

-- Sales targets (company, category, salesperson granularity)
WITH months AS (
    SELECT date_trunc('month', generate_series(CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE + INTERVAL '1 month', INTERVAL '1 month'))::date AS target_month
),
company_targets AS (
    SELECT target_month, 'company' AS granularity, 'ALL' AS entity_id,
           ROUND((420000 + random()*90000)::NUMERIC, 2) AS target_amount
    FROM months
),
category_targets AS (
    SELECT target_month,
           'category' AS granularity,
           pc.product_category AS entity_id,
           ROUND((82000 + random()*35000)::NUMERIC, 2) AS target_amount
    FROM months
    CROSS JOIN (SELECT DISTINCT product_category FROM product_catalog) pc
),
salesperson_targets AS (
    SELECT target_month,
           'salesperson' AS granularity,
           sp.salesperson_id AS entity_id,
           ROUND((64000 + random()*28000)::NUMERIC, 2) AS target_amount
    FROM months
    CROSS JOIN salespeople sp
)
INSERT INTO sales_targets (target_date, granularity, entity_id, target_amount)
SELECT target_month, granularity, entity_id, target_amount FROM company_targets
UNION ALL
SELECT target_month, granularity, entity_id, target_amount FROM category_targets
UNION ALL
SELECT target_month, granularity, entity_id, target_amount FROM salesperson_targets;

-- Sales forecasts to support predictive analytics view
WITH horizons AS (
    SELECT generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', INTERVAL '30 days')::date AS horizon_date
)
INSERT INTO sales_forecasts (forecast_date, horizon, product_category, predicted_revenue, predicted_margin)
SELECT
    horizon_date,
    CASE
        WHEN horizon_date = CURRENT_DATE THEN 'Current Month'
        WHEN horizon_date = CURRENT_DATE + INTERVAL '30 days' THEN 'Next Month'
        ELSE '60-90 Day Outlook'
    END,
    pc.product_category,
    ROUND((72000 + random()*45000)::NUMERIC, 2) AS predicted_revenue,
    ROUND((28500 + random()*16000)::NUMERIC, 2) AS predicted_margin
FROM horizons
CROSS JOIN (SELECT DISTINCT product_category FROM product_catalog) pc;
