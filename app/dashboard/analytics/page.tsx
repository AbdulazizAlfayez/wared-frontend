"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { Loader2, TrendingUp, Eye, Users, BarChart2, Download, ArrowUp, ArrowDown, Minus } from "lucide-react";

// ---------------------------------------------------------------------------
// Analytics types
// ---------------------------------------------------------------------------

interface AnalyticsSummary {
  total_views: number;
  unique_views: number;
  total_leads: number;
  conversion_rate: number;
  views_trend: { date: string; views: number }[];
  leads_trend: { date: string; leads: number }[];
  views_by_source: { source: string; count: number }[];
  peak_hours: { hour: number; count: number }[];
}

interface ListingPerformance {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  primary_image: string | null;
  views: number;
  unique_views: number;
  leads: number;
  conversion_rate: number;
  status: string;
}

interface CompareStats {
  your_avg_views: number;
  platform_avg_views: number;
  your_avg_leads: number;
  platform_avg_leads: number;
}

// ---------------------------------------------------------------------------
// Mini bar chart using styled divs
// ---------------------------------------------------------------------------

function BarChart({
  data,
  valueKey,
  labelKey,
  color = "bg-accent",
  height = 80,
}: {
  data: Record<string, number | string>[];
  valueKey: string;
  labelKey: string;
  color?: string;
  height?: number;
}) {
  const values = data.map((d) => Number(d[valueKey]));
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-0.5 overflow-hidden" style={{ height }}>
      {data.map((d, i) => {
        const val = Number(d[valueKey]);
        const pct = (val / max) * 100;
        return (
          <div
            key={i}
            className="flex-1 group relative"
            style={{ minWidth: 2 }}
          >
            <div
              className={`w-full ${color} rounded-t-sm opacity-80 group-hover:opacity-100 transition-all`}
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-10">
              {String(d[labelKey])}: {val}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  suffix,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">
          {value}
          {suffix && <span className="text-base font-medium text-slate-500 ml-0.5">{suffix}</span>}
        </p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function CompareIndicator({ yours, platform, label }: { yours: number | string; platform: number | string; label: string }) {
  const y = Number(yours);
  const p = Number(platform);
  const diff = y - p;
  const pct = p > 0 ? Math.round((Math.abs(diff) / p) * 100) : 0;
  const isAbove = diff > 0;
  const isEqual = diff === 0;
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">Platform avg: {p.toFixed(1)}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-900">{y.toFixed(1)}</span>
        {isEqual ? (
          <span className="flex items-center gap-0.5 text-xs text-slate-400">
            <Minus className="w-3 h-3" /> avg
          </span>
        ) : isAbove ? (
          <span className="flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
            <ArrowUp className="w-3 h-3" /> +{pct}%
          </span>
        ) : (
          <span className="flex items-center gap-0.5 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">
            <ArrowDown className="w-3 h-3" /> -{pct}%
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuth();

  const { data: analytics, isLoading } = useApiQuery<AnalyticsSummary>(
    "/api/dashboard/dealer/analytics/",
    { enabled: isAuthenticated }
  );

  const { data: listingsPerf } = useApiQuery<{ results: ListingPerformance[] }>(
    "/api/dashboard/dealer/analytics/listings/",
    { enabled: isAuthenticated }
  );

  const { data: compare } = useApiQuery<CompareStats>(
    "/api/dashboard/dealer/analytics/compare/",
    { enabled: isAuthenticated }
  );

  const handleExport = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/dashboard/dealer/analytics/export/?export_format=csv`,
      "_blank"
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const viewsTrend = analytics?.views_trend ?? [];
  const leadsTrend = analytics?.leads_trend ?? [];
  const peakHours = analytics?.peak_hours ?? [];
  const listings = listingsPerf?.results ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Performance insights for your listings</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-accent hover:text-accent text-slate-600 rounded-xl text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Views"
          value={analytics?.total_views ?? 0}
          icon={Eye}
          color="bg-accent/10 text-accent"
        />
        <StatCard
          label="Unique Views"
          value={analytics?.unique_views ?? 0}
          icon={Eye}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Total Leads"
          value={analytics?.total_leads ?? 0}
          icon={Users}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          label="Conversion Rate"
          value={`${Number(analytics?.conversion_rate ?? 0).toFixed(1)}`}
          suffix="%"
          icon={TrendingUp}
          color="bg-green-100 text-green-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Views trend */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Views — Last 30 Days</h2>
              <p className="text-xs text-slate-400 mt-0.5">Daily view count trend</p>
            </div>
            <BarChart2 className="w-5 h-5 text-slate-300" />
          </div>
          {viewsTrend.length === 0 ? (
            <div className="h-20 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          ) : (
            <BarChart
              data={viewsTrend as unknown as Record<string, number | string>[]}
              valueKey="views"
              labelKey="date"
              color="bg-accent"
              height={80}
            />
          )}
        </div>

        {/* Leads trend */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Leads — Last 30 Days</h2>
              <p className="text-xs text-slate-400 mt-0.5">Daily lead count trend</p>
            </div>
            <BarChart2 className="w-5 h-5 text-slate-300" />
          </div>
          {leadsTrend.length === 0 ? (
            <div className="h-20 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          ) : (
            <BarChart
              data={leadsTrend as unknown as Record<string, number | string>[]}
              valueKey="leads"
              labelKey="date"
              color="bg-blue-400"
              height={80}
            />
          )}
        </div>
      </div>

      {/* Peak hours + Views by source */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Peak hours */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-1">Peak Hours</h2>
          <p className="text-xs text-slate-400 mb-4">When buyers view your listings most (24h)</p>
          {peakHours.length === 0 ? (
            <div className="h-16 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          ) : (
            <BarChart
              data={peakHours.map((h) => ({ hour: `${h.hour}:00`, count: h.count })) as unknown as Record<string, number | string>[]}
              valueKey="count"
              labelKey="hour"
              color="bg-purple-400"
              height={60}
            />
          )}
        </div>

        {/* Views by source */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Views by Source</h2>
          {(!analytics?.views_by_source || analytics.views_by_source.length === 0) ? (
            <div className="h-16 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          ) : (
            <div className="space-y-2">
              {analytics.views_by_source.map((s) => {
                const total = analytics.views_by_source.reduce((sum, x) => sum + x.count, 0);
                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                return (
                  <div key={s.source}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="capitalize text-slate-700">{s.source}</span>
                      <span className="text-slate-500">{s.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Comparison */}
      {compare && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-1">Platform Comparison</h2>
          <p className="text-xs text-slate-400 mb-4">How your listings perform vs. platform average</p>
          <CompareIndicator
            yours={compare.your_avg_views}
            platform={compare.platform_avg_views}
            label="Avg. views per listing"
          />
          <CompareIndicator
            yours={compare.your_avg_leads}
            platform={compare.platform_avg_leads}
            label="Avg. leads per listing"
          />
        </div>
      )}

      {/* Per-listing performance table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Listing Performance</h2>
          <p className="text-xs text-slate-400 mt-0.5">Views, leads, and conversion per listing</p>
        </div>
        {listings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No listings data yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase">
                  <th className="px-5 py-3 text-left">Car</th>
                  <th className="px-5 py-3 text-right">Views</th>
                  <th className="px-5 py-3 text-right">Unique</th>
                  <th className="px-5 py-3 text-right">Leads</th>
                  <th className="px-5 py-3 text-right">Conv. %</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {l.primary_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={l.primary_image}
                            alt=""
                            className="w-12 h-9 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-9 rounded-lg bg-slate-100 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate max-w-[160px]">
                            {l.year} {l.make} {l.model}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Intl.NumberFormat("en-SA", {
                              style: "currency",
                              currency: "SAR",
                              maximumFractionDigits: 0,
                            }).format(l.price)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700">{l.views}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{l.unique_views}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{l.leads}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-medium ${Number(l.conversion_rate) >= 5 ? "text-green-600" : Number(l.conversion_rate) >= 2 ? "text-yellow-600" : "text-slate-500"}`}>
                        {Number(l.conversion_rate).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        l.status === "approved" ? "bg-green-100 text-green-700" :
                        l.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        l.status === "sold" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
