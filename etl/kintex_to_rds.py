#!/usr/bin/env python3
"""
ETL Script: Extract data from local KINTEX PostgreSQL and load into RDS sales_insights schema.

This script:
1. Extracts real master data (customers, products, salespeople, categories) from KINTEX
2. Generates realistic sales transactions based on this master data
3. Loads everything into the RDS sales_insights schema for Metabase dashboards
"""

import psycopg2
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Local KINTEX database connection
LOCAL_DB = {
    'host': 'localhost',
    'database': 'KINTEX',
    'user': 'ivan',  # Adjust if needed
}

# Remote RDS connection (from database.txt)
RDS_DB = {
    'host': 'pgm-zf88bk02y03831k6co.pgsql.kualalumpur.rds.aliyuncs.com',
    'database': 'epb',
    'user': 'quantum',
    'password': 'Buyabread87',
}

# Category mapping from KINTEX cat1_id to dashboard-friendly names
CATEGORY_MAP = {
    'FAB': 'Upholstery Fabric',
    'PVC': 'PVC Leather',
    'CANTARP': 'Canvas & Tarpaulin',
    'ACS': 'Accessories',
    'RECL': 'Recliner',
    'SHEET': 'Sheeting',
    'NW': 'Non Woven',
    'FL': 'Carpet & Flooring',
    'RIG': 'Rigid',
    'MAC': 'Machine & Parts',
}

# Customer segment mapping
SEGMENT_MAP = {
    'MANUFACTURING': 'Industrial',
    'DESIGNER & ARCHITECT': 'Commercial',
    'END USER': 'Retail',
    'DEALER': 'Distributor',
    'FURNITURE': 'Industrial',
    'COACH BUILDER': 'Industrial',
    'CANVAS/TARP': 'Industrial',
    'PACKAGING & STATIONERY': 'Commercial',
    'BUS SEAT/CAR SE': 'Industrial',
    'SILKSCREEN & ADVERTISING': 'Commercial',
}


def get_local_connection():
    return psycopg2.connect(**LOCAL_DB)


def get_rds_connection():
    return psycopg2.connect(**RDS_DB)


def extract_customers(local_conn, limit=100):
    """Extract top customers from KINTEX with credit info."""
    query = """
    SELECT
        cust_id,
        name,
        COALESCE(customergroup_id, 'OTHER') as customer_segment,
        COALESCE(industry_id, customergroup_id, 'General') as industry,
        COALESCE(credit_limit, 1000) as credit_limit,
        create_date
    FROM customer
    WHERE name IS NOT NULL AND name != ''
    ORDER BY credit_limit DESC NULLS LAST
    LIMIT %s
    """
    with local_conn.cursor() as cur:
        cur.execute(query, (limit,))
        return cur.fetchall()


def extract_products(local_conn, per_category=10):
    """Extract products from KINTEX with category info - samples from each category."""
    query = """
    WITH ranked AS (
        SELECT
            s.stk_id,
            s.name,
            COALESCE(c.name, s.cat1_id, 'Other') as product_category,
            s.cat1_id as category_code,
            s.uom_id,
            ROW_NUMBER() OVER (PARTITION BY s.cat1_id ORDER BY RANDOM()) as rn
        FROM stkmas s
        LEFT JOIN stkcat1 c ON s.cat1_id = c.cat1_id
        WHERE s.name IS NOT NULL
        AND s.cat1_id IN ('FAB', 'PVC', 'CANTARP', 'ACS', 'RECL', 'SHEET', 'NW', 'FL')
    )
    SELECT stk_id, name, product_category, category_code, uom_id
    FROM ranked
    WHERE rn <= %s
    ORDER BY category_code, stk_id
    """
    with local_conn.cursor() as cur:
        cur.execute(query, (per_category,))
        return cur.fetchall()


def extract_salespeople(local_conn):
    """Extract salespeople from KINTEX."""
    query = """
    SELECT
        emp_id,
        name,
        COALESCE(dept_id, 'SALES') as department
    FROM ep_emp
    WHERE status_flg = 'A'
    AND (dept_id IN ('SALES', 'SC') OR emp_id LIKE 'SS%')
    ORDER BY emp_id
    LIMIT 15
    """
    with local_conn.cursor() as cur:
        cur.execute(query)
        return cur.fetchall()


