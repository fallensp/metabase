import OpenAI from "openai";
import { prisma } from "@/lib/db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache for database context (refreshes every 5 minutes)
let contextCache: { data: DatabaseContext; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface DatabaseContext {
  salespeople: string[];
  customers: string[];
  products: string[];
  categories: string[];
  dateRange: { min: string; max: string };
}

async function fetchDatabaseContext(): Promise<DatabaseContext> {
  // Check cache
  if (contextCache && Date.now() - contextCache.timestamp < CACHE_TTL) {
    return contextCache.data;
  }

  const [salespeople, customers, products, categories, dateRange] = await Promise.all([
    prisma.$queryRaw<Array<{ name: string }>>`
      SELECT DISTINCT salesperson_name as name
      FROM sales_insights.salespeople
      ORDER BY name
    `,
    prisma.$queryRaw<Array<{ name: string }>>`
      SELECT DISTINCT customer_name as name
      FROM sales_insights.customers
      ORDER BY name
      LIMIT 50
    `,
    prisma.$queryRaw<Array<{ name: string }>>`
      SELECT DISTINCT product_name as name
      FROM sales_insights.product_catalog
      ORDER BY name
    `,
    prisma.$queryRaw<Array<{ category: string }>>`
      SELECT DISTINCT product_category as category
      FROM sales_insights.sales_orders
      ORDER BY category
    `,
    prisma.$queryRaw<Array<{ min_date: Date; max_date: Date }>>`
      SELECT
        MIN(order_date) as min_date,
        MAX(order_date) as max_date
      FROM sales_insights.sales_orders
      WHERE order_date <= CURRENT_DATE
    `,
  ]);

  const context: DatabaseContext = {
    salespeople: salespeople.map(s => s.name),
    customers: customers.map(c => c.name),
    products: products.map(p => p.name),
    categories: categories.map(c => c.category),
    dateRange: {
      min: dateRange[0]?.min_date?.toISOString().split('T')[0] || '2024-01-01',
      max: dateRange[0]?.max_date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    },
  };

  // Update cache
  contextCache = { data: context, timestamp: Date.now() };
  return context;
}

function buildSystemPrompt(context: DatabaseContext): string {
  return `You are a SQL expert for a sales analytics database. Generate PostgreSQL queries based on user questions.

## Database Schema: sales_insights

### Tables:

**sales_orders** - Confirmed purchases
- order_id: TEXT PRIMARY KEY
- order_date: DATE (data available from ${context.dateRange.min} to ${context.dateRange.max})
- customer_id: TEXT (FK -> customers)
- product_category: TEXT
- product_name: TEXT
- quantity: INTEGER
- revenue_amount: NUMERIC(12,2) (currency: MYR)
- delivery_status: delivery_status_enum ('Pending', 'Shipped', 'Delivered', 'Cancelled')
- salesperson_id: TEXT (FK -> salespeople)
- unit_price: NUMERIC(12,2)
- unit_cost: NUMERIC(12,2)
- gross_profit: NUMERIC(12,2)
- discount_rate: NUMERIC(5,2)
- sales_channel: TEXT ('Direct', 'Distributor', 'Online', 'Key Account')

**sales_quotations** - Proposals
- quotation_id: TEXT PRIMARY KEY
- quotation_date: DATE
- customer_id: TEXT
- product_category: TEXT
- quoted_amount: NUMERIC(12,2)
- status: quotation_status_enum ('Draft', 'Active', 'Completed', 'Lost')
- salesperson_id: TEXT
- expected_close_date: DATE
- estimated_margin: NUMERIC(12,2)
- probability: NUMERIC(5,2)

**customers**
- customer_id: TEXT PRIMARY KEY
- customer_name: TEXT
- customer_segment: TEXT ('Retail', 'Commercial', 'Industrial', 'Distributor', 'Hospitality')
- region: TEXT ('Kuala Lumpur', 'Penang', 'Johor Bahru', 'Kuching', 'Melaka', 'Ipoh', 'Sabah')
- industry: TEXT
- credit_limit, credit_utilized: NUMERIC(12,2)

**salespeople**
- salesperson_id: TEXT PRIMARY KEY
- salesperson_name: TEXT
- department: TEXT
- territory: TEXT ('Central', 'North', 'South', 'East', 'Key Accounts', 'Export')

**product_catalog**
- product_id: TEXT PRIMARY KEY
- product_name, product_category, product_family: TEXT
- unit_cost, unit_price: NUMERIC(12,2)
- lifecycle_stage: TEXT ('Launch', 'Growth', 'Mature')

**sales_targets** - Target amounts by period
- target_date: DATE
- granularity: TEXT ('company', 'category', 'salesperson')
- entity_id: TEXT
- target_amount: NUMERIC(12,2)

## ACTUAL DATA VALUES (use these for matching):

**Salespeople names:** ${context.salespeople.join(', ')}

**Sample customers:** ${context.customers.slice(0, 20).join(', ')}...

**Product categories:** ${context.categories.join(', ')}

**Sample products:** ${context.products.slice(0, 15).join(', ')}...

## IMPORTANT RULES FOR FLEXIBLE MATCHING:

1. **ALWAYS use case-insensitive matching with ILIKE for text columns:**
   - Instead of: WHERE salesperson_name = 'James'
   - Use: WHERE LOWER(salesperson_name) ILIKE LOWER('%james%')

2. **For names, use partial/fuzzy matching:**
   - User says "james" → match "JAMES CHEYU" using ILIKE '%james%'
   - User says "lim" → match "LIM WEI HONG" using ILIKE '%lim%'

3. **Match the closest name from the actual data above:**
   - If user says "chong sales", match to the salesperson containing "chong"
   - If user says "aurora customer", match customer containing "aurora"

4. **For joins with salespeople or customers, use flexible matching:**
   \`\`\`sql
   JOIN sales_insights.salespeople s ON o.salesperson_id = s.salesperson_id
   WHERE LOWER(s.salesperson_name) ILIKE LOWER('%user_input%')
   \`\`\`

5. **Always use schema prefix:** sales_insights.table_name

6. **Date handling:**
   - Use CURRENT_DATE for "today", "this month", etc.
   - Always filter: AND order_date <= CURRENT_DATE (exclude future data)
   - Use date_trunc() for period grouping

7. **Format results:**
   - Use ROUND(value, 2) for currency
   - Limit to 10-20 rows unless aggregating
   - Use CTEs for complex queries

8. **Only SELECT queries allowed** (no INSERT/UPDATE/DELETE)

9. **Cast enums to text:** status::text, delivery_status::text

## Output Format:
Return a JSON object:
{
  "sql": "SELECT ...",
  "explanation": "Brief explanation of what the query does",
  "visualization_type": "scalar|table|bar|line|pie"
}`;
}

export interface SQLResult {
  sql: string;
  explanation: string;
  visualizationType: "scalar" | "table" | "bar" | "line" | "pie";
}

export async function generateSQL(question: string): Promise<SQLResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  // Fetch database context for better matching
  const context = await fetchDatabaseContext();
  const systemPrompt = buildSystemPrompt(context);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const result = JSON.parse(content);

  // Validate SQL safety
  const sql = result.sql.trim();

  // Block dangerous operations
  if (/\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE)\b/i.test(sql)) {
    throw new Error("Only SELECT queries are allowed");
  }

  // Ensure schema prefix
  if (!sql.toLowerCase().includes("sales_insights.")) {
    throw new Error("Query must use sales_insights schema");
  }

  return {
    sql,
    explanation: result.explanation,
    visualizationType: result.visualization_type || "table",
  };
}

export function formatAnswer(
  explanation: string,
  data: Record<string, unknown>[],
  visualizationType: string
): string {
  if (!data || data.length === 0) {
    return `${explanation}\n\nNo data found for this query.`;
  }

  // For scalar results, include the value in the answer
  if (visualizationType === "scalar" && data[0]) {
    const value = Object.values(data[0])[0];
    const formattedValue =
      typeof value === "number"
        ? value.toLocaleString("en-MY", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })
        : String(value);
    return `${explanation}\n\nThe answer is: **${formattedValue}**`;
  }

  return `${explanation}\n\nFound ${data.length} result${data.length === 1 ? "" : "s"}.`;
}
