#!/usr/bin/env python3
"""
Extended Data Seeding Script for EPB Sales Insights
Generates 2+ years of realistic sales data (2024-01-01 to 2026-12-31)

Features:
- Seasonal patterns (higher sales in Q4, lower in Q1)
- Year-over-year growth trends
- Realistic quotation-to-order conversion
- Weekend/holiday adjustments
"""

import psycopg2
import random
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

# Database connection
DB_CONFIG = {
    "host": "pgm-zf88bk02y03831k6co.pgsql.kualalumpur.rds.aliyuncs.com",
    "database": "epb",
    "user": "quantum",
    "password": "Buyabread87",
    "port": 5432
}

# Date range
START_DATE = datetime(2024, 1, 1)
END_DATE = datetime(2026, 12, 31)

# Seasonal multipliers (by month)
SEASONAL_MULTIPLIERS = {
    1: 0.7,   # Jan - post-holiday slow
    2: 0.75,  # Feb - CNY slow
    3: 0.85,  # Mar - picking up
    4: 0.9,   # Apr
    5: 0.95,  # May
    6: 1.0,   # Jun
    7: 0.95,  # Jul
    8: 1.0,   # Aug
    9: 1.1,   # Sep - Merdeka boost
    10: 1.15, # Oct - pre-Deepavali
    11: 1.2,  # Nov - year-end push
    12: 1.25, # Dec - year-end rush
}

# Year-over-year growth rates
YOY_GROWTH = {
    2024: 1.0,    # Baseline
    2025: 1.15,   # 15% growth
    2026: 1.28,   # 28% growth from 2024 (12% from 2025)
}

# Product categories with base daily order counts
CATEGORIES = [
    ("PVC Leather", 3.5),
    ("Upholstery Fabric", 3.0),
    ("Canvas & Tarpaulin", 2.5),
    ("Accessories", 2.0),
    ("Sheeting", 1.5),
    ("Carpet & Flooring", 1.5),
    ("Recliner", 1.0),
    ("Non Woven", 1.0),
]

SALES_CHANNELS = ["Direct", "Distributor", "Online", "Key Account"]
DELIVERY_STATUSES = ["Pending", "Shipped", "Delivered", "Cancelled"]
QUOTATION_STATUSES = ["Draft", "Active", "Completed", "Lost"]


def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def get_existing_data(conn):
    """Fetch existing master data"""
    cur = conn.cursor()

    # Get customers
    cur.execute("SELECT customer_id FROM sales_insights.customers")
    customers = [row[0] for row in cur.fetchall()]

    # Get products with their categories
    cur.execute("""
        SELECT product_id, product_name, product_category, unit_cost, unit_price
        FROM sales_insights.product_catalog
    """)
    products = cur.fetchall()

    # Get salespeople
    cur.execute("SELECT salesperson_id FROM sales_insights.salespeople")
    salespeople = [row[0] for row in cur.fetchall()]

    cur.close()
    return customers, products, salespeople


def generate_order_id(date, seq):
    """Generate unique order ID"""
    return f"ORD-{date.strftime('%Y%m%d')}-{seq:04d}"


def generate_quotation_id(date, seq):
    """Generate unique quotation ID"""
    return f"QUO-{date.strftime('%Y%m%d')}-{seq:04d}"


def is_weekend(date):
    return date.weekday() >= 5


def get_daily_order_count(date, base_count):
    """Calculate expected orders for a given date"""
    # Apply seasonal multiplier
    seasonal = SEASONAL_MULTIPLIERS.get(date.month, 1.0)

    # Apply YoY growth
    yoy = YOY_GROWTH.get(date.year, 1.0)

    # Weekend reduction (30% of normal)
    weekend_mult = 0.3 if is_weekend(date) else 1.0

    # Random variation (+/- 30%)
    variation = random.uniform(0.7, 1.3)

    count = base_count * seasonal * yoy * weekend_mult * variation
    return max(0, int(round(count)))