def clear_rds_data(rds_conn):
    """Clear existing data in RDS sales_insights schema."""
    with rds_conn.cursor() as cur:
        cur.execute("SET search_path TO sales_insights, public;")
        cur.execute("TRUNCATE TABLE sales_orders CASCADE;")
        cur.execute("TRUNCATE TABLE sales_quotations;")
        cur.execute("TRUNCATE TABLE inventory_snapshots;")
        cur.execute("TRUNCATE TABLE sales_targets RESTART IDENTITY;")
        cur.execute("TRUNCATE TABLE sales_forecasts RESTART IDENTITY;")
        cur.execute("TRUNCATE TABLE product_catalog CASCADE;")
        cur.execute("TRUNCATE TABLE salespeople CASCADE;")
        cur.execute("TRUNCATE TABLE customers CASCADE;")
    rds_conn.commit()
    print("Cleared existing RDS data")


def load_salespeople(rds_conn, salespeople):
    """Load salespeople into RDS."""
    with rds_conn.cursor() as cur:
        cur.execute("SET search_path TO sales_insights, public;")
        for emp_id, name, dept in salespeople:
            territory = random.choice(['Central', 'North', 'South', 'East', 'West'])
            hire_date = datetime.now() - timedelta(days=random.randint(365, 2500))
            cur.execute("""
                INSERT INTO salespeople (salesperson_id, salesperson_name, department, territory, hire_date)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (salesperson_id) DO NOTHING
            """, (emp_id, name, dept, territory, hire_date.date()))
    rds_conn.commit()
    print(f"Loaded {len(salespeople)} salespeople")


def load_customers(rds_conn, customers):
    """Load customers into RDS."""
    with rds_conn.cursor() as cur:
        cur.execute("SET search_path TO sales_insights, public;")
        for cust_id, name, segment, industry, credit_limit, create_date in customers:
            mapped_segment = SEGMENT_MAP.get(segment, 'Other')
            region = random.choice(['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Kuching', 'Melaka', 'Ipoh', 'Sabah'])
            credit_utilized = float(credit_limit) * random.uniform(0.2, 0.8)
            first_order = datetime.now() - timedelta(days=random.randint(180, 900))
            last_order = datetime.now() - timedelta(days=random.randint(1, 30))

            cur.execute("""
                INSERT INTO customers (customer_id, customer_name, customer_segment, region, industry,
                                       credit_limit, credit_utilized, first_order_date, last_order_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (customer_id) DO NOTHING
            """, (cust_id, name, mapped_segment, region, industry or 'General',
                  credit_limit, round(credit_utilized, 2), first_order.date(), last_order.date()))
    rds_conn.commit()
    print(f"Loaded {len(customers)} customers")


def load_products(rds_conn, products):
    """Load products into RDS product_catalog."""
    with rds_conn.cursor() as cur:
        cur.execute("SET search_path TO sales_insights, public;")
        for stk_id, name, category, cat_code, uom in products:
            mapped_category = CATEGORY_MAP.get(cat_code, category)
            unit_cost = round(random.uniform(15, 50), 2)
            unit_price = round(unit_cost * random.uniform(1.8, 2.5), 2)
            launch_date = datetime.now() - timedelta(days=random.randint(200, 800))
            lifecycle = random.choice(['Launch', 'Growth', 'Mature'])
            reorder_point = random.randint(100, 300)

            cur.execute("""
                INSERT INTO product_catalog (product_id, product_name, product_category, product_family,
                                             unit_cost, unit_price, launch_date, lifecycle_stage, reorder_point, uom)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (product_id) DO NOTHING
            """, (stk_id, name[:100], mapped_category, category, unit_cost, unit_price,
                  launch_date.date(), lifecycle, reorder_point, uom or 'ROLL'))
    rds_conn.commit()
    print(f"Loaded {len(products)} products")


