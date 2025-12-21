import { prisma } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DigestSection {
  id: string;
  title: string;
  icon: string;
  content: string;
  highlights?: {
    label: string;
    value: string;
    change?: number;
    trend?: "up" | "down" | "neutral";
  }[];
  chart?: {
    type: "bar" | "line" | "sparkline";
    data: { label: string; value: number }[];
  };
}

export interface DailyDigest {
  date: string;
  greeting: string;
  summary: string;
  sections: DigestSection[];
  generatedAt: string;
}

interface MetricsData {
  thisMonth: { revenue: number; orders: number; profit: number; avgOrder: number };
  lastMonth: { revenue: number; orders: number; profit: number; avgOrder: number };
  thisWeek: { revenue: number; orders: number };
  lastWeek: { revenue: number; orders: number };
  yesterday: { revenue: number; orders: number };
  topProducts: { name: string; category: string; revenue: number; units: number }[];
  topCustomers: { name: string; revenue: number; orders: number }[];
  categoryPerformance: { category: string; revenue: number; change: number }[];
  topSalespeople: { name: string; revenue: number; orders: number }[];
  pipelineStats: { active: number; value: number; avgProbability: number };
  risingProducts: { name: string; change: number }[];
  decliningProducts: { name: string; change: number }[];
}

async function fetchMetrics(): Promise<MetricsData> {
  // This month vs last month (only include data up to today, not future)
  const monthlyComparison = await prisma.$queryRaw<Array<{
    period: string;
    revenue: number;
    orders: number;
    profit: number;
    avg_order: number;
  }>>`
    SELECT
      CASE
        WHEN order_date >= date_trunc('month', CURRENT_DATE) THEN 'this_month'
        ELSE 'last_month'
      END as period,
      COALESCE(SUM(revenue_amount), 0)::float as revenue,
      COUNT(*)::int as orders,
      COALESCE(SUM(gross_profit), 0)::float as profit,
      COALESCE(AVG(revenue_amount), 0)::float as avg_order
    FROM sales_insights.sales_orders
    WHERE order_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
      AND order_date <= CURRENT_DATE
    GROUP BY CASE
      WHEN order_date >= date_trunc('month', CURRENT_DATE) THEN 'this_month'
      ELSE 'last_month'
    END
  `;

  // This week vs last week (only include data up to today)
  const weeklyComparison = await prisma.$queryRaw<Array<{
    period: string;
    revenue: number;
    orders: number;
  }>>`
    SELECT
      CASE
        WHEN order_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'this_week'
        ELSE 'last_week'
      END as period,
      COALESCE(SUM(revenue_amount), 0)::float as revenue,
      COUNT(*)::int as orders
    FROM sales_insights.sales_orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '14 days'
      AND order_date <= CURRENT_DATE
    GROUP BY CASE
      WHEN order_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'this_week'
      ELSE 'last_week'
    END
  `;

  // Yesterday's performance
  const yesterday = await prisma.$queryRaw<Array<{
    revenue: number;
    orders: number;
  }>>`
    SELECT
      COALESCE(SUM(revenue_amount), 0)::float as revenue,
      COUNT(*)::int as orders
    FROM sales_insights.sales_orders
    WHERE order_date = CURRENT_DATE - INTERVAL '1 day'
  `;

  // Top products this month
  const topProducts = await prisma.$queryRaw<Array<{
    name: string;
    category: string;
    revenue: number;
    units: number;
  }>>`
    SELECT
      product_name as name,
      product_category as category,
      SUM(revenue_amount)::float as revenue,
      SUM(quantity)::int as units
    FROM sales_insights.sales_orders
    WHERE order_date >= date_trunc('month', CURRENT_DATE)
      AND order_date <= CURRENT_DATE
    GROUP BY product_name, product_category
    ORDER BY revenue DESC
    LIMIT 5
  `;

  // Top customers this month
  const topCustomers = await prisma.$queryRaw<Array<{
    name: string;
    revenue: number;
    orders: number;
  }>>`
    SELECT
      c.customer_name as name,
      SUM(o.revenue_amount)::float as revenue,
      COUNT(*)::int as orders
    FROM sales_insights.sales_orders o
    JOIN sales_insights.customers c ON o.customer_id = c.customer_id
    WHERE o.order_date >= date_trunc('month', CURRENT_DATE)
      AND o.order_date <= CURRENT_DATE
    GROUP BY c.customer_name
    ORDER BY revenue DESC
    LIMIT 5
  `;

  // Category performance with MoM change
  const categoryPerformance = await prisma.$queryRaw<Array<{
    category: string;
    revenue: number;
    change: number;
  }>>`
    WITH this_month AS (
      SELECT product_category, SUM(revenue_amount) as revenue
      FROM sales_insights.sales_orders
      WHERE order_date >= date_trunc('month', CURRENT_DATE)
        AND order_date <= CURRENT_DATE
      GROUP BY product_category
    ),
    last_month AS (
      SELECT product_category, SUM(revenue_amount) as revenue
      FROM sales_insights.sales_orders
      WHERE order_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
        AND order_date < date_trunc('month', CURRENT_DATE)
      GROUP BY product_category
    )
    SELECT
      COALESCE(t.product_category, l.product_category) as category,
      COALESCE(t.revenue, 0)::float as revenue,
      CASE
        WHEN COALESCE(l.revenue, 0) > 0
        THEN ((COALESCE(t.revenue, 0) - l.revenue) / l.revenue * 100)::float
        ELSE 0
      END as change
    FROM this_month t
    FULL OUTER JOIN last_month l ON t.product_category = l.product_category
    ORDER BY revenue DESC
  `;

  // Top salespeople this month
  const topSalespeople = await prisma.$queryRaw<Array<{
    name: string;
    revenue: number;
    orders: number;
  }>>`
    SELECT
      s.salesperson_name as name,
      SUM(o.revenue_amount)::float as revenue,
      COUNT(*)::int as orders
    FROM sales_insights.sales_orders o
    JOIN sales_insights.salespeople s ON o.salesperson_id = s.salesperson_id
    WHERE o.order_date >= date_trunc('month', CURRENT_DATE)
      AND o.order_date <= CURRENT_DATE
    GROUP BY s.salesperson_name
    ORDER BY revenue DESC
    LIMIT 5
  `;

  // Pipeline stats
  const pipelineStats = await prisma.$queryRaw<Array<{
    active: number;
    value: number;
    avg_probability: number;
  }>>`
    SELECT
      COUNT(*)::int as active,
      COALESCE(SUM(quoted_amount), 0)::float as value,
      COALESCE(AVG(probability)::float, 0) as avg_probability
    FROM sales_insights.sales_quotations
    WHERE status::text = 'Active'
  `;

  // Rising and declining products (week over week)
  const productTrends = await prisma.$queryRaw<Array<{
    name: string;
    change: number;
    direction: string;
  }>>`
    WITH this_week AS (
      SELECT product_name, SUM(revenue_amount) as revenue
      FROM sales_insights.sales_orders
      WHERE order_date >= CURRENT_DATE - INTERVAL '7 days'
        AND order_date <= CURRENT_DATE
      GROUP BY product_name
    ),
    last_week AS (
      SELECT product_name, SUM(revenue_amount) as revenue
      FROM sales_insights.sales_orders
      WHERE order_date >= CURRENT_DATE - INTERVAL '14 days'
        AND order_date < CURRENT_DATE - INTERVAL '7 days'
      GROUP BY product_name
    )
    SELECT
      COALESCE(t.product_name, l.product_name) as name,
      CASE
        WHEN COALESCE(l.revenue, 0) > 0
        THEN ((COALESCE(t.revenue, 0) - l.revenue) / l.revenue * 100)::float
        ELSE 100
      END as change,
      CASE
        WHEN COALESCE(t.revenue, 0) > COALESCE(l.revenue, 0) THEN 'rising'
        ELSE 'declining'
      END as direction
    FROM this_week t
    FULL OUTER JOIN last_week l ON t.product_name = l.product_name
    WHERE COALESCE(t.revenue, 0) > 0 OR COALESCE(l.revenue, 0) > 0
    ORDER BY change DESC
  `;

  // Parse results
  const thisMonthData = monthlyComparison.find(r => r.period === 'this_month') || { revenue: 0, orders: 0, profit: 0, avg_order: 0 };
  const lastMonthData = monthlyComparison.find(r => r.period === 'last_month') || { revenue: 0, orders: 0, profit: 0, avg_order: 0 };
  const thisWeekData = weeklyComparison.find(r => r.period === 'this_week') || { revenue: 0, orders: 0 };
  const lastWeekData = weeklyComparison.find(r => r.period === 'last_week') || { revenue: 0, orders: 0 };

  return {
    thisMonth: {
      revenue: thisMonthData.revenue,
      orders: thisMonthData.orders,
      profit: thisMonthData.profit,
      avgOrder: thisMonthData.avg_order,
    },
    lastMonth: {
      revenue: lastMonthData.revenue,
      orders: lastMonthData.orders,
      profit: lastMonthData.profit,
      avgOrder: lastMonthData.avg_order,
    },
    thisWeek: thisWeekData,
    lastWeek: lastWeekData,
    yesterday: yesterday[0] || { revenue: 0, orders: 0 },
    topProducts,
    topCustomers,
    categoryPerformance,
    topSalespeople,
    pipelineStats: {
      active: Number(pipelineStats[0]?.active) || 0,
      value: Number(pipelineStats[0]?.value) || 0,
      avgProbability: Number(pipelineStats[0]?.avg_probability) || 0,
    },
    risingProducts: productTrends.filter(p => p.direction === 'rising').slice(0, 3),
    decliningProducts: productTrends.filter(p => p.direction === 'declining').slice(-3).reverse(),
  };
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `MYR ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `MYR ${(value / 1000).toFixed(0)}K`;
  }
  return `MYR ${value.toFixed(0)}`;
}

function getChangeText(current: number, previous: number): { text: string; change: number; trend: "up" | "down" | "neutral" } {
  if (previous === 0) return { text: "N/A", change: 0, trend: "neutral" };
  const change = ((current - previous) / previous) * 100;
  const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral";
  const text = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  return { text, change, trend };
}

async function generateAISummary(metrics: MetricsData): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return generateFallbackSummary(metrics);
  }

  const prompt = `You are a business analyst writing a brief daily digest for a sales team. Write 2-3 sentences summarizing the key insights from this data. Be specific with numbers. Use a friendly, professional tone.

Data:
- This month revenue: ${formatCurrency(metrics.thisMonth.revenue)} (${metrics.thisMonth.orders} orders)
- Last month revenue: ${formatCurrency(metrics.lastMonth.revenue)} (${metrics.lastMonth.orders} orders)
- Month-over-month change: ${getChangeText(metrics.thisMonth.revenue, metrics.lastMonth.revenue).text}
- This week revenue: ${formatCurrency(metrics.thisWeek.revenue)} vs last week ${formatCurrency(metrics.lastWeek.revenue)}
- Top product: ${metrics.topProducts[0]?.name || 'N/A'} (${formatCurrency(metrics.topProducts[0]?.revenue || 0)})
- Top customer: ${metrics.topCustomers[0]?.name || 'N/A'}
- Top category growth: ${metrics.categoryPerformance.filter(c => c.change > 0)[0]?.category || 'N/A'} (${metrics.categoryPerformance.filter(c => c.change > 0)[0]?.change.toFixed(0) || 0}% up)
- Active pipeline: ${metrics.pipelineStats.active} quotes worth ${formatCurrency(metrics.pipelineStats.value)}

Write a 2-3 sentence summary highlighting the most important trends and opportunities.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content || generateFallbackSummary(metrics);
  } catch (error) {
    console.error("AI summary error:", error);
    return generateFallbackSummary(metrics);
  }
}