def generate_orders(conn, start_date, end_date, customers, products, salespeople):
    """Generate sales orders for date range"""
    cur = conn.cursor()

    # First, delete existing orders in date range
    print(f"Clearing existing orders from {start_date.date()} to {end_date.date()}...")
    cur.execute("""
        DELETE FROM sales_insights.sales_orders
        WHERE order_date >= %s AND order_date <= %s
    """, (start_date.date(), end_date.date()))

    current_date = start_date
    total_orders = 0
    order_seq = 0

    # Group products by category
    products_by_category = {}
    for p in products:
        cat = p[2]
        if cat not in products_by_category:
            products_by_category[cat] = []
        products_by_category[cat].append(p)

    print("Generating orders...")

    while current_date <= end_date:
        order_seq = 0

        for category, base_count in CATEGORIES:
            if category not in products_by_category:
                continue

            daily_count = get_daily_order_count(current_date, base_count)
            cat_products = products_by_category[category]

            for _ in range(daily_count):
                order_seq += 1
                order_id = generate_order_id(current_date, order_seq)

                # Select random product from category
                product = random.choice(cat_products)
                product_id, product_name, _, unit_cost, unit_price = product

                # Generate order details
                customer_id = random.choice(customers)
                salesperson_id = random.choice(salespeople)

                quantity = random.randint(5, 200)
                discount_rate = Decimal(str(random.choice([0, 0, 0, 5, 5, 10, 10, 15])))

                effective_price = unit_price * (1 - discount_rate / 100)
                revenue = effective_price * quantity
                profit = (unit_price - unit_cost) * quantity * (1 - discount_rate / 100)

                # Delivery status based on date
                days_ago = (datetime.now() - current_date).days
                if days_ago > 30:
                    status = random.choices(
                        ["Delivered", "Cancelled"],
                        weights=[95, 5]
                    )[0]
                elif days_ago > 7:
                    status = random.choices(
                        ["Delivered", "Shipped", "Cancelled"],
                        weights=[70, 25, 5]
                    )[0]
                elif days_ago > 0:
                    status = random.choices(
                        ["Shipped", "Pending", "Delivered"],
                        weights=[50, 40, 10]
                    )[0]
                else:  # Future orders
                    status = "Pending"

                sales_channel = random.choice(SALES_CHANNELS)

                # Some orders linked to quotations (will link later)
                quotation_id = None

                cur.execute("""
                    INSERT INTO sales_insights.sales_orders
                    (order_id, order_date, customer_id, product_category, product_name,
                     quantity, revenue_amount, currency, delivery_status, salesperson_id,
                     quotation_id, unit_price, unit_cost, gross_profit, discount_rate, sales_channel)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'MYR', %s::delivery_status_enum,
                            %s, %s, %s, %s, %s, %s, %s)
                """, (
                    order_id, current_date.date(), customer_id, category, product_name,
                    quantity, float(revenue), status, salesperson_id, quotation_id,
                    float(unit_price), float(unit_cost), float(profit), float(discount_rate),
                    sales_channel
                ))

                total_orders += 1

        # Progress indicator
        if current_date.day == 1:
            print(f"  {current_date.strftime('%Y-%m')}: generating...")

        current_date += timedelta(days=1)

    conn.commit()
    print(f"Generated {total_orders} orders")
    cur.close()
    return total_orders


