"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { Appointment, PaginatedResponse } from "@/lib/types";
import Link from "next/link";
import { useState, useCallback } from "react";
import { Calendar, Loader2, ArrowRight, Clock, MapPin, X, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  rejected:  "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
  completed: "bg-blue-100 text-blue-700",
  no_show:   "bg-orange-100 text-orange-700",
};

const STATUS_LABEL: Record<string, string> = {
  pending:   "Pending",
  confirmed: "Confirmed",
  rejected:  "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show:   "No Show",
};

// ---------------------------------------------------------------------------
// Cancel modal
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
        <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Appointment</h3>
        <p className="text-sm text-slate-500 mb-4">Please let the seller know why you&apos;re cancelling.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional reason..."
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent resize-none mb-4"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm"
          >
            Keep Appointment
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Cancel It
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type Tab = "upcoming" | "past" | "all";

export default function AppointmentsPage() {
  const { t, dir } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>("upcoming");
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data, isLoading, refetch } = useApiQuery<PaginatedResponse<Appointment>>(
    "/api/appointments/?page_size=100",
    { enabled: isAuthenticated }
  );

  const allAppointments = data?.results ?? [];

  const now = new Date();

  const upcoming = allAppointments.filter((a) => {
    const dt = new Date(`${a.appointment_date}T${a.appointment_time}`);
    return dt >= now && !["cancelled", "rejected", "completed", "no_show"].includes(a.status);
  });

  const past = allAppointments.filter((a) => {
    const dt = new Date(`${a.appointment_date}T${a.appointment_time}`);
    return dt < now || ["cancelled", "rejected", "completed", "no_show"].includes(a.status);
  });

  const displayed = tab === "upcoming" ? upcoming : tab === "past" ? past : allAppointments;

  const handleCancel = useCallback(
    async (apptId: number, reason: string) => {
      setIsCancelling(true);
      try {
        await api.patch(`/api/appointments/${apptId}/`, {
          status: "cancelled",
          cancellation_reason: reason || undefined,
        });
        setCancellingId(null);
        refetch();
      } catch {
        alert("Failed to cancel appointment. Please try again.");
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              {t("appointments.signInRequired")}
            </h1>
            <p className="text-slate-500 mb-8">{t("appointments.signInMessage")}</p>
            <Link
              href="/auth/signin"
              className={`inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors ${dir === "rtl" ? "flex-row-reverse" : ""}`}
            >
              <span>{t("nav.signIn")}</span>
              <ArrowRight className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
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
        <div className={`mb-6 ${dir === "rtl" ? "text-right" : ""}`}>
          <h1 className="text-3xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-slate-500 mt-1 text-sm">Test drive appointments you&apos;ve scheduled</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-100 p-1 shadow-sm mb-6 w-fit">
          {(["upcoming","past","all"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t ? "bg-accent text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t === "upcoming" ? `Upcoming (${upcoming.length})` : t === "past" ? `Past (${past.length})` : `All (${allAppointments.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {tab === "upcoming" ? "No upcoming appointments" : tab === "past" ? "No past appointments" : "No appointments yet"}
            </h2>
            <p className="text-slate-500 mb-8 text-sm">
              {tab === "upcoming" ? "Browse cars and book a test drive." : "Your completed or cancelled appointments will appear here."}
            </p>
            {tab !== "past" && (
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors text-sm"
              >
                Browse Cars
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((appt) => {
              const canCancel = ["pending", "confirmed"].includes(appt.status);
              const isUpcoming = new Date(`${appt.appointment_date}T${appt.appointment_time}`) >= now;
              return (
                <div
                  key={appt.id}
                  className={`bg-white rounded-2xl p-5 border shadow-sm ${
                    isUpcoming && appt.status === "confirmed"
                      ? "border-green-200"
                      : appt.status === "pending"
                      ? "border-yellow-200"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Date block */}
                    <div className="bg-accent/10 rounded-xl px-4 py-3 text-center flex-shrink-0 min-w-[70px]">
                      <p className="text-2xl font-bold text-accent leading-none">
                        {new Date(appt.appointment_date).getDate()}
                      </p>
                      <p className="text-xs font-semibold text-accent mt-0.5">
                        {new Date(appt.appointment_date).toLocaleString("en", { month: "short" })}
                      </p>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link
                          href={`/car/${appt.listing.id}`}
                          className="text-base font-semibold text-slate-900 hover:text-accent"
                        >
                          {appt.listing.year} {appt.listing.make} {appt.listing.model}
                        </Link>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[appt.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {STATUS_LABEL[appt.status] ?? appt.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {appt.appointment_time.slice(0, 5)}
                        </span>
                        {appt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {appt.location}
                          </span>
                        )}
                        <span>Seller: {appt.seller.name}</span>
                      </div>

                      {appt.notes && (
                        <p className="mt-1.5 text-xs text-slate-400 italic">&ldquo;{appt.notes}&rdquo;</p>
                      )}

                      {appt.cancellation_reason && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          Reason: {appt.cancellation_reason}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {canCancel && (
                      <button
                        onClick={() => setCancellingId(appt.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors border border-red-200 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