function generateFallbackSummary(metrics: MetricsData): string {
  const momChange = getChangeText(metrics.thisMonth.revenue, metrics.lastMonth.revenue);
  const topProduct = metrics.topProducts[0]?.name || "N/A";
  const topCustomer = metrics.topCustomers[0]?.name || "N/A";

  return `This month's revenue is ${momChange.trend === "up" ? "up" : "down"} ${Math.abs(momChange.change).toFixed(0)}% compared to last month, with ${metrics.thisMonth.orders} orders totaling ${formatCurrency(metrics.thisMonth.revenue)}. ${topProduct} is leading product sales, while ${topCustomer} is the top customer this month.`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export async function generateDailyDigest(): Promise<DailyDigest> {
  const metrics = await fetchMetrics();
  const summary = await generateAISummary(metrics);

  const momRevenueChange = getChangeText(metrics.thisMonth.revenue, metrics.lastMonth.revenue);
  const momOrdersChange = getChangeText(metrics.thisMonth.orders, metrics.lastMonth.orders);
  const wowRevenueChange = getChangeText(metrics.thisWeek.revenue, metrics.lastWeek.revenue);

  const sections: DigestSection[] = [
    // Monthly Performance
    {
      id: "monthly-performance",
      title: "Monthly Performance",
      icon: "📊",
      content: `You're ${momRevenueChange.trend === "up" ? "ahead" : "behind"} last month by ${Math.abs(momRevenueChange.change).toFixed(0)}%. ${metrics.thisMonth.orders} orders placed so far this month with an average order value of ${formatCurrency(metrics.thisMonth.avgOrder)}.`,
      highlights: [
        {
          label: "Revenue",
          value: formatCurrency(metrics.thisMonth.revenue),
          change: momRevenueChange.change,
          trend: momRevenueChange.trend,
        },
        {
          label: "Orders",
          value: metrics.thisMonth.orders.toString(),
          change: momOrdersChange.change,
          trend: momOrdersChange.trend,
        },
        {
          label: "Avg Order",
          value: formatCurrency(metrics.thisMonth.avgOrder),
        },
      ],
    },

    // Weekly Snapshot
    {
      id: "weekly-snapshot",
      title: "This Week",
      icon: "📈",
      content: `This week brought in ${formatCurrency(metrics.thisWeek.revenue)} from ${metrics.thisWeek.orders} orders — ${wowRevenueChange.trend === "up" ? "an improvement" : "a dip"} of ${Math.abs(wowRevenueChange.change).toFixed(0)}% from last week.`,
      highlights: [
        {
          label: "Week Revenue",
          value: formatCurrency(metrics.thisWeek.revenue),
          change: wowRevenueChange.change,
          trend: wowRevenueChange.trend,
        },
        {
          label: "Yesterday",
          value: formatCurrency(metrics.yesterday.revenue),
        },
      ],
    },

    // What's Selling
    {
      id: "whats-selling",
      title: "What's Selling",
      icon: "🔥",
      content: `${metrics.topProducts[0]?.name || "No data"} leads this month with ${formatCurrency(metrics.topProducts[0]?.revenue || 0)} in sales. ${metrics.categoryPerformance.filter(c => c.change > 0)[0]?.category || "No category"} is the fastest growing category at +${metrics.categoryPerformance.filter(c => c.change > 0)[0]?.change.toFixed(0) || 0}%.`,
      chart: {
        type: "bar",
        data: metrics.topProducts.slice(0, 5).map(p => ({
          label: p.name.split(" ").slice(0, 2).join(" "),
          value: p.revenue,
        })),
      },
    },

    // Category Trends
    {
      id: "category-trends",
      title: "Category Trends",
      icon: "📦",
      content: metrics.categoryPerformance.length > 0
        ? `${metrics.categoryPerformance.filter(c => c.change > 0).length} categories are growing, ${metrics.categoryPerformance.filter(c => c.change < 0).length} are declining compared to last month.`
        : "No category data available.",
      highlights: metrics.categoryPerformance.slice(0, 4).map(c => ({
        label: c.category.split(" ")[0],
        value: formatCurrency(c.revenue),
        change: Math.round(c.change),
        trend: c.change > 0 ? "up" as const : c.change < 0 ? "down" as const : "neutral" as const,
      })),
    },

    // Top Customers
    {
      id: "top-customers",
      title: "Top Customers",
      icon: "👥",
      content: `${metrics.topCustomers[0]?.name || "N/A"} leads with ${formatCurrency(metrics.topCustomers[0]?.revenue || 0)} from ${metrics.topCustomers[0]?.orders || 0} orders this month.`,
      chart: {
        type: "bar",
        data: metrics.topCustomers.slice(0, 5).map(c => ({
          label: c.name.split(" ").slice(0, 2).join(" "),
          value: c.revenue,
        })),
      },
    },

    // Team Performance
    {
      id: "team-performance",
      title: "Sales Team",
      icon: "🏆",
      content: `${metrics.topSalespeople[0]?.name || "N/A"} is leading the team with ${formatCurrency(metrics.topSalespeople[0]?.revenue || 0)} in sales from ${metrics.topSalespeople[0]?.orders || 0} orders.`,
      highlights: metrics.topSalespeople.slice(0, 3).map(s => ({
        label: s.name.split(" ")[0],
        value: formatCurrency(s.revenue),
      })),
    },

    // Pipeline
    {
      id: "pipeline",
      title: "Pipeline",
      icon: "🎯",
      content: `${metrics.pipelineStats.active} active quotations worth ${formatCurrency(metrics.pipelineStats.value)} with an average close probability of ${(metrics.pipelineStats.avgProbability * 100).toFixed(0)}%.`,
      highlights: [
        {
          label: "Active Quotes",
          value: metrics.pipelineStats.active.toString(),
        },
        {
          label: "Pipeline Value",
          value: formatCurrency(metrics.pipelineStats.value),
        },
        {
          label: "Avg Probability",
          value: `${(metrics.pipelineStats.avgProbability * 100).toFixed(0)}%`,
        },
      ],
    },
  ];

  return {
    date: new Date().toLocaleDateString("en-MY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    greeting: getGreeting(),
    summary,
    sections,
    generatedAt: new Date().toISOString(),
  };
}
