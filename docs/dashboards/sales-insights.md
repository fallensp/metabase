# Sales Insights Dashboard Guidelines

## UI-First Design Checklist

- Establish hero KPI tiles with consistent typography and spacing.
- Apply brand color palette across charts and tables for visual cohesion.
- Ensure filter controls remain visible without scrolling on standard laptop resolutions.

## Daily Sales Health

- Source data loads from the PostgreSQL instance configured in `database.txt`; refresh seed scripts before demos.
- Prior-day order count tile should highlight absolute volume and trend arrow against the trailing 7-day average.
- Daily revenue trend chart overlays actual revenue with the 7-day moving average to quickly flag anomalies.
- Drill-level metrics such as gross profit, sales channel, and discount rate are available in `sales_insights.sales_orders` for custom cards (AOV, margin mix, channel split).

## Quotation Pipeline

- Ensure `03_seed_sales_quotations.sql` has been executed against the `database.txt` connection before reviewing.
- Use the status bar chart to discuss value distribution across Draft, Active, Completed, and Lost states.
- The top customers table spotlights pipeline concentration—encourage marketing to cross-reference upcoming campaigns.
- The `sales_targets` table enables variance-to-target visuals by category or salesperson; link with pipeline status for performance reviews.

## Quote-to-Order Conversion

- Run `02_seed_sales_orders.sql` again after updating linked quotations to keep conversion data fresh in the `database.txt` environment.
- The conversion rate line chart should stay in the 0.2–0.6 band for most categories; investigate outliers that fall outside.
- Use the order value bar chart to highlight which categories contribute the most revenue from converted quotations.
- Surface predicted values from `sales_forecasts` for forward-looking commentary and coordinate with `inventory_snapshots` to flag supply risks.
