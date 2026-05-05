"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { ServiceBooking, PaginatedResponse } from "@/lib/types";
import {
  Wrench, Loader2, ArrowRight, Calendar, Clock, Car,
  X, CheckCircle, AlertCircle, Building2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  pending:     "bg-yellow-100 text-yellow-700",
  confirmed:   "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed:   "bg-slate-100 text-slate-600",
  cancelled:   "bg-red-100 text-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  pending:     "Pending",
  confirmed:   "Confirmed",
  in_progress: "In Progress",
  completed:   "Completed",
  cancelled:   "Cancelled",
};

// ---------------------------------------------------------------------------
// Cancel confirmation modal
// ---------------------------------------------------------------------------

function CancelModal({
  onConfirm,
  onClose,
  isLoading,
}: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Booking</h3>
        <p className="text-sm text-slate-500 mb-4">
          Let the workshop know why you&apos;re cancelling.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional reason…"
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent resize-none mb-4"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm"
          >
            Keep Booking
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Booking card
// ---------------------------------------------------------------------------

function BookingCard({
  booking,
  onCancel,
}: {
  booking: ServiceBooking;
  onCancel: (id: number) => void;
}) {
  const canCancel = booking.status === "pending";

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-5 ${
        booking.status === "confirmed"
          ? "border-green-200"
          : booking.status === "pending"
          ? "border-yellow-200"
          : "border-slate-100"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Date block */}
        <div className="bg-accent/10 rounded-xl px-4 py-3 text-center flex-shrink-0 min-w-[70px]">
          <p className="text-2xl font-bold text-accent leading-none">
            {new Date(booking.booking_date).getDate()}
          </p>
          <p className="text-xs font-semibold text-accent mt-0.5">
            {new Date(booking.booking_date).toLocaleString("en", { month: "short" })}
          </p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-slate-900">
              {booking.workshop_name}
            </p>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status] ?? "bg-slate-100 text-slate-600"}`}
            >
              {STATUS_LABEL[booking.status] ?? booking.status}
            </span>
          </div>

          {booking.service_name && (
            <p className="text-sm text-accent font-medium mb-1.5">
              {booking.service_name}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5" />
              {booking.vehicle_year} {booking.vehicle_make} {booking.vehicle_model}
              {booking.vehicle_plate && ` · ${booking.vehicle_plate}`}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {booking.booking_time.slice(0, 5)}
            </span>
          </div>

          {booking.description && (
            <p className="mt-1.5 text-xs text-slate-400 italic line-clamp-2">
              &ldquo;{booking.description}&rdquo;
            </p>
          )}

          {/* Cost */}
          {(booking.estimated_cost || booking.final_cost) && (
            <div className="mt-2 flex gap-3 text-xs">
              {booking.estimated_cost && (
                <span className="text-slate-500">
                  Est: <span className="font-medium text-slate-700">SAR {booking.estimated_cost}</span>
                </span>
              )}
              {booking.final_cost && (
                <span className="text-slate-500">
                  Final: <span className="font-semibold text-accent">SAR {booking.final_cost}</span>
                </span>
              )}
            </div>
          )}

          {booking.cancellation_reason && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {booking.cancellation_reason}
            </div>
          )}

          {booking.notes && booking.status !== "cancelled" && (
            <p className="mt-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-2 py-1">
              Workshop note: {booking.notes}
            </p>
          )}
        </div>

        {/* Cancel button */}
        {canCancel && (
          <button
            onClick={() => onCancel(booking.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors border border-red-200 flex-shrink-0"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}

        {booking.status === "completed" && (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type Tab = "upcoming" | "past" | "all";

export default function ServiceBookingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>("upcoming");
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data, isLoading, refetch } = useApiQuery<PaginatedResponse<ServiceBooking>>(
    "/api/service-bookings/?page_size=100",
    { enabled: isAuthenticated }
  );

  const all = data?.results ?? [];
  const now = new Date();

  const upcoming = all.filter((b) => {
    const dt = new Date(`${b.booking_date}T${b.booking_time}`);
    return dt >= now && !["cancelled", "completed"].includes(b.status);
  });

  const past = all.filter((b) => {
    const dt = new Date(`${b.booking_date}T${b.booking_time}`);
    return dt < now || ["cancelled", "completed"].includes(b.status);
  });

  const displayed = tab === "upcoming" ? upcoming : tab === "past" ? past : all;

  const handleCancel = useCallback(
    async (id: number, reason: string) => {
      setIsCancelling(true);
      try {
        await api.patch(`/api/service-bookings/${id}/`, {
          status: "cancelled",
          cancellation_reason: reason || undefined,
        });
        setCancellingId(null);
        refetch();
      } catch {
        alert("Failed to cancel booking. Please try again.");
      } finally {
        setIsCancelling(false);
      }
    },
    [refetch]
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
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <Wrench className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Sign in to view bookings</h1>
            <p className="text-slate-500 mb-8 text-sm">
              You need to be signed in to view your workshop service bookings.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors text-sm"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">My Service Bookings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Workshop service appointments you&apos;ve scheduled
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-100 p-1 shadow-sm mb-6 w-fit">
          {(["upcoming", "past", "all"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-accent text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t === "upcoming"
                ? `Upcoming (${upcoming.length})`
                : t === "past"
                ? `Past (${past.length})`
                : `All (${all.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              {tab === "upcoming"
                ? "No upcoming service bookings"
                : tab === "past"
                ? "No past service bookings"
                : "No service bookings yet"}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {tab !== "past"
                ? "Browse workshops to find a service and book an appointment."
                : "Your completed or cancelled bookings will appear here."}
            </p>
            {tab !== "past" && (
              <Link
                href="/workshop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors text-sm"
              >
                <Wrench className="w-4 h-4" />
                Browse Workshops
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={(id) => setCancellingId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {cancellingId !== null && (
        <CancelModal
          isLoading={isCancelling}
          onClose={() => setCancellingId(null)}
          onConfirm={(reason) => handleCancel(cancellingId, reason)}
        />
      )}
    </div>
  );
}
