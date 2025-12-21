import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const reportConfigs: Record<
  string,
  {
    title: string;
    query: () => Promise<Record<string, unknown>[]>;
  }
> = {
  "sales-overview": {
    title: "Sales Overview",
    query: async () => {
      return await prisma.$queryRaw`
        SELECT
          to_char(date_trunc('month', order_date), 'Mon YYYY') as month,
          SUM(revenue_amount)::float as revenue,
          SUM(gross_profit)::float as profit,
          COUNT(*)::int as orders
        FROM sales_insights.sales_orders
        WHERE order_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY date_trunc('month', order_date)
        ORDER BY date_trunc('month', order_date)
      `;
    },
  },
  "category-performance": {
    title: "Category Performance",
    query: async () => {
      return await prisma.$queryRaw`
        SELECT
          product_category,
          SUM(revenue_amount)::float as revenue,
          SUM(gross_profit)::float as profit,
          COUNT(*)::int as orders,
          ROUND(SUM(gross_profit)::numeric / NULLIF(SUM(revenue_amount), 0) * 100, 1)::float as margin_pct
        FROM sales_insights.sales_orders
        WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY product_category
        ORDER BY revenue DESC
      `;
    },
  },
  "salesperson-ranking": {
    title: "Salesperson Ranking",
    query: async () => {
      return await prisma.$queryRaw`
        SELECT
          s.salesperson_name,
          s.territory,
          SUM(o.revenue_amount)::float as revenue,
          COUNT(*)::int as orders,
          ROUND(AVG(o.revenue_amount)::numeric, 0)::float as avg_order_value
        FROM sales_insights.sales_orders o
        JOIN sales_insights.salespeople s ON o.salesperson_id = s.salesperson_id
        WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY s.salesperson_id, s.salesperson_name, s.territory
        ORDER BY revenue DESC
      `;
    },
  },
  "product-analysis": {
    title: "Product Analysis",
    query: async () => {
      return await prisma.$queryRaw`
        SELECT
          product_name,
          product_category,
          SUM(quantity)::int as units_sold,
          SUM(revenue_amount)::float as revenue,
          COUNT(DISTINCT customer_id)::int as unique_customers
        FROM sales_insights.sales_orders
        WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY product_name, product_category
        ORDER BY revenue DESC
        LIMIT 15
      `;
    },
  },
  "quotation-pipeline": {
    title: "Quotation Pipeline",
    query: async () => {
      return await prisma.$queryRaw`
        SELECT
          status::text as status,
          COUNT(*)::int as quote_count,
          SUM(quoted_amount)::float as total_value,
          ROUND(AVG(probability)::numeric * 100, 0)::float as avg_probability
        FROM sales_insights.sales_quotations
        WHERE quotation_date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY status
        ORDER BY
          CASE status::text
            WHEN 'Draft' THEN 1
            WHEN 'Active' THEN 2
            WHEN 'Completed' THEN 3
            ELSE 4
          END
      `;
    },
  },
};

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = reportConfigs[slug];

  if (!config) {
    notFound();
  }

  let data: Record<string, unknown>[] = [];
  let error: string | null = null;

  try {
    data = await config.query();
  } catch (e) {
    console.error("Report query error:", e);
    error = "Failed to load report data";
  }

  // Get column headers
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="px-4 py-6">
      {/* Header with back button */}
      <header className="mb-6">
        <Link
          href="/reports"
          className="flex items-center gap-1 text-sm text-slate-500 mb-2 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </Link>
        <h1 className="text-xl font-bold text-slate-900">{config.title}</h1>
        <p className="text-sm text-slate-500">Last 30 days</p>
      </header>

      {/* Data Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center text-slate-500">{error}</div>
          ) : data.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="text-left py-3 px-4 font-medium text-slate-700 whitespace-nowrap"
                      >
                        {col.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      {columns.map((col) => {
                        const value = row[col];
                        const displayValue =
                          typeof value === "number"
                            ? value.toLocaleString("en-MY", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })
                            : String(value ?? "");

                        return (
                          <td key={col} className="py-3 px-4 whitespace-nowrap">
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
