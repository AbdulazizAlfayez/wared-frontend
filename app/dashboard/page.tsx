"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import type { PaginatedResponse, Listing, Appointment } from "@/lib/types";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Car, Users, Calendar, TrendingUp, Clock, ChevronRight,
  CheckCircle, XCircle, AlertCircle, Eye, Loader2,
} from "lucide-react";

interface DealerStats {
  total_listings: number;
  pending_listings: number;
  approved_listings: number;
  rejected_listings: number;
  sold_listings: number;
}

interface LeadStats {
  total_leads: number;
  new_leads: number;
  leads_today: number;
  avg_response_time_hours: number | null;
}

interface ApptStats {
  total: number;
  by_status: Record<string, number>;
  this_week: number;
  completion_rate: number;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-600">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending:   "bg-yellow-100 text-yellow-700",
    approved:  "bg-green-100 text-green-700",
    rejected:  "bg-red-100 text-red-700",
    sold:      "bg-blue-100 text-blue-700",
    draft:     "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (role === "importer") { router.replace("/dashboard/importer"); return; }
    if (role === "user")     { router.replace("/dashboard/buyer");    return; }
  }, [authLoading, role, router]);

  const { data: stats, isLoading: statsLoading } = useApiQuery<DealerStats>(
    "/api/dashboard/dealer/",
    { enabled: isAuthenticated }
  );

  const { data: leadStats, isLoading: leadStatsLoading } = useApiQuery<LeadStats>(
    "/api/dashboard/dealer/leads/",
    { enabled: isAuthenticated }
  );

  const { data: apptStats } = useApiQuery<ApptStats>(
    "/api/appointments/stats/",
    { enabled: isAuthenticated }
  );

  const { data: recentListingsData, isLoading: listingsLoading } =
    useApiQuery<PaginatedResponse<Listing>>("/api/listings/?page_size=5", {
      enabled: isAuthenticated,
    });

  const { data: upcomingData } = useApiQuery<{ count: number; results: Appointment[] }>(
    "/api/appointments/upcoming/",
    { enabled: isAuthenticated }
  );

  const recentListings = recentListingsData?.results ?? [];
  const upcoming = upcomingData?.results ?? [];

  if (statsLoading || leadStatsLoading || listingsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back — here&apos;s your dashboard summary.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Listings"
          value={stats?.approved_listings ?? 0}
          sub={`${stats?.pending_listings ?? 0} pending review`}
          icon={Car}
          color="bg-accent/10 text-accent"
        />
        <StatCard
          label="Total Leads"
          value={leadStats?.total_leads ?? 0}
          sub={`${leadStats?.new_leads ?? 0} new`}
          icon={Users}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Appointments"
          value={apptStats?.by_status?.["confirmed"] ?? 0}
          sub={`${apptStats?.this_week ?? 0} this week`}
          icon={Calendar}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          label="Cars Sold"
          value={stats?.sold_listings ?? 0}
          sub={`${apptStats?.completion_rate ?? 0}% completion rate`}
          icon={TrendingUp}
          color="bg-green-100 text-green-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/sell", label: "New Listing", icon: Car },
          { href: "/dashboard/leads", label: "View Leads", icon: Users },
          { href: "/dashboard/appointments", label: "Appointments", icon: Calendar },
          { href: "/dashboard/showroom", label: "My Showroom", icon: TrendingUp },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-100 hover:border-accent hover:text-accent text-slate-700 transition-colors text-sm font-medium shadow-sm"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
            <ChevronRight className="w-3 h-3 ml-auto" />
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Listings</h2>
            <Link href="/dashboard/listings" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          {recentListings.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">No listings yet.</div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {recentListings.map((l) => (
                <li key={l.id} className="px-5 py-3 flex items-center gap-3">
                  {l.primary_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.primary_image} alt="" className="w-12 h-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-9 rounded-lg bg-slate-100 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {l.year} {l.make} {l.model}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(l.price)}
                    </p>
                  </div>
                  {statusBadge(l.status)}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Upcoming Appointments</h2>
            <Link href="/dashboard/appointments" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">No upcoming appointments.</div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {upcoming.map((a) => (
                <li key={a.id} className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-900">
                      {a.appointment_date} at {a.appointment_time.slice(0, 5)}
                    </span>
                    <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      confirmed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 ml-6">
                    {a.listing.year} {a.listing.make} {a.listing.model} — {a.buyer.name}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Listing status breakdown */}
      {stats && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Listing Status Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Approved", count: stats.approved_listings, icon: CheckCircle, color: "text-green-600" },
              { label: "Pending", count: stats.pending_listings, icon: AlertCircle, color: "text-yellow-600" },
              { label: "Rejected", count: stats.rejected_listings, icon: XCircle, color: "text-red-500" },
              { label: "Sold", count: stats.sold_listings, icon: Eye, color: "text-blue-600" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <div>
                  <p className="text-lg font-bold text-slate-900">{item.count}</p>
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
