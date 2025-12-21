"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { DigestSection } from "@/lib/insights/digest-generator";
import { cn } from "@/lib/utils";

interface DigestCardProps {
  section: DigestSection;
}

export function DigestCard({ section }: DigestCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{section.icon}</span>
          <h3 className="font-semibold text-slate-900">{section.title}</h3>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          {section.content}
        </p>

        {/* Highlights */}
        {section.highlights && section.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {section.highlights.map((highlight, index) => (
              <div
                key={index}
                className="flex-1 min-w-[80px] bg-slate-50 rounded-lg p-2.5"
              >
                <p className="text-xs text-slate-500 mb-0.5">{highlight.label}</p>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-900 text-sm">
                    {highlight.value}
                  </span>
                  {highlight.change !== undefined && highlight.trend && (
                    <span
                      className={cn(
                        "flex items-center text-xs font-medium",
                        highlight.trend === "up" && "text-emerald-600",
                        highlight.trend === "down" && "text-rose-600",
                        highlight.trend === "neutral" && "text-slate-500"
                      )}
                    >
                      {highlight.trend === "up" && <TrendingUp className="w-3 h-3 mr-0.5" />}
                      {highlight.trend === "down" && <TrendingDown className="w-3 h-3 mr-0.5" />}
                      {highlight.change > 0 ? "+" : ""}{highlight.change.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {section.chart && section.chart.data.length > 0 && (
          <div className="mt-3">
            <SimpleBarChart data={section.chart.data} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-2">
      {data.map((item, index) => {
        const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 truncate max-w-[60%]">{item.label}</span>
              <span className="font-medium text-slate-900">
                {item.value >= 1000
                  ? `MYR ${(item.value / 1000).toFixed(0)}K`
                  : `MYR ${item.value.toFixed(0)}`}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#005F73] to-[#0A9396] rounded-full transition-all duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
