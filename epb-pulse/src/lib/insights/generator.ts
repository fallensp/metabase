import { prisma } from "@/lib/db";

export interface Insight {
  id: string;
  title: string;
  value: string;
  change?: number;
  trend?: "up" | "down" | "neutral";
  category: "revenue" | "orders" | "salesperson" | "product" | "customer" | "pipeline";
  subtitle?: string;
  sparklineData?: number[];
}

export async function generateDailyInsights(): Promise<Insight[]> {
  const insights: Insight[] = [];

  // 1. Revenue insight - compare this week vs last week
  const revenueInsight = await getRevenueInsight();
  if (revenueInsight) insights.push(revenueInsight);

  // 2. Order count for today/yesterday
  const orderInsight = await getOrderInsight();
  if (orderInsight) insights.push(orderInsight);

  // 3. Top performing salesperson
  const topPerformerInsight = await getTopPerformerInsight();
  if (topPerformerInsight) insights.push(topPerformerInsight);

  // 4. Trending product category
  const trendingCategoryInsight = await getTrendingCategoryInsight();
  if (trendingCategoryInsight) insights.push(trendingCategoryInsight);

  // 5. Pipeline insight - active quotations
  const pipelineInsight = await getPipelineInsight();
  if (pipelineInsight) insights.push(pipelineInsight);

  return insights;
}

async function getRevenueInsight(): Promise<Insight | null> {
  try {
    const result = await prisma.$queryRaw<Array<{
      this_week: number;
      last_week: number;
      daily_revenue: number[];
    }>>`
      WITH weekly AS (
        SELECT
          COALESCE(SUM(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '7 days' THEN revenue_amount ELSE 0 END), 0) as this_week,
          COALESCE(SUM(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '14 days' AND order_date < CURRENT_DATE - INTERVAL '7 days' THEN revenue_amount ELSE 0 END), 0) as last_week
        FROM sales_insights.sales_orders
        WHERE order_date >= CURRENT_DATE - INTERVAL '14 days'
      ),
      daily AS (
        SELECT
          array_agg(COALESCE(daily_rev, 0) ORDER BY d) as daily_revenue
        FROM (
          SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date as d
        ) dates
        LEFT JOIN (
          SELECT order_date::date, SUM(revenue_amount)::numeric as daily_rev
          FROM sales_insights.sales_orders
          WHERE order_date >= CURRENT_DATE - INTERVAL '6 days'
          GROUP BY order_date::date
        ) orders ON dates.d = orders.order_date
      )
      SELECT
        weekly.this_week::float as this_week,
        weekly.last_week::float as last_week,
        daily.daily_revenue::float[] as daily_revenue
      FROM weekly, daily
    `;

    if (result.length === 0) return null;

    const { this_week, last_week, daily_revenue } = result[0];
    const change = last_week > 0 ? ((this_week - last_week) / last_week) * 100 : 0;

    return {
      id: "revenue-trend",
      title: `Revenue ${change >= 0 ? "up" : "down"} ${Math.abs(change).toFixed(1)}% vs last week`,
      value: `MYR ${this_week.toLocaleString("en-MY", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      change: Math.round(change * 10) / 10,
      trend: change >= 0 ? "up" : "down",
      category: "revenue",
      sparklineData: daily_revenue || [],
    };
  } catch (error) {
    console.error("Error generating revenue insight:", error);
    return null;
  }
}

async function getOrderInsight(): Promise<Insight | null> {
  try {
    const result = await prisma.$queryRaw<Array<{
      yesterday_orders: number;
      yesterday_revenue: number;
    }>>`
      SELECT
        COUNT(*)::int as yesterday_orders,
        COALESCE(SUM(revenue_amount), 0)::float as yesterday_revenue
      FROM sales_insights.sales_orders
      WHERE order_date = CURRENT_DATE - INTERVAL '1 day'
    `;

    if (result.length === 0) return null;

    const { yesterday_orders, yesterday_revenue } = result[0];

    return {
      id: "daily-orders",
      title: `${yesterday_orders} orders yesterday`,
      value: `MYR ${yesterday_revenue.toLocaleString("en-MY", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      category: "orders",
      subtitle: "Prior day performance",
    };
  } catch (error) {
    console.error("Error generating order insight:", error);
    return null;
  }
}

async function getTopPerformerInsight(): Promise<Insight | null> {
  try {
    const result = await prisma.$queryRaw<Array<{
      salesperson_name: string;
      revenue: number;
      order_count: number;
    }>>`
      SELECT
        s.salesperson_name,
        SUM(o.revenue_amount)::float as revenue,
        COUNT(*)::int as order_count
      FROM sales_insights.sales_orders o
      JOIN sales_insights.salespeople s ON o.salesperson_id = s.salesperson_id
      WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY s.salesperson_id, s.salesperson_name
      ORDER BY revenue DESC
      LIMIT 1
    `;

    if (result.length === 0) return null;

    const { salesperson_name, revenue, order_count } = result[0];

    return {
      id: "top-performer",
      title: `Top Performer: ${salesperson_name}`,
      value: `MYR ${(revenue / 1000).toFixed(1)}K`,
      category: "salesperson",
      subtitle: `${order_count} orders this month`,
    };
  } catch (error) {
    console.error("Error generating top performer insight:", error);
    return null;
  }
}

async function getTrendingCategoryInsight(): Promise<Insight | null> {
  try {
    const result = await prisma.$queryRaw<Array<{
      product_category: string;
      this_week_orders: number;
      last_week_orders: number;
      change_pct: number;
    }>>`
      WITH category_orders AS (
        SELECT
          product_category,
          COUNT(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::int as this_week_orders,
          COUNT(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '14 days' AND order_date < CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::int as last_week_orders
        FROM sales_insights.sales_orders
        WHERE order_date >= CURRENT_DATE - INTERVAL '14 days'
        GROUP BY product_category
      )
      SELECT
        product_category,
        this_week_orders,
        last_week_orders,
        CASE
          WHEN last_week_orders > 0 THEN ((this_week_orders - last_week_orders)::float / last_week_orders * 100)
          ELSE 0
        END as change_pct
      FROM category_orders
      WHERE this_week_orders > 0
      ORDER BY change_pct DESC
      LIMIT 1
    `;

    if (result.length === 0) return null;

    const { product_category, change_pct } = result[0];

    return {
      id: "trending-category",
      title: `${product_category} trending`,
      value: `${change_pct >= 0 ? "+" : ""}${change_pct.toFixed(0)}% orders`,
      change: Math.round(change_pct),
      trend: change_pct >= 0 ? "up" : "down",
      category: "product",
    };
  } catch (error) {
    console.error("Error generating trending category insight:", error);
    return null;
  }
}

async function getPipelineInsight(): Promise<Insight | null> {
  try {
    const result = await prisma.$queryRaw<Array<{
      active_quotes: number;
      total_value: number;
    }>>`
      SELECT
        COUNT(*)::int as active_quotes,
        COALESCE(SUM(quoted_amount), 0)::float as total_value
      FROM sales_insights.sales_quotations
      WHERE status::text = 'Active'
    `;

    if (result.length === 0) return null;

    const { active_quotes, total_value } = result[0];

    return {
      id: "pipeline",
      title: `${active_quotes} active quotations`,
      value: `MYR ${(total_value / 1000).toFixed(0)}K pipeline`,
      category: "pipeline",
      subtitle: "Awaiting customer decision",
    };
  } catch (error) {
    console.error("Error generating pipeline insight:", error);
    return null;
  }
}
