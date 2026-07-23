"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import type { PaginatedResponse, Listing, BulkUploadRecord, PromotionPackage } from "@/lib/types";
import Link from "next/link";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  Car, Eye, Edit, ChevronLeft, ChevronRight, Loader2, Search, Plus,
  Upload, Download, Trash2, Square, X, ChevronDown,
  FileText, AlertTriangle, CheckCircle, Lock, CheckSquare, Zap, RefreshCw,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "changes_requested", label: "Changes Requested" },
  { value: "sold", label: "Sold" },
  { value: "draft", label: "Draft" },
];

const STATUS_COLORS: Record<string, string> = {
  approved:           "bg-green-100 text-green-700",
  pending:            "bg-amber-100 text-amber-700",
  rejected:           "bg-red-100 text-red-700",
  changes_requested:  "bg-orange-100 text-orange-700",
  sold:               "bg-slate-200 text-slate-700",
  draft:              "bg-slate-100 text-slate-600",
};

const UPLOAD_STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  done:       "bg-green-100 text-green-700",
  failed:     "bg-red-100 text-red-700",
};

// ---------------------------------------------------------------------------
// Authenticated fetch helpers (bypass api.ts JSON-only limitation for files)
// ---------------------------------------------------------------------------

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return m ? decodeURIComponent(m[1]) : "";
}

async function downloadAuthFile(path: string, filename: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Accept-Language": (typeof localStorage !== "undefined" && localStorage.getItem("lang")) || "en",
      "X-CSRFToken": getCookie("csrftoken"),
    },
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function uploadCSVFile(file: File): Promise<BulkUploadRecord> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/api/listings/bulk/upload/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept-Language": (typeof localStorage !== "undefined" && localStorage.getItem("lang")) || "en",
      "X-CSRFToken": getCookie("csrftoken"),
      // No Content-Type — browser sets multipart/form-data with boundary
    },
    body: form,
  });
  if (!res.ok) {
    let msg = "Upload failed";
    try { msg = (await res.json()).detail ?? msg; } catch { /* */ }
    throw new Error(msg);
  }
  return res.json() as Promise<BulkUploadRecord>;
}

// ---------------------------------------------------------------------------
// Promotion Modal
// ---------------------------------------------------------------------------

const PROMO_TYPE_LABELS: Record<string, string> = {
  featured: "Featured", highlighted: "Highlighted",
  top_search: "Top Search", homepage: "Homepage",
};
const PROMO_TYPE_COLORS: Record<string, string> = {
  featured:    "text-amber-600 bg-amber-50 border-amber-200",
  highlighted: "text-orange-600 bg-orange-50 border-orange-200",
  top_search:  "text-purple-600 bg-purple-50 border-purple-200",
  homepage:    "text-green-600 bg-green-50 border-green-200",
};

