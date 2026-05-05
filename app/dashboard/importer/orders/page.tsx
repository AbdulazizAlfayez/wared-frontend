"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import type { Order, PaginatedResponse } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";
import {
  Loader2, ChevronDown, ChevronRight, Package, ArrowLeft,
  CheckCircle, Calendar, DollarSign, User, ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/Toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type FilterStatus = "all" | "active" | "delivered" | "cancelled";

const ALL_STATUSES: { value: string; label: string }[] = [
  { value: "pending",            label: "Pending" },
  { value: "deposit_requested",  label: "Deposit Requested" },
  { value: "deposit_paid",       label: "Deposit Paid" },
  { value: "confirmed",          label: "Confirmed" },
  { value: "sourcing",           label: "Sourcing" },
  { value: "purchased",          label: "Purchased" },
  { value: "preparing_shipment", label: "Preparing Shipment" },
  { value: "shipped",            label: "Shipped" },
  { value: "arrived_port",       label: "At Port" },
  { value: "in_customs",         label: "In Customs" },
  { value: "customs_cleared",    label: "Customs Cleared" },
  { value: "inspection",         label: "Inspection" },
  { value: "ready",              label: "Ready for Delivery" },
  { value: "delivered",          label: "Delivered" },
  { value: "completed",          label: "Completed" },
  { value: "cancelled",          label: "Cancelled" },
  { value: "refunded",           label: "Refunded" },
];

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
};

const ACTIVE_STATUSES = new Set([
  "pending","deposit_requested","deposit_paid","confirmed",
  "sourcing","purchased","preparing_shipment",
  "shipped","arrived_port","in_customs","customs_cleared","inspection","ready",
]);

const formatSAR = (n: number | null | undefined) => {
  if (n == null) return "—";
  const num = typeof (n as unknown) === "string" ? parseFloat(n as unknown as string) : n;
  return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(num);
};

const formatDate = (s: string) => new Date(s).toLocaleDateString("en-SA", {
  year: "numeric", month: "short", day: "numeric",
});

function filterOrders(orders: Order[], tab: FilterStatus) {
  if (tab === "all")       return orders;
  if (tab === "active")    return orders.filter(o => ACTIVE_STATUSES.has(o.status));
  if (tab === "delivered") return orders.filter(o => o.status === "delivered");
  if (tab === "cancelled") return orders.filter(o => o.status === "cancelled" || o.status === "refunded");
  return orders;
}

// ---------------------------------------------------------------------------
// Status Update Dropdown
// ---------------------------------------------------------------------------
function StatusDropdown({ order, onUpdated }: { order: Order; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  const handleChange = async (newStatus: string) => {
    if (newStatus === order.status) { setOpen(false); return; }
    setUpdating(true);
    try {
      await api.patch(`/api/orders/${order.id}/update-status/`, { status: newStatus });
      onUpdated();
      showToast("success", "Order status updated.");
    } catch {
      showToast("error", "Failed to update status.");
    } finally {
      setUpdating(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={updating}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600"}`}
      >
        {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        {order.status_display}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-8 left-0 z-40 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 overflow-hidden">
            {ALL_STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => handleChange(s.value)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 ${
                  s.value === order.status ? "font-semibold text-accent" : "text-slate-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order Row (expandable)
// ---------------------------------------------------------------------------
function OrderRow({ order, onUpdated }: { order: Order; onUpdated: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const listing = order.car;

  return (
    <>
      <tr
        className="hover:bg-slate-50 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
            <span className="text-sm font-mono font-semibold text-slate-800">{order.order_number}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-slate-800 whitespace-nowrap">
            {listing.year} {listing.make} {listing.model}
          </p>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="text-sm text-slate-600">{order.importer?.name ?? "—"}</span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <StatusDropdown order={order} onUpdated={onUpdated} />
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-medium">
          {formatSAR(order.reservation_fee)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
          {formatSAR(order.total_price ?? listing.final_price_sar ?? listing.price)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
          {formatDate(order.created_at)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/orders/${order.id}`}
            className="text-xs text-accent hover:text-accent-600 font-medium flex items-center gap-1 justify-end"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View
          </Link>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="px-4 pb-4 pt-0">
            <div className="ml-6 bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Payment Status</p>
                <p className="text-sm font-medium text-slate-700 capitalize">{order.payment_status}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Est. Delivery</p>
                <p className="text-sm font-medium text-slate-700">{order.estimated_delivery_date ? formatDate(order.estimated_delivery_date) : "—"}</p>
              </div>
              {order.importer?.phone && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Buyer Phone</p>
                  <a href={`tel:${order.importer.phone}`} className="text-sm font-medium text-accent hover:underline" dir="ltr">{order.importer.phone}</a>
                </div>
              )}
              {order.notes && (
                <div className="col-span-2 sm:col-span-4">
                  <p className="text-xs text-slate-400 mb-0.5">Notes</p>
                  <p className="text-sm text-slate-600">{order.notes}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ImporterOrdersPage() {
  const { isAuthenticated } = useAuth();
  const [filterTab, setFilterTab] = useState<FilterStatus>("all");

  const { data, isLoading, refetch } = useApiQuery<PaginatedResponse<Order> | Order[]>(
    "/api/dashboard/importer/orders/",
    { enabled: isAuthenticated }
  );

  const allOrders: Order[] = Array.isArray(data) ? data : (data?.results ?? []);
  const filtered = filterOrders(allOrders, filterTab);

  const tabs: { key: FilterStatus; label: string }[] = [
    { key: "all",       label: `All (${allOrders.length})` },
    { key: "active",    label: `Active (${allOrders.filter(o => ACTIVE_STATUSES.has(o.status)).length})` },
    { key: "delivered", label: `Delivered (${allOrders.filter(o => o.status === "delivered").length})` },
    { key: "cancelled", label: `Cancelled (${allOrders.filter(o => o.status === "cancelled" || o.status === "refunded").length})` },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage buyer reservations and update order status.</p>
        </div>
        <Link href="/dashboard/importer" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterTab === t.key ? "bg-accent text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Order #", "Car", "Buyer", "Status", "Deposit", "Total", "Date", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((order) => (
                  <OrderRow key={order.id} order={order} onUpdated={refetch} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
