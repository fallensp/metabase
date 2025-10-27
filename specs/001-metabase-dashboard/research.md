# Phase 0 Research: Sample Metabase Dashboard for Sales Metrics

## Decision 1: Seed mock data using PostgreSQL SQL scripts sourced from spreadsheet metrics
- **Decision**: Generate mock sales order and quotation records via SQL insert scripts (or CSV + COPY) targeting a PostgreSQL schema that mirrors key fields from `Data_visualization_metrics_20251021.xlsx`.
- **Rationale**: PostgreSQL is commonly paired with Metabase; SQL seeding ensures deterministic mock datasets that can be version-controlled and replayed. Aligning schema with spreadsheet metrics supports accurate aggregations for sales and product insights.
- **Alternatives considered**:
  - Metabase sample dataset: rejected because it does not reflect custom product categories or sales stages.
  - Application-level seeding scripts (Python, Node): rejected to keep setup lightweight and transparent for analysts without engineering support.

## Decision 2: Prioritize UI-first dashboard layout with category-focused tabs and summary tiles
- **Decision**: Structure the Metabase dashboard as three primary sections (Daily Sales Health, Quotation Pipeline, Quote-to-Order Conversion) with hero KPI tiles, supporting trend charts, and product/category breakdown visuals emphasising aesthetics (consistent color palette, spacing, annotations).
- **Rationale**: The user explicitly requested a UI-first, visually appealing dashboard that highlights sales and product insights. Organizing content into focused sections prevents clutter and enables product storytelling.
- **Alternatives considered**:
  - Single long scrolling dashboard: rejected because it overwhelms users and dilutes emphasis on key product insights.
  - Raw table-first views: rejected because it fails the "looks nice" expectation and slows decision-making.

## Decision 3: Use Metabase native features (segmented filters, custom expressions) for interactive exploration
- **Decision**: Leverage Metabase’s native filters (date picker, product category selector) and custom expressions to compute trailing averages and conversion percentages directly in the UI.
- **Rationale**: Native features avoid custom coding, support rapid iteration, and keep the dashboard maintainable by analysts. They also ensure filter interactions apply across cards without extra engineering effort.
- **Alternatives considered**:
  - Precomputed materialized views: deferred because the dataset is mock and lightweight; adds unnecessary maintenance.
  - Embedding external BI or custom front-end: rejected as it conflicts with the Metabase requirement and increases build time.

## Decision 4: Validate dashboard accuracy with SQL sanity checks and manual review playbook
- **Decision**: Pair dashboard creation with a validation checklist that cross-verifies card totals against SQL queries and ensures visual polish (legend usage, color consistency, annotation completeness).
- **Rationale**: Ensures mock data remains credible and the dashboard meets the UI-first quality bar. Also provides repeatable QA steps.
- **Alternatives considered**:
  - Rely solely on visual inspection: rejected due to risk of unnoticed calculation errors.
  - Automated testing framework: unnecessary overhead for a mock dataset and one-off dashboard.
