# Data Model: Sample Metabase Dashboard for Sales Metrics

## Entities

### SalesOrder
- **Primary Key**: order_id (UUID or integer surrogate)
- **Fields**:
  - order_date (date)
  - customer_id (string)
  - customer_name (string)
  - product_category (string)
  - product_name (string)
  - quantity (integer)
  - revenue_amount (numeric)
  - currency (string, default MYR)
  - delivery_status (enum: Pending, Shipped, Delivered, Cancelled)
  - salesperson_id (string)
  - created_at (timestamp)
- **Relationships**:
  - Links to `SalesQuotation` via quotation_id when an order originates from a quotation.
  - Aggregated by product_category and customer_name for dashboard breakdowns.
- **Validations**:
  - order_date must fall within seeded date range (last 90 days).
  - revenue_amount >= 0; quantity > 0.

### SalesQuotation
- **Primary Key**: quotation_id (UUID or integer surrogate)
- **Fields**:
  - quotation_date (date)
  - customer_id (string)
  - customer_name (string)
  - product_category (string)
  - quoted_amount (numeric)
  - currency (string, default MYR)
  - status (enum: Draft, Active, Completed, Lost)
  - salesperson_id (string)
  - expected_close_date (date)
- **Relationships**:
  - May map to `SalesOrder.order_id` through quotation_id for conversion rate calculations.
  - Aggregated by status and product_category.
- **Validations**:
  - quotation_date within seeded range; expected_close_date >= quotation_date.
  - quoted_amount >= 0.

### Customer
- **Primary Key**: customer_id (string)
- **Fields**:
  - customer_name (string)
  - customer_segment (enum: Retail, Commercial, Government, Other)
  - region (string)
- **Relationships**:
  - Referenced by `SalesOrder` and `SalesQuotation`.
- **Validations**:
  - customer_segment must be one of predefined options.

### Salesperson
- **Primary Key**: salesperson_id (string)
- **Fields**:
  - salesperson_name (string)
  - department (string)
- **Relationships**:
  - Referenced by `SalesOrder` and `SalesQuotation` to enable performance slicing.

### DashboardCategory (metadata)
- **Primary Key**: category_key (string)
- **Fields**:
  - display_name (string)
  - description (text)
  - primary_metrics (array of metric identifiers)
  - display_order (integer)
- **Relationships**:
  - Used by documentation/Metabase annotations to organize cards.

## Derived Metrics

- **Daily Order Volume**: count of SalesOrder per order_date.
- **Daily Revenue**: sum of revenue_amount per order_date.
- **Trailing 7-Day Average Revenue**: moving average using window functions.
- **Quotation Value by Status**: sum(quoted_amount) grouped by status.
- **Quote-to-Order Conversion Rate**: (count of SalesOrder linked to quotations) / (count of SalesQuotation) per product_category.

## State Transitions

- **SalesQuotation.status**: Draft → Active → Completed/Lost; Completed quotations may produce SalesOrder records.
- **SalesOrder.delivery_status**: Pending → Shipped → Delivered; Cancelled as alternate terminal state.
