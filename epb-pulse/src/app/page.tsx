import { generateDailyDigest } from "@/lib/insights/digest-generator";
import { DigestCard } from "@/components/pulse/digest-card";
import { Activity, RefreshCw } from "lucide-react";

// Revalidate every hour
export const revalidate = 3600;

export default async function PulsePage() {
  const digest = await generateDailyDigest();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#005F73]/5 to-slate-50">
      {/* Header */}
      <header className="bg-[#005F73] text-white px-4 py-6 pb-8">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5" />
          <span className="text-sm font-medium opacity-90">Daily Pulse</span>
        </div>
        <h1 className="text-xl font-bold mb-1">{digest.greeting}!</h1>
        <p className="text-sm opacity-80">{digest.date}</p>
      </header>

      {/* AI Summary Card */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-[#EE9B00]">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm mb-1">Today's Insight</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {digest.summary}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Digest Sections */}
      <div className="px-4 py-4 space-y-3">
        {digest.sections.map((section) => (
          <DigestCard key={section.id} section={section} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 pb-6 text-center">
        <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
          <RefreshCw className="w-3 h-3" />
          <span>
            Updated {new Date(digest.generatedAt).toLocaleTimeString("en-MY", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
