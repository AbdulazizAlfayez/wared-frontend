"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import {
  Loader2, ArrowLeft, Clock, CheckCircle, XCircle,
  Car, User, Calendar, DollarSign, AlertTriangle, MessageSquare,
} from "lucide-react";
import { useToast } from "@/components/Toast";

// ---------------------------------------------------------------------------
// Types (matches GET /api/reservations/pending-for-me/ response)
// ---------------------------------------------------------------------------
interface PendingReservation {
  id:                   number;
  reservation_number:   string;
  car: {
    id:              number;
    title:           string;
    make:            string;
    model:           string;
    year:            number;
    final_price_sar: string;
  };
  buyer: {
    id:           number;
    name:         string;
    member_since: string;
  };
  platform_fee_sar:      string;
  paid_at:               string | null;
  created_at:            string;
  time_remaining_hours:  number;
}

interface PendingResponse {
  count:   number;
  results: PendingReservation[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatSAR = (n: string | number | null | undefined) => {
  if (n == null) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(num);
};

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("en-SA", { year: "numeric", month: "short", day: "numeric" });

const formatHours = (h: number) => {
  if (h <= 0) return "Expired";
  const days = Math.floor(h / 24);
  const hrs  = Math.round(h % 24);
  if (days > 0) return `${days}d ${hrs}h remaining`;
  return `${hrs}h remaining`;
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ImporterReservationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const { data, isLoading, refetch } = useApiQuery<PendingResponse>(
    "/api/reservations/pending-for-me/",
    { enabled: isAuthenticated }
  );

  const reservations = data?.results ?? [];

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId]   = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // ── Accept ──
  const handleAccept = async (id: number) => {
    setProcessingId(id);
    try {
      await api.post(`/api/reservations/${id}/accept/`);
      showToast("success", "Reservation accepted — order created.");
      refetch();
    } catch {
      showToast("error", "Failed to accept reservation.");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Reject ──
  const handleReject = async (id: number) => {
    setProcessingId(id);
    try {
      await api.post(`/api/reservations/${id}/reject/`, { reason: rejectReason });
      showToast("success", "Reservation rejected.");
      setRejectingId(null);
      setRejectReason("");
      refetch();
    } catch {
      showToast("error", "Failed to reject reservation.");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Auth / loading ──
  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/importer" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pending Reservations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {reservations.length > 0
              ? `${reservations.length} reservation${reservations.length !== 1 ? "s" : ""} awaiting your decision`
              : "Review and respond to buyer reservation requests"}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {reservations.length === 0 && !isLoading && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-1">No pending reservations</h2>
          <p className="text-sm text-slate-400">When a buyer reserves one of your cars, it will appear here for your approval.</p>
        </div>
      )}

      {/* Reservation cards */}
      <div className="space-y-4">
        {reservations.map((res) => {
          const isProcessing = processingId === res.id;
          const isRejecting  = rejectingId === res.id;
          const urgent = res.time_remaining_hours <= 24;

          return (
            <div key={res.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {/* Urgency banner */}
              {urgent && res.time_remaining_hours > 0 && (
                <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center gap-2 text-amber-800 text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Less than 24 hours to respond — reservation expires soon
                </div>
              )}
              {res.time_remaining_hours <= 0 && (
                <div className="bg-red-50 border-b border-red-200 px-5 py-2 flex items-center gap-2 text-red-700 text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Reservation expired — will be auto-cancelled
                </div>
              )}

              <div className="p-5">
                {/* Top row: car + buyer */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  {/* Car info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Car className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/car/${res.car.id}`}
                        className="font-semibold text-slate-900 text-sm hover:text-accent transition-colors truncate block"
                      >
                        {res.car.year} {res.car.make} {res.car.model}
                      </Link>
                      <p className="text-xs text-slate-400">{res.car.title}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-slate-900">{formatSAR(res.car.final_price_sar)}</p>
                    <p className="text-[11px] text-slate-400">Car price</p>
                  </div>
                </div>

                {/* Detail chips */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
                  <Link href={`/user/${res.buyer.id}`} className="flex items-center gap-1.5 text-accent hover:underline font-medium" title="View buyer profile">
                    <User className="w-3.5 h-3.5" /> {res.buyer.name}
                  </Link>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(res.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    {res.paid_at ? "Deposit paid" : "Pending deposit"}
                  </span>
                  <span className={`flex items-center gap-1.5 font-medium ${urgent ? "text-amber-700" : "text-slate-500"}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {formatHours(res.time_remaining_hours)}
                  </span>
                  <span className="text-slate-300 font-mono">{res.reservation_number}</span>
                </div>

                {/* Reject reason form (shown when rejecting) */}
                {isRejecting && (
                  <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Reason for rejection (optional)</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Car is no longer available..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-accent resize-none"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleReject(res.id)}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Confirm rejection
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(""); }}
                        className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {!isRejecting && (
                  <div className="flex gap-3">
                    <Link
                      href={`/messages?buyer_user=${res.buyer.id}&car_id=${res.car.id}`}
                      className="py-2.5 px-4 border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                      title="Chat with the buyer before deciding"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </Link>
                    <button
                      onClick={() => handleAccept(res.id)}
                      disabled={isProcessing || res.time_remaining_hours <= 0}
                      className="flex-1 py-2.5 bg-[#0A0A0A] hover:bg-black disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Accept
                    </button>
                    <button
                      onClick={() => setRejectingId(res.id)}
                      disabled={isProcessing || res.time_remaining_hours <= 0}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
