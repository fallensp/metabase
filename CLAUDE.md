# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Metabase dashboard project for sales metrics visualization. The project contains PostgreSQL seed data scripts and Metabase dashboard configuration exports. The metrics source is the spreadsheet `Data_visualization_metrics_20251021.xlsx`.

## Database Commands

Database credentials are stored in `database.txt`. Connect using:
```bash
PGPASSWORD=$(grep -E '^password' database.txt | cut -d'=' -f2 | xargs) \
psql --host=$(grep -E '^host' database.txt | cut -d'=' -f2 | xargs) \
     --username=$(grep -E '^user' database.txt | cut -d'=' -f2 | xargs) \
     --dbname=$(grep -E '^database' database.txt | cut -d'=' -f2 | xargs)
```

Run seed scripts in order:
1. `data/seeds/sales_dashboard/01_schema.sql` - Creates schema and tables
2. `data/seeds/sales_dashboard/02_seed_sales_orders.sql` - Seeds order data
3. `data/seeds/sales_dashboard/03_seed_sales_quotations.sql` - Seeds quotation data
4. `data/seeds/sales_dashboard/04_validation.sql` - Validates data integrity

All seed scripts are idempotent (use TRUNCATE before inserts).

## Architecture

### Database Schema (`sales_insights`)

Core tables:
- `sales_orders` - Confirmed purchases with revenue, quantity, delivery status, margin data
- `sales_quotations` - Proposals with status (Draft/Active/Completed/Lost), probability, margin estimates
- `customers` - Customer master with segment, region, credit info
- `salespeople` - Sales rep master with territory and department
- `product_catalog` - Products with cost/price, lifecycle stage, category

Supporting tables:
- `sales_targets` - Target amounts by date, granularity (company/category/salesperson)
- `inventory_snapshots` - Daily stock positions
- `sales_forecasts` - Predicted revenue/margin by category

### Dashboard Categories

Three main dashboard views in `metabase/dashboards/sales-insights/`:
1. **Daily Sales Health** - Prior-day order count, revenue, 7-day trends
2. **Quotation Pipeline** - Value by status (Draft/Active/Completed/Lost), customer concentration
3. **Quote-to-Order Conversion** - Conversion rates by category, value tracking

### Key Enums
- `delivery_status_enum`: Pending, Shipped, Delivered, Cancelled
- `quotation_status_enum`: Draft, Active, Completed, Lost

## File Organization

- `data/seeds/sales_dashboard/` - SQL seed scripts
- `metabase/dashboards/sales-insights/` - Dashboard JSON exports for Metabase import
- `specs/001-metabase-dashboard/` - Feature specification documents
- `docs/dashboards/` - Dashboard usage guidelines
