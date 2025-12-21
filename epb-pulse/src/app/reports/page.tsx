import { BarChart3, TrendingUp, Users, Package, PieChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const reports = [
  {
    slug: "sales-overview",
    title: "Sales Overview",
    description: "Revenue trends, order volume, and key metrics",
    icon: TrendingUp,
    color: "bg-emerald-500",
  },
  {
    slug: "category-performance",
    title: "Category Performance",
    description: "Revenue and margin by product category",
    icon: PieChart,
    color: "bg-blue-500",
  },
  {
    slug: "salesperson-ranking",
    title: "Salesperson Ranking",
    description: "Top performers and target achievement",
    icon: Users,
    color: "bg-purple-500",
  },
  {
    slug: "product-analysis",
    title: "Product Analysis",
    description: "Best sellers and inventory status",
    icon: Package,
    color: "bg-amber-500",
  },
  {
    slug: "quotation-pipeline",
    title: "Quotation Pipeline",
    description: "Active quotes and conversion rates",
    icon: BarChart3,
    color: "bg-cyan-500",
  },
];

export default function ReportsPage() {
  return (
    <div className="px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-[#005F73]" />
          <h1 className="text-lg font-bold text-slate-900">Reports</h1>
        </div>
        <p className="text-sm text-slate-500">
          Tap a report to view details
        </p>
      </header>

      {/* Report Cards */}
      <div className="space-y-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.slug} href={`/reports/${report.slug}`}>
              <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${report.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        {report.title}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        {report.description}
                      </p>
                    </div>
                    <div className="text-slate-300">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
