"use client";

import { useState } from "react";
import { Flag, X, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface ReportModalProps {
  reportType: "listing" | "user";
  targetId: number;
  targetLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}

const LISTING_REASONS = [
  { value: "fake_listing",  label: "Fake Listing" },
  { value: "wrong_price",   label: "Wrong / Misleading Price" },
  { value: "wrong_info",    label: "Incorrect Information" },
  { value: "duplicate",     label: "Duplicate Listing" },
  { value: "scam",          label: "Scam / Fraud" },
  { value: "stolen_photos", label: "Stolen Photos" },
  { value: "sold_vehicle",  label: "Vehicle Already Sold" },
  { value: "spam",          label: "Spam" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "other",         label: "Other" },
];

const USER_REASONS = [
  { value: "harassment",   label: "Harassment" },
  { value: "spam",         label: "Spam" },
  { value: "scam",         label: "Scam / Fraud" },
  { value: "impersonation",label: "Impersonation" },
  { value: "fake_listing", label: "Fake Listings" },
  { value: "inappropriate",label: "Inappropriate Content" },
  { value: "other",        label: "Other" },
];

function parseError(err: unknown): string {
  const e = err as { detail?: unknown; status?: number };
  const detail = e?.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const flat = Object.values(detail as Record<string, unknown>).flat();
    return flat.join(" ");
  }
  return "Submission failed. Please try again.";
}

export default function ReportModal({
  reportType,
  targetId,
  targetLabel,
  onClose,
  onSuccess,
}: ReportModalProps) {
  const [reason, setReason]           = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const reasons = reportType === "listing" ? LISTING_REASONS : USER_REASONS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/reports/", {
        report_type: reportType,
        reason,
        description,
        ...(reportType === "listing"
          ? { listing_id: targetId }
          : { reported_user_id: targetId }),
      });
      onSuccess();
    } catch (err) {
      setError(parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-slate-900">
              Report {reportType === "listing" ? "Listing" : "User"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-5">
          Reporting:{" "}
          <span className="font-medium text-slate-700">
            {targetLabel}
          </span>
        </p>

        {error && (
          <div className="flex gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:border-accent focus:outline-none text-sm"
            >
              <option value="">Select a reason…</option>
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Provide more details about the issue…"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:border-accent focus:outline-none text-sm resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">
              {description.length}/500
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason || submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors text-sm"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Flag className="w-4 h-4" />
              )}
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
