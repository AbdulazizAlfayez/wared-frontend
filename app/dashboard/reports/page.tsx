"use client";

import { useEffect, useState } from "react";
import { Flag, Loader2, Clock, CheckCircle, XCircle, Search, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Report, PaginatedResponse } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending:       { label: "Pending",       className: "bg-yellow-100 text-yellow-700 border-yellow-200",  icon: Clock },
  investigating: { label: "Investigating", className: "bg-blue-100 text-blue-700 border-blue-200",        icon: Search },
  resolved:      { label: "Resolved",      className: "bg-green-100 text-green-700 border-green-200",     icon: CheckCircle },
  dismissed:     { label: "Dismissed",     className: "bg-slate-100 text-slate-500 border-slate-200",        icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; dot: string }> = {
  urgent: { label: "Urgent", dot: "bg-red-500" },
  high:   { label: "High",   dot: "bg-orange-500" },
  medium: { label: "Medium", dot: "bg-yellow-500" },
  low:    { label: "Low",    dot: "bg-green-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function MyReportsPage() {
  const [reports, setReports]   = useState<Report[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    api.get<Report[] | PaginatedResponse<Report>>("/api/reports/mine/")
      .then((res) => {
        const items = Array.isArray(res) ? res : (res as PaginatedResponse<Report>).results ?? [];
        setReports(items);
      })
      .catch(() => setError("Failed to load reports."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Flag className="w-6 h-6 text-red-500" />
          My Reports
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Track the status of reports you have submitted.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl">
          <Flag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-900">No reports yet</p>
          <p className="text-slate-500 text-sm mt-1">
            You haven't submitted any reports. Use the flag button on any listing to report an issue.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    {/* Target */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900 capitalize">{r.report_type}</p>
                      <p className="text-xs text-slate-400">
                        {r.listing
                          ? `${r.listing.year} ${r.listing.make} ${r.listing.model}`
                          : r.reported_user
                          ? r.reported_user.name
                          : "—"}
                      </p>
                    </td>
                    {/* Reason */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700 capitalize">
                        {r.reason.replace(/_/g, " ")}
                      </p>
                      {r.description && (
                        <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate">
                          {r.description}
                        </p>
                      )}
                    </td>
                    {/* Priority */}
                    <td className="px-4 py-3">
                      <PriorityDot priority={r.priority} />
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("en-SA", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
