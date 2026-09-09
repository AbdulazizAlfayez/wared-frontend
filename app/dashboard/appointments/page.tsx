"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import type { PaginatedResponse, Appointment } from "@/lib/types";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, Loader2, Clock, MapPin, User,
  CheckCircle, XCircle, AlertCircle,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
  { value: "no_show", label: "No Show" },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-slate-100 text-slate-500",
  rejected:  "bg-red-100 text-red-700",
  no_show:   "bg-orange-100 text-orange-700",
};

// What status transitions can the seller trigger?
const SELLER_TRANSITIONS: Record<string, { label: string; status: string; className: string }[]> = {
  pending:   [
    { label: "Confirm", status: "confirmed", className: "bg-green-50 hover:bg-green-100 text-green-700 border border-green-200" },
    { label: "Reject",  status: "rejected",  className: "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200" },
    { label: "Cancel",  status: "cancelled", className: "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200" },
  ],
  confirmed: [
    { label: "Complete", status: "completed", className: "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200" },
    { label: "No Show",  status: "no_show",   className: "bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200" },
    { label: "Cancel",   status: "cancelled", className: "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200" },
  ],
};

export default function DealerAppointmentsPage() {
  const { isAuthenticated, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [notesId, setNotesId] = useState<number | null>(null);
  const [notesText, setNotesText] = useState("");

  const url = `/api/appointments/?page=${page}&page_size=20${statusFilter ? `&status=${statusFilter}` : ""}`;

  const { data, isLoading, refetch } = useApiQuery<PaginatedResponse<Appointment>>(url, {
    enabled: isAuthenticated,
    deps: [url],
  });

  const appointments = (data?.results ?? []).filter(
    (a) => a.seller?.id === user?.id
  );

  const handleAction = useCallback(
    async (apptId: number, newStatus: string, notes?: string) => {
      setUpdatingId(apptId);
      try {
        const body: Record<string, string> = { status: newStatus };
        if (notes) body.seller_notes = notes;
        await api.patch(`/api/appointments/${apptId}/`, body);
        refetch();
        setNotesId(null);
      } catch {
        alert("Failed to update appointment.");
      } finally {
        setUpdatingId(null);
      }
    },
    [refetch]
  );

  const handleSaveNotes = useCallback(
    async (apptId: number) => {
      setUpdatingId(apptId);
      try {
        await api.patch(`/api/appointments/${apptId}/`, { seller_notes: notesText });
        refetch();
        setNotesId(null);
        setNotesText("");
      } catch {
        alert("Failed to save notes.");
      } finally {
        setUpdatingId(null);
      }
    },
    [notesText, refetch]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
        {data && (
          <p className="text-sm text-slate-500 mt-1">{data.count} total</p>
        )}
      </div>

      {/* Status filter */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex gap-1 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatusFilter(opt.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? "bg-accent text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Appointments */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No appointments found.</p>
          </div>
        ) : (
          appointments.map((appt) => {
            const transitions = SELLER_TRANSITIONS[appt.status];
            const isUpdating = updatingId === appt.id;

            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    {/* Date/time */}
                    <div className="bg-accent/10 rounded-xl px-4 py-3 text-center flex-shrink-0 min-w-[80px]">
                      <p className="text-lg font-bold text-accent">
                        {new Date(appt.appointment_date).getDate()}
                      </p>
                      <p className="text-xs text-accent font-medium">
                        {new Date(appt.appointment_date).toLocaleString("en", { month: "short" })}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {appt.appointment_time.slice(0, 5)}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/car/${appt.listing.id}`}
                          className="font-semibold text-slate-900 hover:text-accent transition-colors"
                        >
                          {appt.listing.year} {appt.listing.make} {appt.listing.model}
                        </Link>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[appt.status] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {appt.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <User className="w-3 h-3" /> {appt.buyer.name}
                        </span>
                        {appt.location && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3" /> {appt.location}
                          </span>
                        )}
                      </div>

                      {appt.notes && (
                        <p className="text-xs text-slate-400 mt-1 italic">&quot;{appt.notes}&quot;</p>
                      )}
                    </div>
                  </div>

                  {/* Seller notes */}
                  {appt.seller_notes && notesId !== appt.id && (
                    <div className="mt-3 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-600 italic">
                      Note: {appt.seller_notes}
                    </div>
                  )}

                  {/* Actions */}
                  {(transitions || true) && (
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      {transitions?.map((t) => (
                        <button
                          key={t.status}
                          disabled={isUpdating}
                          onClick={() => handleAction(appt.id, t.status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${t.className}`}
                        >
                          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : t.label}
                        </button>
                      ))}

                      {/* Add/edit notes button */}
                      {!["cancelled", "rejected", "no_show"].includes(appt.status) && notesId !== appt.id && (
                        <button
                          onClick={() => {
                            setNotesId(appt.id);
                            setNotesText(appt.seller_notes ?? "");
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 hover:border-accent hover:text-accent transition-colors"
                        >
                          {appt.seller_notes ? "Edit Note" : "Add Note"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Inline notes editor */}
                  {notesId === appt.id && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder="Add a note for this appointment..."
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveNotes(appt.id)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent hover:bg-accent-600 text-white disabled:opacity-50 transition-colors"
                        >
                          Save Note
                        </button>
                        <button
                          onClick={() => { setNotesId(null); setNotesText(""); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {(data?.previous || data?.next) && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 px-5 py-3 shadow-sm">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!data?.previous}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-slate-500">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data?.next}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
