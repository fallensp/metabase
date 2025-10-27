# Sales Dashboard Seed Data

## Connection
- Use credentials stored in `database.txt` when running any SQL script.
- Example command:
  ```bash
  PGPASSWORD=$(grep -E '^password' database.txt | cut -d'=' -f2 | xargs) \
  psql --host=$(grep -E '^host' database.txt | cut -d'=' -f2 | xargs) \
       --username=$(grep -E '^user' database.txt | cut -d'=' -f2 | xargs) \
       --dbname=$(grep -E '^database' database.txt | cut -d'=' -f2 | xargs)
  ```

## Script Overview
- `01_schema.sql` — Creates schema, enum types, and core tables plus supporting entities (`product_catalog`, `sales_targets`, `inventory_snapshots`, `sales_forecasts`).
- `02_seed_sales_orders.sql` — Generates ~6 months of enriched order history (unit price, cost, margin, channel) and populates targets, inventory, and forecasts aligned to workbook categories.
- `03_seed_sales_quotations.sql` — Seeds 720 quotations across Draft, Active, Completed, and Lost statuses with probability and margin estimates, balanced by product category.
- `04_validation.sql` — Provides sanity queries for daily performance, pipeline distribution, and conversion metrics.

## Execution Notes
- Run schema script first, followed by `02` and `03`. Re-run `02` if quotation data changes to refresh conversion links and supporting tables.
- Validation queries assume the schema name `sales_insights`; update scripts if a different schema is required.
- All scripts are idempotent—`TRUNCATE` statements prepare tables for reseeding before inserts.
