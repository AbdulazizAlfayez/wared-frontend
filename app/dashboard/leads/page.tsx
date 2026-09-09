"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import type { PaginatedResponse, Lead } from "@/lib/types";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
  Users, ChevronLeft, ChevronRight, Loader2, Phone, Mail, MessageSquare,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
  { value: "spam", label: "Spam" },
];

const STATUS_COLORS: Record<string, string> = {
  new:       "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  closed:    "bg-green-100 text-green-700",
  spam:      "bg-red-100 text-red-700",
};

const NEXT_STATUS: Record<string, string[]> = {
  new:       ["contacted", "closed", "spam"],
  contacted: ["closed", "spam"],
};

export default function DealerLeadsPage() {
  const { isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const url = `/api/leads/?page=${page}&page_size=20${statusFilter ? `&status=${statusFilter}` : ""}`;

  const { data, isLoading, refetch } = useApiQuery<PaginatedResponse<Lead>>(url, {
    enabled: isAuthenticated,
    deps: [url],
  });

  const leads = data?.results ?? [];

  const handleStatusChange = useCallback(
    async (leadId: number, newStatus: string) => {
      setUpdatingId(leadId);
      try {
        await api.patch(`/api/leads/${leadId}/`, { status: newStatus });
        refetch();
      } catch {
        alert("Failed to update lead status.");
      } finally {
        setUpdatingId(null);
      }
    },
    [refetch]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
        {data && (
          <p className="text-sm text-slate-500 mt-1">{data.count} total leads</p>
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

      {/* Leads list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No leads found.</p>
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="p-4 flex flex-wrap gap-3 items-start">
                {/* Buyer info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900">{lead.name}</p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {lead.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-accent">
                      <Mail className="w-3 h-3" /> {lead.email}
                    </a>
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-accent">
                        <Phone className="w-3 h-3" /> {lead.phone}
                      </a>
                    )}
                  </div>
                  <Link
                    href={`/car/${lead.listing.id}`}
                    className="text-xs text-accent hover:underline mt-1 inline-block"
                  >
                    {lead.listing.year} {lead.listing.make} {lead.listing.model}
                  </Link>
                </div>

                {/* Date + expand */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="text-xs text-slate-400">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </p>
                  {lead.message && (
                    <button
                      onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-accent"
                    >
                      <MessageSquare className="w-3 h-3" />
                      {expandedId === lead.id ? "Hide" : "Message"}
                    </button>
                  )}
                </div>

                {/* Status actions */}
                {NEXT_STATUS[lead.status] && (
                  <div className="w-full flex gap-2 flex-wrap pt-1">
                    {NEXT_STATUS[lead.status].map((next) => (
                      <button
                        key={next}
                        disabled={updatingId === lead.id}
                        onClick={() => handleStatusChange(lead.id, next)}
                        className="px-3 py-1 rounded-lg text-xs font-medium border border-slate-200 hover:border-accent hover:text-accent transition-colors capitalize disabled:opacity-50"
                      >
                        {updatingId === lead.id ? "..." : `Mark ${next}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Expanded message */}
              {expandedId === lead.id && lead.message && (
                <div className="px-4 pb-4 border-t border-slate-50 pt-3">
                  <p className="text-sm text-slate-600 italic">&quot;{lead.message}&quot;</p>
                </div>
              )}
            </div>
          ))
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