def generate_sales_orders(rds_conn, customers, products, salespeople, days=180):
    """Generate realistic sales orders based on extracted master data."""
    with rds_conn.cursor() as cur:
        cur.execute("SET search_path TO sales_insights, public;")

        # Get loaded data IDs
        cur.execute("SELECT customer_id FROM customers")
        customer_ids = [r[0] for r in cur.fetchall()]

        cur.execute("SELECT product_id, product_name, product_category, unit_price, unit_cost FROM product_catalog")
        products_data = cur.fetchall()

        cur.execute("SELECT salesperson_id FROM salespeople")
        salesperson_ids = [r[0] for r in cur.fetchall()]

        if not customer_ids or not products_data or not salesperson_ids:
            print("Missing master data, skipping order generation")
            return

        order_count = 0
        start_date = datetime.now() - timedelta(days=days)

        for day_offset in range(days + 1):
            order_date = start_date + timedelta(days=day_offset)
            # Generate 10-20 orders per day
            daily_orders = random.randint(10, 20)

            for i in range(daily_orders):
                order_id = f"SO-{order_date.strftime('%Y%m%d')}-{str(i+1).zfill(3)}"
                customer_id = random.choice(customer_ids)
                prod = random.choice(products_data)
                product_id, product_name, product_category, unit_price, unit_cost = prod
                salesperson_id = random.choice(salesperson_ids)

                quantity = random.randint(5, 30)
                discount_rate = round(random.uniform(0, 15), 2)
                revenue = round(float(unit_price) * quantity * (1 - discount_rate/100), 2)
                gross_profit = round((float(unit_price) - float(unit_cost)) * quantity * (1 - discount_rate/100), 2)

                delivery_status = random.choices(
                    ['Delivered', 'Shipped', 'Pending', 'Cancelled'],
                    weights=[60, 20, 15, 5]
                )[0]

                sales_channel = random.choice(['Direct', 'Distributor', 'Online', 'Key Account'])
                quotation_id = f"SQ-{order_date.strftime('%Y%m%d')}-{random.randint(1,99):03d}" if random.random() < 0.35 else None

                cur.execute("""
                    INSERT INTO sales_orders (order_id, order_date, customer_id, product_category, product_name,
                                              quantity, revenue_amount, currency, delivery_status, salesperson_id,
                                              quotation_id, unit_price, unit_cost, gross_profit, discount_rate,
                                              sales_channel, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'MYR', %s::delivery_status_enum, %s, %s, %s, %s, %s, %s, %s, NOW())
                """, (order_id, order_date.date(), customer_id, product_category, product_name[:100],
                      quantity, revenue, delivery_status, salesperson_id, quotation_id,
                      unit_price, unit_cost, gross_profit, discount_rate, sales_channel))
                order_count += 1

        rds_conn.commit()
        print(f"Generated {order_count} sales orders")


def generate_quotations(rds_conn, days=180):
    """Generate quotations based on loaded master data."""
    with rds_conn.cursor() as cur:
        cur.execute("SET search_path TO sales_insights, public;")

        cur.execute("SELECT customer_id FROM customers")
        customer_ids = [r[0] for r in cur.fetchall()]

        cur.execute("SELECT product_category, unit_price, unit_cost FROM product_catalog")
        products_data = cur.fetchall()

        cur.execute("SELECT salesperson_id FROM salespeople")
        salesperson_ids = [r[0] for r in cur.fetchall()]

        if not customer_ids or not products_data or not salesperson_ids:
            return

        quote_count = 0
        start_date = datetime.now() - timedelta(days=days)
        statuses = ['Draft', 'Active', 'Completed', 'Lost']

        for day_offset in range(days + 1):
            quote_date = start_date + timedelta(days=day_offset)
            # 3-6 quotations per day
            daily_quotes = random.randint(3, 6)

            for i in range(daily_quotes):
                quotation_id = f"SQ-{quote_date.strftime('%Y%m%d')}-{str(i+1).zfill(3)}"
                customer_id = random.choice(customer_ids)
                prod = random.choice(products_data)
                product_category, unit_price, unit_cost = prod
                salesperson_id = random.choice(salesperson_ids)

                quantity = random.randint(40, 100)
                quoted_amount = round(float(unit_price) * quantity, 2)
                estimated_margin = round((float(unit_price) - float(unit_cost)) * quantity, 2)
                status = random.choice(statuses)
                probability = {'Draft': 0.25, 'Active': 0.55, 'Completed': 0.90, 'Lost': 0.10}[status]
                probability = round(probability + random.uniform(-0.05, 0.05), 2)
                expected_close = quote_date + timedelta(days=random.randint(7, 45))

                cur.execute("""
                    INSERT INTO sales_quotations (quotation_id, quotation_date, customer_id, product_category,
                                                  quoted_amount, currency, status, salesperson_id,
                                                  expected_close_date, estimated_margin, probability, created_at)
                    VALUES (%s, %s, %s, %s, %s, 'MYR', %s::quotation_status_enum, %s, %s, %s, %s, NOW())
                """, (quotation_id, quote_date.date(), customer_id, product_category,
                      quoted_amount, status, salesperson_id, expected_close.date(),
                      estimated_margin, probability))
                quote_count += 1

        rds_conn.commit()
        print(f"Generated {quote_count} quotations")


