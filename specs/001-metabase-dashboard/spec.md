# Feature Specification: Sample Metabase Dashboard for Sales Metrics

**Feature Branch**: `001-metabase-dashboard`  
**Created**: 2025-10-27  
**Status**: Draft  
**Input**: User description: "seed mock data into database, create a sample dashboard using metabase based on metrics Data visualization_metrics_20251021.xlsx , just implmenet 2-3 category. sample data reference [sales order.png 1363x639] [Quotation.png 2826x677]"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review Daily Sales Health (Priority: P1)

A sales manager wants to open the dashboard each morning to understand prior-day order volume and revenue trends using the seeded sample data.

**Why this priority**: This view establishes the baseline value of the dashboard, enabling leadership to gauge whether the data seeding and key metrics deliver immediate insight.

**Independent Test**: Can be fully tested by loading the dashboard with seeded data and confirming the manager can answer "How many orders and how much revenue did we book yesterday?" without additional tools.

**Acceptance Scenarios**:

1. **Given** the dashboard is populated with seeded sales orders, **When** the manager opens the landing view, **Then** it displays prior-day order count and revenue totals with a comparison to the trailing 7-day average.
2. **Given** the dashboard is filtered to the current month, **When** the manager switches the date filter to the prior month, **Then** all visualizations refresh within 5 seconds and show the selected period totals.

---

### User Story 2 - Monitor Quotation Pipeline (Priority: P2)

A marketing lead needs to review quotation volume and value by status to understand pipeline health for upcoming promotions.

**Why this priority**: Understanding quotation pipeline is the next-most critical slice, helping the business plan campaigns and resources ahead of confirmed orders.

**Independent Test**: Can be fully tested by filtering the dashboard to quotation metrics and validating the user can identify total open quotation value and top customer segments from seeded data.

**Acceptance Scenarios**:

1. **Given** the seeded dataset includes quotation records, **When** the lead selects the quotation status tab, **Then** the dashboard displays total counts and sum of quotation amounts grouped by status with the ability to drill into customer segments.

---

### User Story 3 - Track Quote-to-Order Conversion (Priority: P3)

A commercial director wants to understand how effectively quotations convert into confirmed sales orders across key categories.

**Why this priority**: Conversion trends provide strategic insight once the foundational order and quotation visibility is in place, rounding out the minimum viable dashboard.

**Independent Test**: Can be fully tested by running a conversion view that compares seeded quotations and subsequent orders and confirming the director can state conversion rate by chosen category.

**Acceptance Scenarios**:

1. **Given** the dashboard links quotation and order sample data via customer and product categories, **When** the director selects a category (e.g., furniture line), **Then** the dashboard displays the conversion percentage and total value moving from quotation to order for that category.

---

### Edge Cases

- How does the dashboard respond when a user applies filters that return zero matching records (e.g., category with no sample data)?
- What happens if a required metric in the spreadsheet lacks seeded values (e.g., missing quotation amount)?
- How is the experience handled if the seeded dataset only covers a partial date range versus the requested filter period?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Provide a seeded dataset of sales orders covering at least the most recent 90 calendar days with fields needed to reproduce metrics in Data_visualization_metrics_20251021.xlsx (dates, customer, item, quantity, amount, delivery status).
- **FR-002**: Provide a seeded dataset of sales quotations for the same 90-day window with status, customer, item grouping, quoted amount, and salesperson to match spreadsheet metrics.
- **FR-003**: Expose at least three dashboard categories derived from the spreadsheet (e.g., Order Volume, Quotation Pipeline, Quote-to-Order Conversion) with clearly labeled visual elements per category.
- **FR-004**: Enable users to adjust date range and category filters and see all dashboard visuals refresh with consistent totals within 5 seconds using the mock data.
- **FR-005**: Present contextual guidance on each dashboard category (title or description) so stakeholders understand what question that view answers using the seeded data.

### Key Entities *(include if feature involves data)*

- **Sales Order**: Represents a confirmed purchase including order date, customer, product category, quantity, revenue amount, and delivery status; used to calculate order volume metrics.
- **Sales Quotation**: Represents a proposal sent to customers including issue date, customer, product category, quoted amount, status, and assigned salesperson; used to measure pipeline health.
- **Dashboard Category**: Logical grouping of charts and summary tiles (Order Volume, Quotation Pipeline, Quote-to-Order Conversion) that ties directly to business questions from the metrics workbook.

## Assumptions

- The metrics workbook referenced is the single source of truth for which indicators must appear in the dashboard.
- Sample categories highlighted in screenshots (e.g., customer groups, product families) can be mirrored with representative mock values without needing exact historical data.
- Stakeholders will access the dashboard via an internal Metabase workspace with standard view permissions already in place.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Test participants playing the sales manager role can identify prior-day order count and revenue within 90 seconds using only the dashboard.
- **SC-002**: Quotation pipeline metrics display total quotation value by status with less than a 5% variance from the seeded dataset totals when audited.
- **SC-003**: Quote-to-order conversion rate is available for at least three categories (e.g., top product families) and matches seeded linkage records with at least 95% accuracy.
- **SC-004**: Stakeholders rate the clarity of dashboard category descriptions at 4 out of 5 or higher during user acceptance review.