def generate_quotations(conn, start_date, end_date, customers, products, salespeople):
    """Generate quotations for date range"""
    cur = conn.cursor()

    # Clear existing quotations in range
    print(f"Clearing existing quotations from {start_date.date()} to {end_date.date()}...")
    cur.execute("""
        DELETE FROM sales_insights.sales_quotations
        WHERE quotation_date >= %s AND quotation_date <= %s
    """, (start_date.date(), end_date.date()))

    current_date = start_date
    total_quotes = 0
    quote_seq = 0

    # Group products by category
    products_by_category = {}
    for p in products:
        cat = p[2]
        if cat not in products_by_category:
            products_by_category[cat] = []
        products_by_category[cat].append(p)

    print("Generating quotations...")

    while current_date <= end_date:
        quote_seq = 0

        # Quotations are ~40% of order volume
        for category, base_count in CATEGORIES:
            if category not in products_by_category:
                continue

            daily_count = int(get_daily_order_count(current_date, base_count * 0.4))
            cat_products = products_by_category[category]

            for _ in range(daily_count):
                quote_seq += 1
                quotation_id = generate_quotation_id(current_date, quote_seq)

                product = random.choice(cat_products)
                _, _, _, unit_cost, unit_price = product

                customer_id = random.choice(customers)
                salesperson_id = random.choice(salespeople)

                quantity = random.randint(10, 500)
                quoted_amount = unit_price * quantity
                estimated_margin = (unit_price - unit_cost) * quantity

                # Expected close date (7-60 days from quote)
                close_days = random.randint(7, 60)
                expected_close = current_date + timedelta(days=close_days)

                # Status based on expected close vs now
                days_past_close = (datetime.now() - expected_close).days

                if days_past_close > 30:
                    # Old quotes - mostly completed or lost
                    status = random.choices(
                        ["Completed", "Lost"],
                        weights=[65, 35]
                    )[0]
                    probability = 0.9 if status == "Completed" else 0.1
                elif days_past_close > 0:
                    # Recently expired
                    status = random.choices(
                        ["Completed", "Lost", "Active"],
                        weights=[50, 30, 20]
                    )[0]
                    probability = random.uniform(0.3, 0.7)
                elif days_past_close > -14:
                    # Due soon
                    status = random.choices(
                        ["Active", "Completed"],
                        weights=[70, 30]
                    )[0]
                    probability = random.uniform(0.5, 0.8)
                else:
                    # Future close dates
                    status = random.choices(
                        ["Draft", "Active"],
                        weights=[30, 70]
                    )[0]
                    probability = random.uniform(0.3, 0.6)

                cur.execute("""
                    INSERT INTO sales_insights.sales_quotations
                    (quotation_id, quotation_date, customer_id, product_category,
                     quoted_amount, currency, status, salesperson_id, expected_close_date,
                     estimated_margin, probability)
                    VALUES (%s, %s, %s, %s, %s, 'MYR', %s::quotation_status_enum,
                            %s, %s, %s, %s)
                """, (
                    quotation_id, current_date.date(), customer_id, category,
                    float(quoted_amount), status, salesperson_id, expected_close.date(),
                    float(estimated_margin), probability
                ))

                total_quotes += 1

        if current_date.day == 1:
            print(f"  {current_date.strftime('%Y-%m')}: generating...")

        current_date += timedelta(days=1)

    conn.commit()
    print(f"Generated {total_quotes} quotations")
    cur.close()
    return total_quotes


def generate_targets(conn, start_date, end_date, salespeople):
    """Generate monthly sales targets"""
    cur = conn.cursor()

    print("Generating sales targets...")

    # Clear existing targets in range
    cur.execute("""
        DELETE FROM sales_insights.sales_targets
        WHERE target_date >= %s AND target_date <= %s
    """, (start_date.date(), end_date.date()))

    # Base monthly company target
    BASE_MONTHLY_TARGET = 400000  # MYR

    current_date = start_date.replace(day=1)

    while current_date <= end_date:
        # Apply seasonal and YoY multipliers
        seasonal = SEASONAL_MULTIPLIERS.get(current_date.month, 1.0)
        yoy = YOY_GROWTH.get(current_date.year, 1.0)

        monthly_target = BASE_MONTHLY_TARGET * seasonal * yoy

        # Company-wide target
        cur.execute("""
            INSERT INTO sales_insights.sales_targets
            (target_date, granularity, entity_id, target_amount)
            VALUES (%s, 'company', 'ALL', %s)
        """, (current_date.date(), monthly_target))

        # Category targets (proportional)
        for category, weight in CATEGORIES:
            cat_target = monthly_target * (weight / sum(w for _, w in CATEGORIES))
            cur.execute("""
                INSERT INTO sales_insights.sales_targets
                (target_date, granularity, entity_id, target_amount)
                VALUES (%s, 'category', %s, %s)
            """, (current_date.date(), category, cat_target))

        # Salesperson targets
        sp_target = monthly_target / len(salespeople)
        for sp_id in salespeople:
            # Add some variation per salesperson
            individual_target = sp_target * random.uniform(0.8, 1.2)
            cur.execute("""
                INSERT INTO sales_insights.sales_targets
                (target_date, granularity, entity_id, target_amount)
                VALUES (%s, 'salesperson', %s, %s)
            """, (current_date.date(), sp_id, individual_target))

        # Move to next month
        if current_date.month == 12:
            current_date = current_date.replace(year=current_date.year + 1, month=1)
        else:
            current_date = current_date.replace(month=current_date.month + 1)

    conn.commit()
    print("Generated sales targets")
    cur.close()