function PromotionModal({
  listingId,
  onClose,
  onSuccess,
}: {
  listingId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [packages, setPackages] = useState<PromotionPackage[]>([]);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<PaginatedResponse<PromotionPackage> | PromotionPackage[]>("/api/listings/promotion-packages/")
      .then(data => {
        const pkgs = Array.isArray(data) ? data : (data as PaginatedResponse<PromotionPackage>).results ?? [];
        setPackages(pkgs);
      })
      .catch(() => setError("Failed to load packages."))
      .finally(() => setLoadingPkgs(false));
  }, []);

  const handleSubmit = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/api/listings/${listingId}/promote/`, { package: selectedId });
      onSuccess();
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : "Promotion failed.";
      try {
        const parsed = JSON.parse(raw);
        setError(parsed.detail ?? parsed.non_field_errors?.[0] ?? raw);
      } catch {
        setError(raw);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              Boost Listing
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Select a promotion package</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loadingPkgs ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : packages.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No promotion packages available.</p>
          ) : (
            <div className="space-y-3">
              {packages.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedId(pkg.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedId === pkg.id ? "border-accent bg-accent/5" : "border-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">{pkg.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PROMO_TYPE_COLORS[pkg.promotion_type] ?? "text-slate-600 bg-slate-50 border-slate-200"}`}>
                          {PROMO_TYPE_LABELS[pkg.promotion_type] ?? pkg.promotion_type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{pkg.description}</p>
                      <p className="text-xs text-slate-400 mt-1">{pkg.duration_days} days</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold text-accent">
                        {Number(pkg.price).toLocaleString("en-SA")}
                      </div>
                      <div className="text-xs text-slate-400">SAR</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedId || submitting}
            className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Activating…" : "Activate Promotion"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DealerListingsPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // Listing filters / pagination
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Row selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Bulk action bar
  const [bulkStatusValue, setBulkStatusValue] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    updated?: number[]; skipped?: number[]; deleted?: number[]; not_found?: number[];
  } | null>(null);

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Bulk upload modal
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"upload" | "history">("upload");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "polling" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const [currentUpload, setCurrentUpload] = useState<BulkUploadRecord | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Upload history
  const [history, setHistory] = useState<BulkUploadRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Promotion modal
  const [promoteListingId, setPromoteListingId] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const url = `/api/listings/?page=${page}&page_size=20${statusFilter ? `&status=${statusFilter}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`;

  const { data, isLoading, refetch } = useApiQuery<PaginatedResponse<Listing>>(url, {
    enabled: isAuthenticated,
    deps: [url],
  });

  // DEPRECATED: Subscription check disabled — commission-only model
  // const { data: mySubscription } = useApiQuery<DealerSubscription>("/api/my-subscription/", {
  //   enabled: isAuthenticated,
  // });
  const canBulkUpload = true; // All importers can bulk upload now
  const listings = data?.results ?? [];

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Close export menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Clean up polling interval on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ---------------------------------------------------------------------------
  // Listing handlers
  // ---------------------------------------------------------------------------

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleStatusChange = (s: string) => {
    setStatusFilter(s);
    setPage(1);
    setSelectedIds(new Set());
    setBulkResult(null);
  };

  const handleMarkSold = useCallback(async (id: number) => {
    if (!confirm("Mark this listing as sold?")) return;
    try {
      await api.patch(`/api/listings/${id}/`, { status: "sold" });
      refetch();
    } catch {
      alert("Failed to update listing.");
    }
  }, [refetch]);

  // ---------------------------------------------------------------------------
  // Selection handlers
  // ---------------------------------------------------------------------------

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    setBulkResult(null);
  };

  const toggleSelectAll = () => {
    const allOnPage = listings.map(l => l.id);
    const allSelected = allOnPage.every(id => selectedIds.has(id)) && allOnPage.length > 0;
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allOnPage.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allOnPage.forEach(id => next.add(id));
        return next;
      });
    }
    setBulkResult(null);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkResult(null);
    setShowDeleteConfirm(false);
    setBulkStatusValue("");
  };

  const pageAllSelected = listings.length > 0 && listings.every(l => selectedIds.has(l.id));
  const pagePartialSelected = !pageAllSelected && listings.some(l => selectedIds.has(l.id));

  // ---------------------------------------------------------------------------
  // Bulk action handlers
  // ---------------------------------------------------------------------------

  const handleBulkStatusChange = async () => {
    if (!bulkStatusValue || selectedIds.size === 0) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const result = await api.post<{ updated: number[]; skipped: number[]; not_found: number[] }>(
        "/api/listings/bulk/status/",
        { listing_ids: [...selectedIds], status: bulkStatusValue }
      );
      setBulkResult(result);
      setSelectedIds(new Set());
      setBulkStatusValue("");
      refetch();
    } catch {
      // leave result null — user can retry
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    setShowDeleteConfirm(false);
    setBulkResult(null);
    try {
      const result = await api.post<{ deleted: number[]; not_found: number[] }>(
        "/api/listings/bulk/delete/",
        { listing_ids: [...selectedIds] }
      );
      setBulkResult(result);
      setSelectedIds(new Set());
      refetch();
    } catch {
      /* silent */
    } finally {
      setBulkLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------

  const handleExport = async (format: "csv" | "xlsx") => {
    setShowExportMenu(false);
    setExporting(true);
    try {
      await downloadAuthFile(
        `/api/listings/bulk/export/?format=${format}`,
        `listings_export.${format}`
      );
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Upload helpers
  // ---------------------------------------------------------------------------

  const handleDownloadTemplate = async () => {
    try {
      await downloadAuthFile("/api/listings/bulk/template/", "bulk_listing_template.csv");
    } catch {
      alert("Failed to download template. Please try again.");
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Only .csv files are accepted.");
      return;
    }
    setUploadFile(file);
    setUploadError("");
    setUploadState("idle");
    setCurrentUpload(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const startPoll = (uploadId: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setUploadState("polling");
    pollRef.current = setInterval(async () => {
      try {
        const upload = await api.get<BulkUploadRecord>(`/api/listings/bulk/uploads/${uploadId}/`);
        setCurrentUpload(upload);
        if (upload.status !== "pending" && upload.status !== "processing") {
          if (pollRef.current) clearInterval(pollRef.current);
          setUploadState("done");
          if (upload.status === "done") refetch();
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        setUploadState("error");
        setUploadError("Failed to check upload status.");
      }
    }, 3000);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploadState("uploading");
    setUploadError("");
    try {
      const record = await uploadCSVFile(uploadFile);
      setCurrentUpload(record);
      startPoll(record.id);
    } catch (e: unknown) {
      setUploadState("error");
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const list = await api.get<BulkUploadRecord[]>("/api/listings/bulk/uploads/");
      setHistory(list);
    } catch {
      /* silent */
    } finally {
      setHistoryLoading(false);
    }
  };

  const openModal = () => { setShowModal(true); setModalTab("upload"); };

  const closeModal = () => {
    setShowModal(false);
    setUploadFile(null);
    setUploadState("idle");
    setUploadError("");
    setCurrentUpload(null);
    setHistory([]);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const switchTab = (tab: "upload" | "history") => {
    setModalTab(tab);
    if (tab === "history") loadHistory();
  };

  const resetUpload = () => {
    setUploadFile(null);
    setUploadState("idle");
    setUploadError("");
    setCurrentUpload(null);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const selectedCount = selectedIds.size;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
          {data && (
            <p className="text-sm text-slate-500 mt-1">{data.count} total listings</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Upload */}
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-accent text-slate-700 hover:text-accent rounded-xl text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExportMenu(v => !v)}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-accent text-slate-700 hover:text-accent rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
            >
              {exporting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />
              }
              Export
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-100 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport("xlsx")}
                  className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  Export as Excel
                </button>
              </div>
            )}
          </div>

          {/* New listing */}
          <Link
            href="/sell"
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Listing
          </Link>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 flex-wrap">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
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
        <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search listings..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm transition-colors">
            Go
          </button>
        </form>
      </div>

      {/* ── Bulk action result banner ───────────────────────────── */}
      {bulkResult && (
        <div className="bg-white border border-green-200 rounded-2xl px-5 py-3 flex items-center gap-3 text-sm shadow-sm">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-slate-700">
            {bulkResult.updated !== undefined && (
              <>
                {bulkResult.updated.length} listing{bulkResult.updated.length !== 1 ? "s" : ""} updated
                {(bulkResult.skipped?.length ?? 0) > 0 && `, ${bulkResult.skipped!.length} skipped (invalid transition)`}
              </>
            )}
            {bulkResult.deleted !== undefined && (
              <>{bulkResult.deleted.length} listing{bulkResult.deleted.length !== 1 ? "s" : ""} deleted</>
            )}
          </span>
          <button onClick={() => setBulkResult(null)} className="ml-auto p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : listings.length === 0 ? (
          <div className="py-20 text-center">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No listings found.</p>
            <Link href="/sell" className="mt-3 inline-block text-accent text-sm hover:underline">
              Create your first listing
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase">
                    {/* Select-all checkbox */}
                    <th className="px-4 py-3 w-10">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center justify-center w-5 h-5 focus:outline-none"
                        title={pageAllSelected ? "Deselect all" : "Select all on this page"}
                      >
                        {pageAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-accent" />
                        ) : pagePartialSelected ? (
                          <div className="w-4 h-4 border-2 border-accent rounded bg-accent/20 flex items-center justify-center">
                            <div className="w-2 h-0.5 bg-accent" />
                          </div>
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </th>
                    <th className="px-5 py-3 text-left">Car</th>
                    <th className="px-5 py-3 text-left">Price</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-right hidden sm:table-cell">Views</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {listings.map(l => (
                    <tr
                      key={l.id}
                      className={`hover:bg-slate-50/50 transition-colors ${selectedIds.has(l.id) ? "bg-accent/5 hover:bg-accent/10" : ""}`}
                    >
                      <td className="px-4 py-3 w-10">
                        <button
                          onClick={() => toggleSelect(l.id)}
                          className="flex items-center justify-center w-5 h-5"
                        >
                          {selectedIds.has(l.id)
                            ? <CheckSquare className="w-4 h-4 text-accent" />
                            : <Square className="w-4 h-4 text-slate-300" />
                          }
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {l.primary_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={l.primary_image}
                              alt=""
                              className="w-14 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-10 rounded-lg bg-slate-100 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate max-w-[180px]">
                              {l.year} {l.make} {l.model}
                            </p>
                            <p className="text-xs text-slate-400">{l.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-700 font-medium whitespace-nowrap">
                        {new Intl.NumberFormat("en-SA", {
                          style: "currency", currency: "SAR", maximumFractionDigits: 0,
                        }).format(l.price)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[l.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {l.status === "changes_requested" ? t("listingStatus.changes_requested") : l.status}
                        </span>
                        {l.status === "changes_requested" && (l as any).admin_notes && (
                          <div className="mt-1.5 px-2 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800">
                            <span className="font-medium">{t("listingStatus.adminNote")}:</span> {(l as any).admin_notes}
                          </div>
                        )}
                        {l.status === "rejected" && (l as any).rejection_reason && (
                          <div className="mt-1.5 px-2 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                            <span className="font-medium">{t("listingStatus.rejectionReason")}:</span> {(l as any).rejection_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500 hidden sm:table-cell">
                        {l.view_count ?? l.views_count ?? 0}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/listing/${l.id}`}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-accent transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/listing/edit/${l.id}`}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-accent transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          {l.status === "approved" && (
                            <>
                              <button
                                onClick={() => handleMarkSold(l.id)}
                                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors"
                              >
                                Mark Sold
                              </button>
                              <button
                                onClick={() => setPromoteListingId(l.id)}
                                className={`p-1.5 rounded-lg transition-colors ${l.is_promoted ? "text-amber-500 hover:bg-amber-50" : "text-slate-500 hover:bg-slate-100 hover:text-accent"}`}
                                title={l.is_promoted ? "Active promotion" : "Boost listing"}
                              >
                                <Zap className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {(l.status === "changes_requested" || l.status === "rejected") && (
                            <Link
                              href={`/listing/edit/${l.id}`}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-medium transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              {t("listingStatus.editAndResubmit")}
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {(data?.previous || data?.next) && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={!data?.previous}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-sm text-slate-500">Page {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!data?.next}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Floating Bulk Action Bar ──────────────────────────────
           Slides up from bottom when rows are selected            */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
          selectedCount > 0 ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="max-w-3xl mx-auto mb-6 px-4">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3 flex-wrap">
            {/* Count */}
            <span className="text-sm font-semibold whitespace-nowrap">
              {selectedCount} selected
            </span>

            <div className="w-px h-5 bg-slate-600 flex-shrink-0" />

            {/* Status change */}
            <div className="flex items-center gap-2">
              <select
                value={bulkStatusValue}
                onChange={e => setBulkStatusValue(e.target.value)}
                className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent min-w-[140px]"
              >
                <option value="">Change Status…</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="sold">Sold</option>
                <option value="draft">Draft</option>
              </select>
              <button
                onClick={handleBulkStatusChange}
                disabled={!bulkStatusValue || bulkLoading}
                className="px-3 py-1.5 bg-accent hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                {bulkLoading && !showDeleteConfirm && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Apply
              </button>
            </div>

            <div className="w-px h-5 bg-slate-600 flex-shrink-0" />

            {/* Delete */}
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-red-300 whitespace-nowrap">
                  Delete {selectedCount} listing{selectedCount !== 1 ? "s" : ""}?
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  {bulkLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1.5"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 hover:text-red-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Clear */}
            <button
              onClick={clearSelection}
              className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Promotion Modal ────────────────────────────────────── */}
      {promoteListingId !== null && (
        <PromotionModal
          listingId={promoteListingId}
          onClose={() => setPromoteListingId(null)}
          onSuccess={() => { setPromoteListingId(null); refetch(); }}
        />
      )}

      {/* ── Bulk Upload Modal ─────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Bulk Upload</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Upload multiple listings at once using a CSV file
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 flex-shrink-0">
              {(["upload", "history"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 capitalize transition-colors ${
                    modalTab === tab
                      ? "border-accent text-accent"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab === "upload" ? "Upload" : "History"}
                </button>
              ))}
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-6">
              {/* ── Upload tab ── */}
              {modalTab === "upload" && (
                <div className="space-y-6">
                  {/* DEPRECATED: Subscription gate removed — all importers can bulk upload */}
                  {canBulkUpload && (
                    <>
                      {/* Step 1 — Template */}
                      <div className="bg-slate-50 rounded-2xl p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-accent text-white text-[11px] flex items-center justify-center font-bold flex-shrink-0">
                            1
                          </span>
                          Prepare your CSV file
                        </h3>
                        <ul className="text-sm text-slate-600 space-y-1.5 mb-4 ml-7">
                          <li>Download the template and fill in your car details (one per row)</li>
                          <li>
                            Required fields:{" "}
                            <span className="font-medium text-slate-800">
                              title, make, model, year, price, mileage, city
                            </span>
                          </li>
                          <li>
                            Optional: fuel_type, transmission, condition, body_type, description, color, vin
                          </li>
                          <li>Maximum 200 rows per file · 5 MB size limit</li>
                          <li>All listings will be created as <span className="font-medium">Draft</span> — review before submitting</li>
                        </ul>
                        <button
                          onClick={handleDownloadTemplate}
                          className="flex items-center gap-2 px-4 py-2 border border-accent text-accent hover:bg-accent/5 rounded-xl text-sm font-medium transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download CSV Template
                        </button>
                      </div>

                      {/* Step 2 — Upload */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-accent text-white text-[11px] flex items-center justify-center font-bold flex-shrink-0">
                            2
                          </span>
                          Upload your CSV
                        </h3>

                        {(uploadState === "idle" || uploadState === "error") && (
                          <>
                            <div
                              onDragOver={e => { e.preventDefault(); setDragging(true); }}
                              onDragLeave={() => setDragging(false)}
                              onDrop={handleDrop}
                              onClick={() => fileInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors select-none ${
                                dragging
                                  ? "border-accent bg-accent/5"
                                  : "border-slate-200 hover:border-accent hover:bg-slate-50"
                              }`}
                            >
                              <Upload className={`w-8 h-8 mx-auto mb-3 ${dragging ? "text-accent" : "text-slate-400"}`} />
                              {uploadFile ? (
                                <p className="text-sm font-semibold text-slate-900">{uploadFile.name}</p>
                              ) : (
                                <>
                                  <p className="text-sm text-slate-600">
                                    <span className="font-semibold text-accent">Click to browse</span>{" "}
                                    or drag and drop
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1">CSV files only · max 5 MB</p>
                                </>
                              )}
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  if (f) handleFileSelect(f);
                                  e.target.value = "";
                                }}
                              />
                            </div>

                            {uploadError && (
                              <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                {uploadError}
                              </p>
                            )}

                            {uploadFile && (
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={handleUpload}
                                  className="flex-1 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-semibold transition-colors"
                                >
                                  Upload {uploadFile.name}
                                </button>
                                <button
                                  onClick={() => { setUploadFile(null); setUploadError(""); }}
                                  className="px-3 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:border-red-300 hover:text-red-600 transition-colors"
                                  title="Remove file"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {uploadState === "uploading" && (
                          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                            <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-700">Uploading {uploadFile?.name}…</p>
                          </div>
                        )}

                        {uploadState === "polling" && (
                          <div className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-2xl p-10 text-center">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                            <p className="text-sm font-semibold text-slate-900">Processing your file…</p>
                            <p className="text-xs text-slate-500 mt-1">
                              This may take a moment. We&apos;ll show results here when ready.
                            </p>
                          </div>
                        )}

                        {uploadState === "done" && currentUpload && (
                          <UploadResult
                            upload={currentUpload}
                            onViewListings={() => { closeModal(); handleStatusChange("draft"); }}
                            onUploadAnother={resetUpload}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── History tab ── */}
              {modalTab === "history" && (
                <div>
                  {historyLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">No upload history yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map(h => (
                        <HistoryRow key={h.id} record={h} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UploadResult({
  upload,
  onViewListings,
  onUploadAnother,
}: {
  upload: BulkUploadRecord;
  onViewListings: () => void;
  onUploadAnother: () => void;
}) {
  const isFailed = upload.status === "failed";
  const hasErrors = upload.errors.length > 0;
  const isPartial = !isFailed && upload.failed_rows > 0;

  const containerClass = isFailed
    ? "bg-red-50 border-red-200"
    : isPartial
    ? "bg-yellow-50 border-yellow-200"
    : "bg-green-50 border-green-200";

  return (
    <div className={`border-2 rounded-2xl p-6 ${containerClass}`}>
      {/* Headline */}
      <div className="flex items-center gap-2.5 mb-4">
        {isFailed ? (
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        )}
        <p className="font-semibold text-slate-900">
          {isFailed
            ? "Upload failed"
            : `${upload.successful_rows} listing${upload.successful_rows !== 1 ? "s" : ""} created successfully`}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 text-sm mb-4">
        <span className="flex items-center gap-1.5 text-green-700">
          <CheckCircle className="w-3.5 h-3.5" />
          {upload.successful_rows} created
        </span>
        {upload.failed_rows > 0 && (
          <span className="flex items-center gap-1.5 text-red-700">
            <AlertTriangle className="w-3.5 h-3.5" />
            {upload.failed_rows} failed
          </span>
        )}
        <span className="text-slate-500">{upload.total_rows} total rows</span>
      </div>

      {/* Errors */}
      {hasErrors && (
        <details className="mb-4">
          <summary className="text-sm font-medium text-red-700 cursor-pointer mb-2">
            {upload.errors.length} row error{upload.errors.length !== 1 ? "s" : ""} — click to expand
          </summary>
          <div className="bg-white/70 rounded-xl p-3 max-h-44 overflow-y-auto space-y-1 mt-2">
            {upload.errors.slice(0, 25).map((err, i) => (
              <p key={i} className="text-xs text-red-700">
                <span className="font-semibold">Row {err.row}:</span>{" "}
                {Array.isArray(err.errors) ? err.errors.join(", ") : String(err.errors)}
              </p>
            ))}
            {upload.errors.length > 25 && (
              <p className="text-xs text-slate-500 pt-1">
                … and {upload.errors.length - 25} more errors
              </p>
            )}
          </div>
        </details>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {upload.successful_rows > 0 && (
          <button
            onClick={onViewListings}
            className="px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            View Created Listings
          </button>
        )}
        <button
          onClick={onUploadAnother}
          className="px-4 py-2 border border-slate-200 text-slate-700 hover:border-accent hover:text-accent rounded-xl text-sm font-medium transition-colors"
        >
          Upload Another File
        </button>
      </div>
    </div>
  );
}

function HistoryRow({ record }: { record: BulkUploadRecord }) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-sm font-medium text-slate-900 truncate">{record.file_name}</p>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${UPLOAD_STATUS_COLORS[record.status] ?? "bg-slate-100 text-slate-600"}`}>
          {record.status}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>{new Date(record.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
        <span className="text-green-600 font-medium">{record.successful_rows} created</span>
        {record.failed_rows > 0 && (
          <span className="text-red-600 font-medium">{record.failed_rows} failed</span>
        )}
        <span>{record.total_rows} total</span>
      </div>
      {record.errors.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-red-600 cursor-pointer">
            {record.errors.length} error{record.errors.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-1.5 space-y-0.5 max-h-28 overflow-y-auto">
            {record.errors.slice(0, 8).map((err, i) => (
              <p key={i} className="text-xs text-red-600">
                <span className="font-medium">Row {err.row}:</span>{" "}
                {Array.isArray(err.errors) ? err.errors.join(", ") : String(err.errors)}
              </p>
            ))}
            {record.errors.length > 8 && (
              <p className="text-xs text-slate-400">… and {record.errors.length - 8} more</p>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
