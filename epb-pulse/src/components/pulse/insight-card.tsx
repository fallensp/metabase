"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, BarChart3, Users, Package, ShoppingCart, FileText } from "lucide-react";
import type { Insight } from "@/lib/insights/generator";
import { cn } from "@/lib/utils";

const categoryIcons = {
  revenue: BarChart3,
  orders: ShoppingCart,
  salesperson: Users,
  product: Package,
  customer: Users,
  pipeline: FileText,
};

const categoryColors = {
  revenue: "bg-emerald-500",
  orders: "bg-blue-500",
  salesperson: "bg-purple-500",
  product: "bg-amber-500",
  customer: "bg-rose-500",
  pipeline: "bg-cyan-500",
};

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const Icon = categoryIcons[insight.category] || Activity;
  const bgColor = categoryColors[insight.category] || "bg-slate-500";

  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn("p-2 rounded-lg", bgColor)}>
            <Icon className="w-5 h-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-600 font-medium truncate">
              {insight.title}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {insight.value}
            </p>
            {insight.subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{insight.subtitle}</p>
            )}
          </div>

          {/* Trend indicator */}
          {insight.trend && insight.change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-medium",
                insight.trend === "up"
                  ? "bg-emerald-100 text-emerald-700"
                  : insight.trend === "down"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-100 text-slate-700"
              )}
            >
              {insight.trend === "up" ? (
                <TrendingUp className="w-3 h-3" />
              ) : insight.trend === "down" ? (
                <TrendingDown className="w-3 h-3" />
              ) : null}
              <span>{Math.abs(insight.change)}%</span>
            </div>
          )}
        </div>

        {/* Sparkline */}
        {insight.sparklineData && insight.sparklineData.length > 0 && (
          <div className="mt-3 h-10">
            <Sparkline data={insight.sparklineData} trend={insight.trend} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Sparkline({ data, trend }: { data: number[]; trend?: "up" | "down" | "neutral" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  const strokeColor = trend === "up" ? "#10b981" : trend === "down" ? "#f43f5e" : "#64748b";

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
