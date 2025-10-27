-- Seed sales quotations with pipeline-rich mock data
-- Usage: PGPASSWORD=$(grep -E '^password' database.txt | cut -d'=' -f2 | xargs) psql \
--   --host=$(grep -E '^host' database.txt | cut -d'=' -f2 | xargs) \
--   --username=$(grep -E '^user' database.txt | cut -d'=' -f2 | xargs) \
--   --dbname=$(grep -E '^database' database.txt | cut -d'=' -f2 | xargs) \
--   --file=data/seeds/sales_dashboard/03_seed_sales_quotations.sql

SET search_path TO sales_insights, public;

TRUNCATE TABLE sales_quotations;

WITH day_series AS (
    SELECT generate_series(CURRENT_DATE - INTERVAL '179 days', CURRENT_DATE, INTERVAL '1 day')::date AS quotation_date
),
status_seed AS (
    SELECT *
    FROM (VALUES
        ('Draft', 0.25),
        ('Active', 0.55),
        ('Completed', 0.90),
        ('Lost', 0.10)
    ) AS s(status, win_probability)
),
base_quotes AS (
    SELECT
        ds.quotation_date,
        ss.status,
        ss.win_probability,
        cust.customer_id,
        ROW_NUMBER() OVER (ORDER BY ds.quotation_date, ss.status, cust.customer_id) - 1 AS seq
    FROM day_series ds
    CROSS JOIN status_seed ss
    JOIN LATERAL (
        SELECT * FROM customers c ORDER BY random() LIMIT 1
    ) cust ON TRUE
),
products AS (
    SELECT
        product_id,
        product_category,
        unit_price,
        unit_cost,
        ROW_NUMBER() OVER (ORDER BY product_id) - 1 AS product_seq,
        COUNT(*) OVER () AS total_products
    FROM product_catalog
),
quotations AS (
    SELECT
        format('SQ-%s-%s',
               to_char(bq.quotation_date, 'YYYYMMDD'),
               lpad((ROW_NUMBER() OVER (PARTITION BY bq.quotation_date ORDER BY bq.status, bq.customer_id))::text, 3, '0')) AS quotation_id,
        bq.quotation_date,
        bq.customer_id,
        p.product_category,
        (p.unit_price * (45 + random()*55))::NUMERIC(12,2) AS quoted_amount,
        'MYR' AS currency,
        bq.status::quotation_status_enum AS status,
        (ARRAY['SP001','SP002','SP003','SP004','SP005','SP006'])[1 + (random()*5)::int] AS salesperson_id,
        bq.quotation_date + (3 + (random()*25)::int) * INTERVAL '1 day' AS expected_close_date,
        ROUND(((p.unit_price - p.unit_cost) * (40 + random()*35))::NUMERIC, 2) AS estimated_margin,
        GREATEST(0.05, LEAST(bq.win_probability + (random()*0.08 - 0.04), 0.95)) AS probability
    FROM base_quotes bq
    JOIN products p
      ON (bq.seq % p.total_products) = p.product_seq
)
INSERT INTO sales_quotations (
    quotation_id,
    quotation_date,
    customer_id,
    product_category,
    quoted_amount,
    currency,
    status,
    salesperson_id,
    expected_close_date,
    estimated_margin,
    probability,
    created_at
)
SELECT
    quotation_id,
    quotation_date,
    customer_id,
    product_category,
    ROUND(quoted_amount, 2),
    currency,
    status,
    salesperson_id,
    expected_close_date::date,
    estimated_margin,
    probability,
    NOW()
FROM quotations
ORDER BY quotation_date;
