#!/usr/bin/env python3
"""
Metabase Dashboard Creation Script for EPB Sales Demo
Creates a visually appealing demo dashboard via Metabase API

Usage:
    python create_metabase_dashboard.py --email admin@example.com --password yourpass
"""

import requests
import argparse
import sys
import time
import os

METABASE_URL = "http://localhost:3000"

# Color palette
COLORS = {
    "primary": "#005F73",
    "secondary": "#0A9396",
    "accent1": "#94D2BD",
    "accent2": "#E9D8A6",
    "accent3": "#EE9B00",
    "accent4": "#CA6702",
    "accent5": "#BB3E03",
    "accent6": "#AE2012",
}

# Category colors for consistent charts
CATEGORY_COLORS = {
    "PVC Leather": "#005F73",
    "Upholstery Fabric": "#0A9396",
    "Canvas & Tarpaulin": "#94D2BD",
    "Accessories": "#E9D8A6",
    "Sheeting": "#EE9B00",
    "Carpet & Flooring": "#CA6702",
    "Recliner": "#BB3E03",
    "Non Woven": "#AE2012",
}


class MetabaseAPI:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session_token = None
        self.database_id = None

    def authenticate(self, email, password):
        """Get session token from Metabase"""
        response = requests.post(
            f"{self.base_url}/api/session",
            json={"username": email, "password": password}
        )
        if response.status_code != 200:
            raise Exception(f"Authentication failed: {response.text}")
        self.session_token = response.json()["id"]
        print(f"✓ Authenticated successfully")
        return self.session_token

    def _headers(self):
        return {"X-Metabase-Session": self.session_token}

    def get_databases(self):
        """List all databases"""
        response = requests.get(
            f"{self.base_url}/api/database",
            headers=self._headers()
        )
        return response.json()["data"]

    def find_database(self, name_contains="epb"):
        """Find database by partial name match"""
        databases = self.get_databases()
        for db in databases:
            if name_contains.lower() in db["name"].lower():
                self.database_id = db["id"]
                print(f"✓ Found database: {db['name']} (ID: {db['id']})")
                return db["id"]
        # If no match, use first non-sample database
        for db in databases:
            if "sample" not in db["name"].lower():
                self.database_id = db["id"]
                print(f"✓ Using database: {db['name']} (ID: {db['id']})")
                return db["id"]
        raise Exception("No suitable database found")

    def create_collection(self, name, color="#509EE3"):
        """Create a collection to organize dashboards"""
        response = requests.post(
            f"{self.base_url}/api/collection",
            headers=self._headers(),
            json={"name": name, "color": color}
        )
        if response.status_code == 200:
            collection_id = response.json()["id"]
            print(f"✓ Created collection: {name} (ID: {collection_id})")
            return collection_id
        else:
            print(f"  Collection may already exist, continuing...")
            # Try to find existing collection
            collections = requests.get(
                f"{self.base_url}/api/collection",
                headers=self._headers()
            ).json()
            for c in collections:
                if c.get("name") == name:
                    return c["id"]
            return None

    def create_card(self, name, query, display_type, vis_settings=None, description=None):
        """Create a question/card"""
        payload = {
            "name": name,
            "display": display_type,
            "dataset_query": {
                "type": "native",
                "native": {"query": query},
                "database": self.database_id
            },
            "visualization_settings": vis_settings or {}
        }
        # Only include description if it's a non-empty string
        if description:
            payload["description"] = description
        response = requests.post(
            f"{self.base_url}/api/card",
            headers=self._headers(),
            json=payload
        )
        if response.status_code == 200:
            card_id = response.json()["id"]
            print(f"  ✓ Created card: {name} (ID: {card_id})")
            return card_id
        else:
            print(f"  ✗ Failed to create card {name}: {response.text}")
            return None

    def create_dashboard(self, name, description="", collection_id=None):
        """Create a dashboard"""
        payload = {
            "name": name,
            "description": description,
        }
        if collection_id:
            payload["collection_id"] = collection_id

        response = requests.post(
            f"{self.base_url}/api/dashboard",
            headers=self._headers(),
            json=payload
        )
        if response.status_code == 200:
            dashboard_id = response.json()["id"]
            print(f"✓ Created dashboard: {name} (ID: {dashboard_id})")
            return dashboard_id
        else:
            print(f"✗ Failed to create dashboard: {response.text}")
            return None

    def update_dashboard_cards(self, dashboard_id, cards_layout):
        """Update dashboard with all cards at once (Metabase v0.50+)"""
        dashcards = []
        for idx, (card_id, row, col, size_x, size_y) in enumerate(cards_layout):
            if card_id:
                dashcards.append({
                    "id": -(idx + 1),  # Negative ID for new cards
                    "card_id": card_id,
                    "row": row,
                    "col": col,
                    "size_x": size_x,
                    "size_y": size_y
                })

        response = requests.put(
            f"{self.base_url}/api/dashboard/{dashboard_id}",
            headers=self._headers(),
            json={"dashcards": dashcards}
        )
        if response.status_code == 200:
            added = len(response.json().get("dashcards", []))
            print(f"  ✓ Added {added} cards to dashboard")
            return True
        else:
            print(f"  ✗ Failed to update dashboard: {response.text}")
            return False

    def add_text_card(self, dashboard_id, text, row, col, size_x, size_y):
        """Add a text/heading card to dashboard"""
        payload = {
            "cardId": None,
            "row": row,
            "col": col,
            "size_x": size_x,
            "size_y": size_y,
            "visualization_settings": {
                "virtual_card": {
                    "name": None,
                    "display": "text",
                    "visualization_settings": {},
                    "dataset_query": {},
                    "archived": False
                },
                "text": text
            }
        }
        response = requests.post(
            f"{self.base_url}/api/dashboard/{dashboard_id}/cards",
            headers=self._headers(),
            json=payload
        )
        return response.status_code == 200


