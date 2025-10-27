# Quickstart: Sample Metabase Dashboard for Sales Metrics

## Prerequisites
- PostgreSQL instance accessible to Metabase
- Metabase admin access with permission to create dashboards and models
- Spreadsheet `Data_visualization_metrics_20251021.xlsx` for metric reference
- SQL client capable of running seed scripts

## Setup Steps
1. **Create schema**
   - Extract host, user, password, and database values from `database.txt`.
   - Connect to PostgreSQL and create schema `sales_insights` (or reuse analytics schema).
   - Define tables using the structures in `data/seeds/sales_dashboard/01_schema.sql`.
2. **Seed mock data**
   - Execute `02_seed_sales_orders.sql` followed by `03_seed_sales_quotations.sql` using the credentials from `database.txt`:<br>`PGPASSWORD=<password> psql --host=<host> --username=<user> --dbname=<database> --file=data/seeds/sales_dashboard/02_seed_sales_orders.sql`
   - Rerun `02_seed_sales_orders.sql` after updating quotations to maintain linked conversion metrics.
   - Optionally load CSV fixtures with `COPY` commands if large sample volumes are required.
3. **Validate totals**
   - Run `data/seeds/sales_dashboard/04_validation.sql` against the connection in `database.txt` to confirm order/quotation counts and revenue match the planned targets and category mix.
4. **Configure Metabase connection**
   - In Metabase admin, add the PostgreSQL source pointing to the seeded schema.
   - Sync the database and scan field values to enable category filters.
5. **Import dashboard**
   - Use Metabase "Browse → Collections → New" to create `Sales Insights` collection.
   - Import JSON exports from `metabase/dashboards/sales-insights/` (cards and dashboard layout).
6. **Apply UI polish**
   - Adjust color palette to align with brand guidelines.
   - Add descriptions to each card highlighting key insight questions.
7. **Run validation walkthrough**
   - Follow the checklist in `docs/dashboards/sales-insights.md` to ensure all three categories (Daily Sales Health, Quotation Pipeline, Quote-to-Order Conversion) render correctly and respond to filters within 5 seconds.
   - Review supporting tables (`sales_targets`, `inventory_snapshots`, `sales_forecasts`) for advanced visuals like target attainment, stock risk, and predictive insights.

## Testing / Sign-off
- Compare dashboard KPI tiles to SQL validation outputs (documented in validation script comments).
- Collect stakeholder feedback focused on clarity and visual appeal; target average rating ≥ 4/5 for polish.
