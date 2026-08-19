"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { Order, PaginatedResponse } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import {
  Package, Plus, DollarSign, Star,
  Loader2, ChevronRight, Car, Users, Clock, ArrowRight,
} from "lucide-react";
import { getImageUrl } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ImporterStats {
  total_cars_listed:           number;
  live_listings_count:         number;
  pending_approval_count:      number;
  sold_count:                  number;
  active_orders_count:         number;
  completed_orders_this_month: number;
  revenue_this_month:          number;
  average_rating:              number | null;
}

interface PipelineListing {
  id:            number;
  make:          string;
  model:         string;
  year:          number;
  import_status: string;
  primary_image: string | null;
  buyer_name:    string | null;
  final_price_sar: number | null;
}

interface PipelineColumn {
  status:   string;
  label:    string;
  count:    number;
  listings: PipelineListing[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatSAR = (n: number | null | undefined) => {
  if (n == null) return "—";
  const num = typeof (n as unknown) === "string" ? parseFloat(n as unknown as string) : n;
  return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(num);
};

const formatDate = (s: string) => new Date(s).toLocaleDateString("en-SA", { month: "short", day: "numeric" });

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:            "bg-yellow-100 text-yellow-700",
  deposit_requested:  "bg-yellow-100 text-yellow-800",
  deposit_paid:       "bg-blue-100 text-blue-700",
  confirmed:          "bg-blue-100 text-blue-700",
  sourcing:           "bg-accent/10 text-accent",
  purchased:          "bg-accent/10 text-accent",
  preparing_shipment: "bg-[#f3f4f6] text-[#0a0a0a]",
  shipped:            "bg-[#f3f4f6] text-[#0a0a0a]",
  arrived_port:       "bg-purple-100 text-purple-700",
  in_customs:         "bg-orange-100 text-orange-700",
  customs_cleared:    "bg-[#f3f4f6] text-[#0a0a0a]",
  inspection:         "bg-orange-100 text-orange-700",
  ready:              "bg-green-100 text-green-700",
  delivered:          "bg-green-100 text-green-700",
  completed:          "bg-green-100 text-green-700",
  cancelled:          "bg-red-100 text-red-600",
  refunded:           "bg-slate-100 text-slate-600",
};

const COLUMN_COLORS: Record<string, string> = {
  sourcing:          "border-t-slate-300",
  available:         "border-t-accent",
  reserved:          "border-t-blue-400",
  shipped:           "border-t-indigo-400",
  in_customs:        "border-t-orange-400",
  ready:             "border-t-green-400",
};

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Card
// ---------------------------------------------------------------------------
function PipelineCarCard({ listing }: { listing: PipelineListing }) {
  const img = listing.primary_image
    ? (listing.primary_image.startsWith("http") ? listing.primary_image : getImageUrl(listing.primary_image))
    : "/images/car-placeholder.jpg";

  return (
    <Link
      href={`/car/${listing.id}`}
      className="block bg-white rounded-xl border border-slate-100 hover:border-accent/30 transition-all overflow-hidden group"
    >
      <div className="relative h-20 bg-slate-100">
        <Image src={img} alt={`${listing.make} ${listing.model}`} fill className="object-cover" />
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
          {listing.year} {listing.make} {listing.model}
        </p>
        <p className="text-xs text-accent font-medium mt-0.5">{formatSAR(listing.final_price_sar)}</p>
        {listing.buyer_name && (
          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 truncate">
            <Users className="w-2.5 h-2.5 flex-shrink-0" />
            {listing.buyer_name}
          </p>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------
type PipelineApiResponse = Record<string, PipelineListing[]>;

const COLUMN_LABELS: Record<string, string> = {
  pending_approval:  "Pending Approval",
  sourcing:          "Sourcing",
  available:         "Available",
  reserved:          "Reserved",
  shipped:           "Shipping",
  in_customs:        "In Customs",
  customs_cleared:   "Cleared",
  ready:             "Ready",
};

function PipelineSection() {
  const { data: pipelineData, isLoading, error } = useApiQuery<PipelineApiResponse>(
    "/api/dashboard/importer/pipeline/"
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !pipelineData || typeof pipelineData !== "object" || Array.isArray(pipelineData)) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 mb-4">No cars in your pipeline yet.</p>
        <Link
          href="/dashboard/importer/list-car"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          List Your First Car
        </Link>
      </div>
    );
  }

  const columns: PipelineColumn[] = Object.entries(pipelineData).map(([status, listings]) => ({
    status,
    label:    COLUMN_LABELS[status] ?? status.replace(/_/g, " "),
    count:    listings.length,
    listings: listings,
  }));

  if (columns.length === 0 || columns.every((c) => c.count === 0)) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 mb-4">No cars in your pipeline yet.</p>
        <Link
          href="/dashboard/importer/list-car"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          List Your First Car
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-2">
      <div className="flex gap-4 min-w-max">
        {columns.map((col) => (
          <div
            key={col.status}
            className={`w-48 bg-slate-50 rounded-2xl border border-t-4 border-slate-100 overflow-hidden flex-shrink-0 ${COLUMN_COLORS[col.status] ?? "border-t-slate-300"}`}
          >
            <div className="px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide truncate">{col.label}</span>
              <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                {col.count}
              </span>
            </div>
            <div className="px-2 pb-2 space-y-2">
              {col.listings.length === 0 ? (
                <div className="h-16 flex items-center justify-center">
                  <p className="text-[10px] text-slate-300">Empty</p>
                </div>
              ) : (
                col.listings.slice(0, 5).map((l) => (
                  <PipelineCarCard key={l.id} listing={l} />
                ))
              )}
              {col.count > 5 && (
                <p className="text-center text-[10px] text-slate-400 py-1">+{col.count - 5} more</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ImporterDashboardPage() {
  const { isAuthenticated } = useAuth();

  const { data: stats, isLoading: statsLoading } = useApiQuery<ImporterStats>(
    "/api/dashboard/importer/",
    { enabled: isAuthenticated }
  );

  const { data: recentOrdersData, isLoading: ordersLoading } = useApiQuery<
    PaginatedResponse<Order> | Order[]
  >("/api/orders/?page_size=5", { enabled: isAuthenticated });

  const recentOrders: Order[] = Array.isArray(recentOrdersData)
    ? recentOrdersData
    : (recentOrdersData?.results ?? []);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Importer Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Your import pipeline at a glance.</p>
        </div>
        <Link
          href="/dashboard/importer/list-car"
          className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          List New Car
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Live Listings" value={stats?.live_listings_count ?? 0} sub={`${stats?.total_cars_listed ?? 0} total cars`} icon={Car} color="bg-slate-100 text-slate-600" />
        <StatCard label="Pending Approval" value={stats?.pending_approval_count ?? 0} sub="Awaiting admin review" icon={Clock} color="bg-amber-100 text-amber-600" />
        <StatCard label="Active Orders" value={stats?.active_orders_count ?? 0} icon={Package} color="bg-accent/10 text-accent" />
        <StatCard label="Revenue (Month)" value={formatSAR(stats?.revenue_this_month)} sub={`${stats?.completed_orders_this_month ?? 0} completed this month`} icon={DollarSign} color="bg-emerald-100 text-emerald-600" />
        <StatCard label="Rating" value={stats?.average_rating != null && Number(stats.average_rating) > 0 ? Number(stats.average_rating).toFixed(1) : "—"} sub="Average from buyers" icon={Star} color="bg-yellow-100 text-yellow-600" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: "/dashboard/importer/list-car", label: "List New Car", icon: Plus },
          { href: "/dashboard/importer/orders",   label: "Manage Orders", icon: Package },
          { href: "/messages",                    label: "Messages", icon: Users },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-100 hover:border-accent hover:text-accent text-slate-700 transition-colors text-sm font-medium"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </Link>
        ))}
      </div>

      {/* Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">Import Pipeline</h2>
          <Link href="/browse" className="text-sm text-accent hover:text-accent-600 font-medium flex items-center gap-1">
            View all listings <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <PipelineSection />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent Orders</h2>
          <Link href="/dashboard/importer/orders" className="text-xs text-accent hover:underline">
            View all
          </Link>
        </div>
        {ordersLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-400 text-sm">No orders yet.</div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 font-mono">{order.order_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {order.status_display}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {order.car?.year} {order.car?.make} {order.car?.model}
                      {order.importer && ` · ${order.importer.name}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-800">{formatSAR(order.car?.final_price_sar ?? order.car?.price)}</p>
                    <p className="text-xs text-slate-400">{formatDate(order.created_at)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent transition-colors flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