def create_demo_dashboard(api):
    """Create the complete demo dashboard with all cards"""

    # Create collection
    collection_id = api.create_collection("EPB Sales Demo", "#0A9396")

    # Create main dashboard
    dashboard_id = api.create_dashboard(
        name="EPB Sales Insights Demo",
        description="Executive dashboard showcasing sales performance, product analytics, and customer insights from KINTEX data",
        collection_id=collection_id
    )

    if not dashboard_id:
        print("Failed to create dashboard, exiting")
        return

    print("\n--- Creating Executive Overview Cards ---")

    # Card 1: Total Revenue (Big Number)
    card1 = api.create_card(
        name="Total Revenue",
        query="""
SELECT SUM(revenue_amount) AS total_revenue
FROM sales_insights.sales_orders
WHERE order_date >= '2025-06-01';
        """.strip(),
        display_type="scalar",
        vis_settings={
            "column_settings": {
                '["name","total_revenue"]': {
                    "prefix": "MYR ",
                    "number_style": "decimal",
                    "decimals": 0
                }
            }
        },
        description="Total revenue from all orders since June 2025"
    )

    # Card 2: Order Count
    card2 = api.create_card(
        name="Total Orders",
        query="""
SELECT COUNT(DISTINCT order_id) AS total_orders
FROM sales_insights.sales_orders
WHERE order_date >= '2025-06-01';
        """.strip(),
        display_type="scalar",
        vis_settings={
            "column_settings": {
                '["name","total_orders"]': {
                    "suffix": " orders",
                    "number_style": "decimal",
                    "decimals": 0
                }
            }
        }
    )

    # Card 3: Average Order Value
    card3 = api.create_card(
        name="Average Order Value",
        query="""
SELECT ROUND(SUM(revenue_amount) / COUNT(DISTINCT order_id), 2) AS avg_order_value
FROM sales_insights.sales_orders
WHERE order_date >= '2025-06-01';
        """.strip(),
        display_type="scalar",
        vis_settings={
            "column_settings": {
                '["name","avg_order_value"]': {
                    "prefix": "MYR ",
                    "number_style": "decimal",
                    "decimals": 2
                }
            }
        }
    )

    # Card 4: Gross Margin %
    card4 = api.create_card(
        name="Gross Profit Margin",
        query="""
SELECT ROUND(SUM(gross_profit) / NULLIF(SUM(revenue_amount), 0) * 100, 1) AS margin_pct
FROM sales_insights.sales_orders
WHERE order_date >= '2025-06-01';
        """.strip(),
        display_type="scalar",
        vis_settings={
            "column_settings": {
                '["name","margin_pct"]': {
                    "suffix": "%",
                    "number_style": "decimal",
                    "decimals": 1
                }
            }
        }
    )

    # Card 5: Monthly Revenue Trend (Line Chart)
    card5 = api.create_card(
        name="Monthly Revenue & Profit Trend",
        query="""
SELECT
    DATE_TRUNC('month', order_date)::date AS month,
    SUM(revenue_amount) AS revenue,
    SUM(gross_profit) AS profit
FROM sales_insights.sales_orders
WHERE order_date >= '2025-06-01'
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month;
        """.strip(),
        display_type="line",
        vis_settings={
            "graph.dimensions": ["month"],
            "graph.metrics": ["revenue", "profit"],
            "graph.x_axis.title_text": "Month",
            "graph.y_axis.title_text": "Amount (MYR)",
            "graph.colors": [COLORS["secondary"], COLORS["accent3"]],
            "graph.show_values": False
        }
    )

    # Card 6: Top 5 Salespeople (Horizontal Bar)
    card6 = api.create_card(
        name="Top 5 Sales Representatives",
        query="""
SELECT
    sp.salesperson_name,
    SUM(o.revenue_amount) AS revenue
FROM sales_insights.sales_orders o
JOIN sales_insights.salespeople sp ON o.salesperson_id = sp.salesperson_id
WHERE o.order_date >= '2025-06-01'
GROUP BY sp.salesperson_name
ORDER BY revenue DESC
LIMIT 5;
        """.strip(),
        display_type="bar",
        vis_settings={
            "graph.dimensions": ["salesperson_name"],
            "graph.metrics": ["revenue"],
            "graph.x_axis.title_text": "Revenue (MYR)",
            "graph.colors": [COLORS["primary"]],
            "graph.show_values": True
        }
    )

    print("\n--- Creating Product Performance Cards ---")

    # Card 7: Revenue by Category (Pie/Donut)
    card7 = api.create_card(
        name="Revenue by Product Category",
        query="""
SELECT
    product_category,
    SUM(revenue_amount) AS revenue
FROM sales_insights.sales_orders
WHERE order_date >= '2025-06-01'
GROUP BY product_category
ORDER BY revenue DESC;
        """.strip(),
        display_type="pie",
        vis_settings={
            "pie.show_legend": True,
            "pie.percent_visibility": "inside",
            "pie.show_total": True
        }
    )

    # Card 8: Margin by Category (Bar Chart)
    card8 = api.create_card(
        name="Profit Margin by Category",
        query="""
SELECT
    product_category,
    ROUND(SUM(gross_profit) / NULLIF(SUM(revenue_amount), 0) * 100, 1) AS margin_pct
FROM sales_insights.sales_orders
WHERE order_date >= '2025-06-01'
GROUP BY product_category
ORDER BY margin_pct DESC;
        """.strip(),
        display_type="bar",
        vis_settings={
            "graph.dimensions": ["product_category"],
            "graph.metrics": ["margin_pct"],
            "graph.x_axis.title_text": "Margin %",
            "graph.colors": [COLORS["accent3"]],
            "graph.show_values": True
        }
    )

    # Card 9: Top Products Table
    card9 = api.create_card(
        name="Top 10 Products by Revenue",
        query="""
SELECT
    product_name,
    product_category,
    COUNT(DISTINCT order_id) AS orders,
    SUM(quantity) AS units_sold,
    SUM(revenue_amount) AS revenue
FROM sales_insights.sales_orders
WHERE order_date >= '2025-06-01'
GROUP BY product_name, product_category
ORDER BY revenue DESC
LIMIT 10;
        """.strip(),
        display_type="table",
        vis_settings={
            "column_settings": {
                '["name","revenue"]': {"prefix": "MYR ", "decimals": 0}
            }
        }
    )

    # Card 10: Sales Channel Mix
    card10 = api.create_card(
        name="Revenue by Sales Channel",
        query="""
SELECT
    sales_channel,
    SUM(revenue_amount) AS revenue
FROM sales_insights.sales_orders
WHERE order_date >= '2025-06-01'
GROUP BY sales_channel
ORDER BY revenue DESC;
        """.strip(),
        display_type="bar",
        vis_settings={
            "graph.dimensions": ["sales_channel"],
            "graph.metrics": ["revenue"],
            "graph.colors": [COLORS["secondary"]],
            "graph.show_values": True
        }
    )

    print("\n--- Creating Customer & Pipeline Cards ---")

    # Card 11: Top Customers
    card11 = api.create_card(
        name="Top 10 Customers by Revenue",
        query="""
SELECT
    c.customer_name,
    c.customer_segment,
    SUM(o.revenue_amount) AS revenue,
    COUNT(DISTINCT o.order_id) AS order_count
FROM sales_insights.sales_orders o
JOIN sales_insights.customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= '2025-06-01'
GROUP BY c.customer_name, c.customer_segment
ORDER BY revenue DESC
LIMIT 10;
        """.strip(),
        display_type="table",
        vis_settings={
            "column_settings": {
                '["name","revenue"]': {"prefix": "MYR ", "decimals": 0}
            }
        }
    )

    # Card 12: Revenue by Segment (Pie)
    card12 = api.create_card(
        name="Revenue by Customer Segment",
        query="""
SELECT
    c.customer_segment,
    SUM(o.revenue_amount) AS revenue
FROM sales_insights.sales_orders o
JOIN sales_insights.customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= '2025-06-01'
GROUP BY c.customer_segment
ORDER BY revenue DESC;
        """.strip(),
        display_type="pie",
        vis_settings={
            "pie.show_legend": True,
            "pie.percent_visibility": "inside"
        }
    )

    # Card 13: Revenue by Region
    card13 = api.create_card(
        name="Revenue by Region",
        query="""
SELECT
    c.region,
    SUM(o.revenue_amount) AS revenue,
    COUNT(DISTINCT c.customer_id) AS customers
FROM sales_insights.sales_orders o
JOIN sales_insights.customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= '2025-06-01'
GROUP BY c.region
ORDER BY revenue DESC;
        """.strip(),
        display_type="bar",
        vis_settings={
            "graph.dimensions": ["region"],
            "graph.metrics": ["revenue"],
            "graph.colors": [COLORS["primary"]],
            "graph.show_values": True
        }
    )

    # Card 14: Quotation Pipeline
    card14 = api.create_card(
        name="Quotation Pipeline by Status",
        query="""
SELECT
    status,
    COUNT(*) AS quote_count,
    SUM(quoted_amount) AS total_value
FROM sales_insights.sales_quotations
WHERE quotation_date >= '2025-06-01'
GROUP BY status
ORDER BY
    CASE status
        WHEN 'Draft' THEN 1
        WHEN 'Active' THEN 2
        WHEN 'Completed' THEN 3
        WHEN 'Lost' THEN 4
    END;
        """.strip(),
        display_type="bar",
        vis_settings={
            "graph.dimensions": ["status"],
            "graph.metrics": ["total_value"],
            "graph.x_axis.title_text": "Status",
            "graph.y_axis.title_text": "Quote Value (MYR)",
            "graph.colors": [COLORS["accent4"]],
            "graph.show_values": True
        }
    )

    # Card 15: Quote-to-Order Conversion
    card15 = api.create_card(
        name="Quote-to-Order Conversion by Category",
        query="""
WITH quotes AS (
    SELECT product_category, COUNT(DISTINCT quotation_id) AS quote_count
    FROM sales_insights.sales_quotations
    WHERE quotation_date >= '2025-06-01'
    GROUP BY product_category
),
orders AS (
    SELECT product_category, COUNT(DISTINCT order_id) AS converted_orders
    FROM sales_insights.sales_orders
    WHERE quotation_id IS NOT NULL AND order_date >= '2025-06-01'
    GROUP BY product_category
)
SELECT
    q.product_category,
    q.quote_count AS quotations,
    COALESCE(o.converted_orders, 0) AS converted,
    ROUND(COALESCE(o.converted_orders, 0)::numeric / NULLIF(q.quote_count, 0) * 100, 1) AS conversion_pct
FROM quotes q
LEFT JOIN orders o ON q.product_category = o.product_category
ORDER BY conversion_pct DESC NULLS LAST;
        """.strip(),
        display_type="table",
        vis_settings={
            "column_settings": {
                '["name","conversion_pct"]': {"suffix": "%", "decimals": 1}
            }
        }
    )

    # Card 16: Daily Orders (Sparkline style)
    card16 = api.create_card(
        name="Daily Order Volume (Last 30 Days)",
        query="""
SELECT
    order_date::date AS date,
    COUNT(*) AS orders,
    SUM(revenue_amount) AS revenue
FROM sales_insights.sales_orders
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY order_date::date
ORDER BY date;
        """.strip(),
        display_type="line",
        vis_settings={
            "graph.dimensions": ["date"],
            "graph.metrics": ["orders"],
            "graph.colors": [COLORS["secondary"]],
            "graph.show_values": False
        }
    )

    print("\n--- Adding Cards to Dashboard ---")

    # Layout: 18-column grid (Metabase default width)
    # Spacious layout for visual impact
    cards_layout = [
        # ===== EXECUTIVE OVERVIEW SECTION =====
        # Row 0-3: Hero KPI cards - large and prominent
        (card1, 0, 0, 6, 4),     # Total Revenue - BIG hero metric
        (card2, 0, 6, 6, 4),     # Order Count
        (card3, 0, 12, 6, 4),    # AOV

        # Row 4-7: Second row KPIs + key metric
        (card4, 4, 0, 6, 4),     # Margin %
        (card16, 4, 6, 12, 4),   # Daily Orders - wide sparkline

        # Row 8-15: Main trend chart - full width hero
        (card5, 8, 0, 18, 8),    # Monthly Trend - FULL WIDTH

        # Row 16-23: Salespeople + Category breakdown
        (card6, 16, 0, 9, 8),    # Top Salespeople - half width
        (card7, 16, 9, 9, 8),    # Category Pie - half width

        # ===== PRODUCT PERFORMANCE SECTION =====
        # Row 24-31: Margin analysis
        (card8, 24, 0, 9, 8),    # Margin Bar
        (card10, 24, 9, 9, 8),   # Channel Mix

        # Row 32-41: Products table - full width for readability
        (card9, 32, 0, 18, 10),  # Products Table - FULL WIDTH

        # ===== CUSTOMER & PIPELINE SECTION =====
        # Row 42-51: Customer insights
        (card11, 42, 0, 12, 10), # Top Customers - prominent
        (card12, 42, 12, 6, 5),  # Segment Pie
        (card13, 47, 12, 6, 5),  # Region Bar

        # Row 52-59: Pipeline analysis
        (card14, 52, 0, 9, 8),   # Pipeline Status
        (card15, 52, 9, 9, 8),   # Conversion Table
    ]

    # Add all cards to dashboard in one API call
    api.update_dashboard_cards(dashboard_id, cards_layout)

    print(f"\n{'='*60}")
    print(f"✓ Dashboard created successfully!")
    print(f"{'='*60}")
    print(f"\nView your dashboard at: {METABASE_URL}/dashboard/{dashboard_id}")
    print(f"Collection: {METABASE_URL}/collection/{collection_id}")

    return dashboard_id


def main():
    parser = argparse.ArgumentParser(description="Create Metabase demo dashboard")
    parser.add_argument("--email", required=True, help="Metabase admin email")
    parser.add_argument("--password", required=False, help="Metabase admin password (will prompt if not provided)")
    args = parser.parse_args()

    print("="*60)
    print("Metabase Demo Dashboard Creator")
    print("="*60)

    # Get password from args or environment variable
    password = args.password or os.environ.get("METABASE_PASSWORD")
    if not password:
        print("Error: Password required. Provide via --password or METABASE_PASSWORD env var")
        sys.exit(1)

    api = MetabaseAPI(METABASE_URL)

    try:
        # Authenticate
        api.authenticate(args.email, password)

        # Find database
        api.find_database("epb")

        # Create dashboard
        create_demo_dashboard(api)

    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
