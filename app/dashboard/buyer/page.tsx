"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import type {
  Order, PaginatedResponse, FavoriteItem, BuyerDashboardStats
} from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Loader2,
  Heart,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Car,
  Calendar,
  TrendingUp,
  ChevronRight,
  ShoppingBag,
  Star,
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

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className={`bg-white rounded-2xl border border-slate-100 p-5 ${href ? "hover:border-accent/30 hover:shadow-sm transition-all cursor-pointer" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {href && <ChevronRight className="w-4 h-4 text-slate-300" />}
      </div>
      <div className="text-2xl font-black text-slate-900 mb-0.5">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ---------------------------------------------------------------------------
// Active Order Mini Card
// ---------------------------------------------------------------------------
function ActiveOrderCard({ order }: { order: Order }) {
  const listing = order.car;
  const progress = STATUS_PROGRESS[order.status] ?? 0;
  const statusColor = STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600";
  const countryFlag = COUNTRY_FLAGS[listing?.source_country?.toLowerCase() ?? ""] ?? "🌍";
  const rawImage = listing?.primary_image;
  const imageUrl = rawImage
    ? (rawImage.startsWith("http") ? rawImage : getImageUrl(rawImage))
    : "/images/car-placeholder.jpg";

  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-accent/30 hover:shadow-sm transition-all group"
    >
      <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
        <Image src={imageUrl} alt={`${listing.make} ${listing.model}`} fill className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-semibold text-slate-900 truncate">
            {listing.year} {listing.make} {listing.model}
          </span>
          <span>{countryFlag}</span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor}`}>
            {order.status_display}
          </span>
          {order.estimated_delivery_date && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(order.estimated_delivery_date)}
            </span>
          )}
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent transition-colors flex-shrink-0" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Favorite Mini Card
// ---------------------------------------------------------------------------
function FavoriteCard({ item }: { item: FavoriteItem }) {
  const listing = item.listing;
  const imageUrl = listing.images?.[0]?.image_url
    ?? (listing.images?.[0]?.image ? getImageUrl(listing.images[0].image) : "/images/car-placeholder.jpg");

  return (
    <Link
      href={`/car/${listing.id}`}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-accent/30 hover:shadow-sm transition-all group"
    >
      <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
        <Image src={imageUrl} alt={`${listing.make} ${listing.model}`} fill className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">
          {listing.year} {listing.make} {listing.model}
        </p>
        <p className="text-xs text-accent font-medium">{formatSAR(listing.price)}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-accent transition-colors flex-shrink-0" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function BuyerDashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const { data: statsData } = useApiQuery<BuyerDashboardStats>(
    "/api/dashboard/buyer/",
    { enabled: isAuthenticated }
  );

  const { data: ordersData, isLoading: ordersLoading } = useApiQuery<PaginatedResponse<Order> | Order[]>(
    "/api/orders/?status=active&page_size=5",
    { enabled: isAuthenticated }
  );

  const { data: favData, isLoading: favLoading } = useApiQuery<PaginatedResponse<FavoriteItem>>(
    "/api/favorites/?page_size=6",
    { enabled: isAuthenticated }
  );

  if (authLoading) {
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
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-4">Sign in to view your dashboard</p>
          <Link href="/auth/signin" className="px-6 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-600 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const allOrders: Order[] = Array.isArray(ordersData)
    ? ordersData
    : (ordersData?.results ?? []);
  const activeOrders = allOrders.filter(
    o => o.status !== "cancelled" && o.status !== "refunded" && o.status !== "delivered"
  );

  const favorites = favData?.results ?? [];

  // Stats — use API data if available, fall back to counts from loaded data
  const stats = {
    active_orders:    statsData?.active_orders    ?? activeOrders.length,
    completed_orders: statsData?.completed_orders ?? 0,
    favorites_count:  statsData?.favorites_count  ?? (favData?.count ?? favorites.length),
    unread_messages:  statsData?.unread_messages  ?? 0,
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-slate-500 text-sm mt-1">Here's an overview of your import activity.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Active Orders"
            value={stats.active_orders}
            icon={Package}
            color="bg-accent/10 text-accent"
            href="/orders"
          />
          <StatCard
            label="Completed"
            value={stats.completed_orders}
            icon={CheckCircle}
            color="bg-green-100 text-green-600"
            href="/orders?tab=completed"
          />
          <StatCard
            label="Favorites"
            value={stats.favorites_count}
            icon={Heart}
            color="bg-red-100 text-red-500"
            href="/favorites"
          />
          <StatCard
            label="Messages"
            value={stats.unread_messages}
            icon={MessageSquare}
            color="bg-blue-100 text-blue-600"
            href="/messages"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Orders */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-400" />
                Active Orders
              </h2>
              <Link href="/orders" className="text-sm text-accent hover:text-accent-600 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {ordersLoading ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-4">No active orders yet</p>
                <Link
                  href="/browse"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Browse Imports
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <ActiveOrderCard key={order.id} order={order} />
                ))}
              </div>
            )}

            {/* Find your next car CTA */}
            <Link
              href="/browse"
              className="mt-4 flex items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl text-white hover:bg-[#1a1a1a] transition-colors group"
            >
              <div>
                <p className="font-bold text-sm">Find your next import</p>
                <p className="text-xs text-white/80">Browse verified cars from USA, Japan, Europe &amp; more</p>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Favorites Sidebar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-slate-400" />
                Saved Cars
              </h2>
              <Link href="/favorites" className="text-sm text-accent hover:text-accent-600 font-medium flex items-center gap-1">
                All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {favLoading ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
                <Heart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No saved cars yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {favorites.map((item) => (
                  <FavoriteCard key={item.id} item={item} />
                ))}
                {(favData?.count ?? 0) > favorites.length && (
                  <Link
                    href="/favorites"
                    className="block text-center text-sm text-accent hover:text-accent-600 font-medium py-2"
                  >
                    +{(favData?.count ?? 0) - favorites.length} more
                  </Link>
                )}
              </div>
            )}

            {/* Calculator promo */}
            <Link
              href="/calculator"
              className="mt-4 flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 hover:border-accent/40 rounded-2xl transition-colors group"
            >
              <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">Import Calculator</p>
                <p className="text-xs text-slate-400">Estimate your total landed cost</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
