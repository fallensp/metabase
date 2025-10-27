-- Validation queries for Metabase Sales Insights dashboard.
-- Usage: PGPASSWORD=$(grep -E '^password' database.txt | cut -d'=' -f2 | xargs) psql \
--   --host=$(grep -E '^host' database.txt | cut -d'=' -f2 | xargs) \
--   --username=$(grep -E '^user' database.txt | cut -d'=' -f2 | xargs) \
--   --dbname=$(grep -E '^database' database.txt | cut -d'=' -f2 | xargs)
-- Run individual sections as needed to confirm parity with dashboard visuals.

\pset footer off
\timing on

-- Daily Sales Metrics
SELECT order_date,
       COUNT(*) AS order_count,
       SUM(revenue_amount) AS total_revenue,
       ROUND(AVG(SUM(revenue_amount)) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS trailing_7_day_avg
FROM sales_insights.sales_orders
GROUP BY order_date
ORDER BY order_date DESC
LIMIT 10;

-- Quotation Pipeline Overview
SELECT status,
       COUNT(*) AS quotation_count,
       SUM(quoted_amount) AS total_value
FROM sales_insights.sales_quotations
GROUP BY status
ORDER BY status;

-- Quote-to-Order Conversion Metrics
WITH joined AS (
    SELECT q.product_category,
           q.quotation_id,
           q.status,
           o.order_id,
           o.revenue_amount
    FROM sales_insights.sales_quotations q
    LEFT JOIN sales_insights.sales_orders o
      ON o.quotation_id = q.quotation_id
)
SELECT product_category,
       COUNT(DISTINCT quotation_id) AS quotations,
       COUNT(DISTINCT order_id) AS orders,
       CASE WHEN COUNT(DISTINCT quotation_id) = 0 THEN 0
            ELSE ROUND(COUNT(DISTINCT order_id)::NUMERIC / COUNT(DISTINCT quotation_id), 2)
       END AS conversion_rate,
       SUM(revenue_amount) AS order_value
FROM joined
GROUP BY product_category
ORDER BY product_category;
