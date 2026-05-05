"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { Order, PaginatedResponse } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Package,
  Loader2,
  ChevronRight,
  Calendar,
  ArrowRight,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { getImageUrl } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatSAR = (n: number | null | undefined) => {
  if (n == null) return "—";
  const num = typeof (n as unknown) === "string" ? parseFloat(n as unknown as string) : n;
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const COUNTRY_FLAGS: Record<string, string> = {
  usa: "🇺🇸", us: "🇺🇸", japan: "🇯🇵", jp: "🇯🇵",
  uae: "🇦🇪", ae: "🇦🇪", korea: "🇰🇷", kr: "🇰🇷",
  germany: "🇩🇪", de: "🇩🇪", uk: "🇬🇧", gb: "🇬🇧",
  canada: "🇨🇦", ca: "🇨🇦",
};

const STATUS_PROGRESS: Record<string, number> = {
  pending: 5, deposit_requested: 10, deposit_paid: 15, confirmed: 20,
  sourcing: 28, purchased: 38, preparing_shipment: 46,
  shipped: 55, arrived_port: 65, in_customs: 73, customs_cleared: 80,
  inspection: 87, ready: 94, delivered: 100, completed: 100,
  cancelled: 0, refunded: 0, disputed: 0,
};

const STATUS_COLORS: Record<string, string> = {
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
  disputed:           "bg-red-100 text-red-700",
};

type FilterTab = "all" | "active" | "completed" | "cancelled";

const ACTIVE_STATUSES = new Set([
  "pending", "deposit_requested", "deposit_paid", "confirmed",
  "sourcing", "purchased", "preparing_shipment",
  "shipped", "arrived_port", "in_customs", "customs_cleared",
  "inspection", "ready",
]);
const COMPLETED_STATUSES = new Set(["delivered", "completed"]);
const CANCELLED_STATUSES = new Set(["cancelled", "refunded", "disputed"]);

function filterOrders(orders: Order[], tab: FilterTab): Order[] {
  if (tab === "all") return orders;
  if (tab === "active") return orders.filter(o => ACTIVE_STATUSES.has(o.status));
  if (tab === "completed") return orders.filter(o => COMPLETED_STATUSES.has(o.status));
  if (tab === "cancelled") return orders.filter(o => CANCELLED_STATUSES.has(o.status));
  return orders;
}

// ---------------------------------------------------------------------------
// Order Card
// ---------------------------------------------------------------------------
function OrderCard({ order }: { order: Order }) {
  const listing = order.car;
  const progress = STATUS_PROGRESS[order.status] ?? 0;
  const statusColor = STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600";
  const countryFlag = COUNTRY_FLAGS[listing?.source_country?.toLowerCase() ?? ""] ?? "🌍";
  const rawImage = listing?.primary_image;
  const imageUrl = rawImage
    ? (rawImage.startsWith("http") ? rawImage : getImageUrl(rawImage))
    : "/images/car-placeholder.jpg";
  const isCancelled = CANCELLED_STATUSES.has(order.status);

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block bg-white rounded-2xl border border-slate-100 hover:border-accent/30 hover:shadow-md transition-all group"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Car image */}
          <div className="relative w-24 h-18 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 aspect-[4/3]">
            <Image
              src={imageUrl}
              alt={`${listing.make} ${listing.model}`}
              fill
              className="object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base font-bold text-slate-900">
                    {listing.year} {listing.make} {listing.model}
                  </span>
                  <span className="text-lg">{countryFlag}</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">{order.order_number}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                  {order.status_display}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent transition-colors" />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
              {order.importer && (
                <span className="flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" />
                  {order.importer.name}
                </span>
              )}
              {order.estimated_delivery_date && !isCancelled && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  ETA: {formatDate(order.estimated_delivery_date)}
                </span>
              )}
              <span className="font-semibold text-slate-700">
                {formatSAR(listing.final_price_sar ?? listing.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {!isCancelled && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        {isCancelled && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-red-500">
            <XCircle className="w-4 h-4" />
            <span>Order {order.status_display.toLowerCase()}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MyOrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const { data, isLoading } = useApiQuery<PaginatedResponse<Order> | Order[]>(
    "/api/orders/",
    { enabled: isAuthenticated }
  );

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-4">Sign in to view your orders</p>
          <Link href="/auth/signin" className="px-6 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-600 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const allOrders: Order[] = Array.isArray(data) ? data : (data?.results ?? []);
  const filteredOrders = filterOrders(allOrders, activeTab);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all",       label: "All",       count: allOrders.length },
    { key: "active",    label: "Active",    count: allOrders.filter(o => ACTIVE_STATUSES.has(o.status)).length },
    { key: "completed", label: "Completed", count: allOrders.filter(o => COMPLETED_STATUSES.has(o.status)).length },
    { key: "cancelled", label: "Cancelled", count: allOrders.filter(o => CANCELLED_STATUSES.has(o.status)).length },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900">My Orders</h1>
          <p className="text-slate-500 text-sm mt-1">Track your imported car reservations</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-accent text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-700 mb-2">
              {activeTab === "all" ? "No orders yet" : `No ${activeTab} orders`}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {activeTab === "all"
                ? "When you reserve an imported car, it will appear here."
                : `You don't have any ${activeTab} orders.`}
            </p>
            {activeTab === "all" && (
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Browse Imported Cars
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