def generate_inventory_snapshots(conn, products):
    """Generate weekly inventory snapshots"""
    cur = conn.cursor()

    print("Generating inventory snapshots...")

    # Clear existing snapshots
    cur.execute("DELETE FROM sales_insights.inventory_snapshots")

    # Generate weekly snapshots for last 12 weeks
    for weeks_ago in range(12, -1, -1):
        snapshot_date = datetime.now() - timedelta(weeks=weeks_ago)
        snapshot_date = snapshot_date.replace(hour=0, minute=0, second=0, microsecond=0)

        for product in products:
            product_id = product[0]

            # Random stock levels
            stock_on_hand = random.randint(50, 500)
            reserved_units = random.randint(0, min(50, stock_on_hand))
            inbound_units = random.randint(0, 100) if random.random() > 0.7 else 0

            cur.execute("""
                INSERT INTO sales_insights.inventory_snapshots
                (snapshot_date, product_id, stock_on_hand, reserved_units, inbound_units)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (snapshot_date, product_id) DO UPDATE
                SET stock_on_hand = EXCLUDED.stock_on_hand,
                    reserved_units = EXCLUDED.reserved_units,
                    inbound_units = EXCLUDED.inbound_units
            """, (snapshot_date.date(), product_id, stock_on_hand, reserved_units, inbound_units))

    conn.commit()
    print("Generated inventory snapshots")
    cur.close()


def generate_forecasts(conn):
    """Generate sales forecasts"""
    cur = conn.cursor()

    print("Generating sales forecasts...")

    # Clear existing forecasts
    cur.execute("DELETE FROM sales_insights.sales_forecasts")

    horizons = ["Current Month", "Next Month", "60-90 Day Outlook"]

    for category, weight in CATEGORIES:
        base_revenue = 50000 * weight
        base_margin = base_revenue * 0.35

        for i, horizon in enumerate(horizons):
            # Forecasts decrease in certainty with time
            multiplier = 1.0 + (i * 0.1)
            variation = random.uniform(0.9, 1.1)

            cur.execute("""
                INSERT INTO sales_insights.sales_forecasts
                (forecast_date, horizon, product_category, predicted_revenue, predicted_margin)
                VALUES (CURRENT_DATE, %s, %s, %s, %s)
            """, (
                horizon, category,
                base_revenue * multiplier * variation,
                base_margin * multiplier * variation
            ))

    conn.commit()
    print("Generated sales forecasts")
    cur.close()


def main():
    print("="*60)
    print("EPB Extended Data Seeding")
    print(f"Date Range: {START_DATE.date()} to {END_DATE.date()}")
    print("="*60)

    conn = get_connection()

    try:
        # Get existing master data
        customers, products, salespeople = get_existing_data(conn)
        print(f"Found: {len(customers)} customers, {len(products)} products, {len(salespeople)} salespeople")

        # Generate orders
        order_count = generate_orders(conn, START_DATE, END_DATE, customers, products, salespeople)

        # Generate quotations
        quote_count = generate_quotations(conn, START_DATE, END_DATE, customers, products, salespeople)

        # Generate targets
        generate_targets(conn, START_DATE, END_DATE, salespeople)

        # Generate inventory snapshots
        generate_inventory_snapshots(conn, products)

        # Generate forecasts
        generate_forecasts(conn)

        print("\n" + "="*60)
        print("Summary:")
        print(f"  Orders generated: {order_count:,}")
        print(f"  Quotations generated: {quote_count:,}")
        print(f"  Date range: {START_DATE.date()} to {END_DATE.date()}")
        print("="*60)

    finally:
        conn.close()


if __name__ == "__main__":
    main()