def generate_targets(rds_conn):
    """Generate sales targets."""
    with rds_conn.cursor() as cur:
        cur.execute("SET search_path TO sales_insights, public;")

        cur.execute("SELECT DISTINCT product_category FROM product_catalog")
        categories = [r[0] for r in cur.fetchall()]

        cur.execute("SELECT salesperson_id FROM salespeople")
        salesperson_ids = [r[0] for r in cur.fetchall()]

        # Generate monthly targets for past 6 months + current + next month
        for month_offset in range(-5, 2):
            target_date = (datetime.now().replace(day=1) + timedelta(days=32*month_offset)).replace(day=1)

            # Company target
            cur.execute("""
                INSERT INTO sales_targets (target_date, granularity, entity_id, target_amount)
                VALUES (%s, 'company', 'ALL', %s)
            """, (target_date.date(), round(random.uniform(400000, 550000), 2)))

            # Category targets
            for cat in categories:
                cur.execute("""
                    INSERT INTO sales_targets (target_date, granularity, entity_id, target_amount)
                    VALUES (%s, 'category', %s, %s)
                """, (target_date.date(), cat, round(random.uniform(60000, 120000), 2)))

            # Salesperson targets
            for sp_id in salesperson_ids:
                cur.execute("""
                    INSERT INTO sales_targets (target_date, granularity, entity_id, target_amount)
                    VALUES (%s, 'salesperson', %s, %s)
                """, (target_date.date(), sp_id, round(random.uniform(50000, 90000), 2)))

        rds_conn.commit()
        print("Generated sales targets")


def generate_inventory_snapshots(rds_conn):
    """Generate inventory snapshots."""
    with rds_conn.cursor() as cur:
        cur.execute("SET search_path TO sales_insights, public;")

        cur.execute("SELECT product_id, reorder_point FROM product_catalog")
        products = cur.fetchall()

        # Weekly snapshots for past 12 weeks
        for week_offset in range(12):
            snapshot_date = datetime.now() - timedelta(weeks=week_offset)
            for product_id, reorder_point in products:
                stock = max(50, reorder_point + random.randint(-50, 100))
                reserved = random.randint(0, 40)
                inbound = random.randint(0, 60)

                cur.execute("""
                    INSERT INTO inventory_snapshots (snapshot_date, product_id, stock_on_hand, reserved_units, inbound_units)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (snapshot_date, product_id) DO NOTHING
                """, (snapshot_date.date(), product_id, stock, reserved, inbound))

        rds_conn.commit()
        print("Generated inventory snapshots")


def generate_forecasts(rds_conn):
    """Generate sales forecasts."""
    with rds_conn.cursor() as cur:
        cur.execute("SET search_path TO sales_insights, public;")

        cur.execute("SELECT DISTINCT product_category FROM product_catalog")
        categories = [r[0] for r in cur.fetchall()]

        horizons = [
            (0, 'Current Month'),
            (30, 'Next Month'),
            (60, '60-90 Day Outlook'),
            (90, '90+ Day Outlook'),
        ]

        for days_ahead, horizon_name in horizons:
            forecast_date = datetime.now() + timedelta(days=days_ahead)
            for cat in categories:
                cur.execute("""
                    INSERT INTO sales_forecasts (forecast_date, horizon, product_category, predicted_revenue, predicted_margin)
                    VALUES (%s, %s, %s, %s, %s)
                """, (forecast_date.date(), horizon_name, cat,
                      round(random.uniform(60000, 100000), 2),
                      round(random.uniform(25000, 45000), 2)))

        rds_conn.commit()
        print("Generated sales forecasts")


def main():
    print("=" * 60)
    print("KINTEX to RDS ETL Pipeline")
    print("=" * 60)

    # Connect to databases
    print("\nConnecting to databases...")
    local_conn = get_local_connection()
    rds_conn = get_rds_connection()
    print("Connected successfully!")

    try:
        # Extract from KINTEX
        print("\n--- EXTRACT PHASE ---")
        customers = extract_customers(local_conn, limit=100)
        print(f"Extracted {len(customers)} customers from KINTEX")

        products = extract_products(local_conn, per_category=8)
        print(f"Extracted {len(products)} products from KINTEX (8 per category)")

        salespeople = extract_salespeople(local_conn)
        print(f"Extracted {len(salespeople)} salespeople from KINTEX")

        # Clear and Load to RDS
        print("\n--- LOAD PHASE ---")
        clear_rds_data(rds_conn)

        load_salespeople(rds_conn, salespeople)
        load_customers(rds_conn, customers)
        load_products(rds_conn, products)

        # Generate transactions
        print("\n--- GENERATE TRANSACTIONS ---")
        generate_sales_orders(rds_conn, customers, products, salespeople, days=180)
        generate_quotations(rds_conn, days=180)
        generate_targets(rds_conn)
        generate_inventory_snapshots(rds_conn)
        generate_forecasts(rds_conn)

        print("\n" + "=" * 60)
        print("ETL COMPLETED SUCCESSFULLY!")
        print("=" * 60)

    finally:
        local_conn.close()
        rds_conn.close()


if __name__ == '__main__':
    main()
