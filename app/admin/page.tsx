"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api as djangoApi } from "@/lib/api";
import type { Listing, PaginatedResponse, AdminStats, AdminVerificationRequest, AdminReport, ReportStats, UserModerationRecord, AdminReview, ReviewStats, FraudFlag, FraudStats, SuspiciousIP } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  Users,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Eye,
  Store,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  AlertTriangle,
  History,
  ShieldCheck,
  CheckCheck,
  MailCheck,
  Phone,
  UserX,
  TrendingUp,
  Flag,
  Ban,
  TriangleAlert,
  CalendarClock,
  Star,
  MessageSquare,
  DollarSign,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { getImageUrl } from "@/lib/utils";

type TabType = "listings" | "orders" | "payments" | "importers" | "pipeline" | "users" | "applications" | "audit" | "verifications" | "moderation" | "reviews" | "fraud";

// ---------------------------------------------------------------------------
// Payments verification queue (bank transfers awaiting WARED confirmation)
// ---------------------------------------------------------------------------
interface PendingPayment {
  id: number;
  order_id: number;
  order_number: string;
  car_title: string;
  buyer_name: string;
  importer_name: string;
  amount: number;
  reference: string;
  status: string;
  submitted_at: string;
}

interface AuditLogEntry {
  id: number;
  action: string;
  user: number | null;
  object_id: number | null;
  model_name: string | null;
  ip_address: string | null;
  timestamp: string;
}

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  verification_level?: string;
  is_identity_verified?: boolean;
  is_business_verified?: boolean;
}

interface DealerApplication {
  id: number;
  applicant: number;
  applicant_email: string;
  applicant_name: string;
  business_name: string;
  business_type: string;
  city: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  expected_listings: string;
  status: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

interface Workshop {
  id: number;
  name: string;
  city: string;
  phone: string | null;
  owner: { id: number; email: string; name: string } | null;
}

interface Showroom {
  id: number;
  name: string;
  city: string;
  phone: string;
  is_active: boolean;
  is_verified: boolean;
  owner: { id: number; email: string; name: string };
}

interface AdminImporter {
  id: number;
  business_name: string;
  cr_number?: string;
  source_countries: string[];
  specializations: string[];
  is_verified: boolean;
  average_rating: number | string;
  total_reviews: number;
  active_listings_count: number;
  user: { id: number; email: string; name: string };
  is_suspended?: boolean;
}

interface AdminOrder {
  id: number;
  order_number: string;
  listing_title: string;
  buyer_name: string;
  buyer_email: string;
  importer_name: string;
  status: string;
  total_amount: number;
  created_at: string;
}

// ===========================================
// TOAST
// ===========================================
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X className="w-4 h-4" /></button>
    </div>
  );
}

// ===========================================
// EDIT USER MODAL
// ===========================================
function EditUserModal({
  user,
  onClose,
  onSave,
  isSaving,
}: {
  user: AdminUser;
  onClose: () => void;
  onSave: (data: Partial<AdminUser>) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    role: user.role,
    is_active: user.is_active,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Edit User</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
              <option value="user">User</option>
              <option value="importer">Importer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent" />
              <span className="text-sm font-medium text-slate-700">Account active</span>
            </label>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
          <button onClick={() => onSave(form)} disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-lg font-medium">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// EDIT LISTING MODAL
// ===========================================
function EditListingModal({
  listing, onClose, onSave, isSaving,
}: { listing: any; onClose: () => void; onSave: (data: any) => void; isSaving: boolean }) {
  const [formData, setFormData] = useState({
    title: listing.title || "",
    make: listing.make || "",
    model: listing.model || "",
    year: listing.year || new Date().getFullYear(),
    price: listing.price || 0,
    mileage: listing.mileage || 0,
    city: listing.city || "",
    fuel_type: listing.fuel_type || "Petrol",
    transmission: listing.transmission || "Automatic",
    condition: listing.condition || "used",
    color: listing.color || "",
    description: listing.description || "",
    status: listing.status || "pending",
  });
  const cities = ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Taif", "Tabuk", "Abha", "Buraidah"];
  const statuses = ["pending", "approved", "rejected", "draft", "sold"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Edit Listing</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Make</label>
              <input type="text" value={formData.make} onChange={(e) => setFormData({ ...formData, make: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
              <input type="text" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
              <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" min={1990} max={new Date().getFullYear() + 1} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price (SAR)</label>
              <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mileage (km)</label>
              <input type="number" value={formData.mileage} onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                <option value="">Select city</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Type</label>
              <select value={formData.fuel_type} onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                {["Petrol", "Diesel", "Hybrid", "Electric"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Transmission</label>
              <select value={formData.transmission} onChange={(e) => setFormData({ ...formData, transmission: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                {["Automatic", "Manual"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                {statuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button onClick={() => onSave(formData)} disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-lg">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// DELETE CONFIRM MODAL
// ===========================================
function DeleteConfirmModal({
  title, message, onClose, onConfirm, isDeleting,
}: { title: string; message: string; onClose: () => void; onConfirm: () => void; isDeleting: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 text-center mb-2">{title}</h2>
        <p className="text-slate-500 text-center mb-2">{message}</p>
        <p className="text-red-500 text-sm text-center mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
          <button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium">
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// MAIN ADMIN PAGE
// ===========================================
export default function AdminPage() {
  const { t, dir } = useTranslation();
  const { role, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = role === "admin";

  const [activeTab, setActiveTab] = useState<TabType>("listings");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Modal states
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: string; item: any } | null>(null);

  // Rejection modal state
  const [rejectModal, setRejectModal] = useState<{ type: "listing" | "application"; item: any } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Request-changes modal state
  const [changesModal, setChangesModal] = useState<{ item: any } | null>(null);
  const [changesNote, setChangesNote] = useState("");

  // Toast + processing
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const showToast = useCallback((message: string, type: "success" | "error") => setToast({ message, type }), []);

  useEffect(() => {
    setSearchQuery("");
    setStatusFilter("");
    setSelectedIds(new Set());
  }, [activeTab]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const { data: stats, refetch: statsRefetch } = useApiQuery<AdminStats>(
    "/api/dashboard/admin/",
    { enabled: isAdmin }
  );

  // ── Payments queue (bank transfers awaiting confirmation) ──────────────────
  const { data: paymentsResult, refetch: paymentsRefetch } = useApiQuery<{ count: number; results: PendingPayment[] }>(
    "/api/admin/payments/?status=pending",
    { enabled: isAdmin }
  );
  const pendingPayments = paymentsResult?.results ?? [];
  const [payingActionId, setPayingActionId] = useState<number | null>(null);

  const handleConfirmPayment = async (p: PendingPayment) => {
    setPayingActionId(p.id);
    try {
      await djangoApi.post(`/api/orders/${p.order_id}/confirm-payment/`);
      showToast(`Payment confirmed — importer payout released for ${p.order_number}`, "success");
      paymentsRefetch();
      statsRefetch();
    } catch {
      showToast("Failed to confirm payment", "error");
    } finally {
      setPayingActionId(null);
    }
  };

  const handleRejectPayment = async (p: PendingPayment) => {
    const reason = window.prompt(
      `Reject payment for ${p.order_number}?\nEnter the reason shown to the buyer:`,
      "Transfer could not be matched to our bank account."
    );
    if (reason === null) return;
    setPayingActionId(p.id);
    try {
      await djangoApi.post(`/api/orders/${p.order_id}/reject-payment/`, { reason });
      showToast("Payment rejected — buyer asked to re-submit", "success");
      paymentsRefetch();
      statsRefetch();
    } catch {
      showToast("Failed to reject payment", "error");
    } finally {
      setPayingActionId(null);
    }
  };

  // Debug: log stats to help identify field-name mismatches
  useEffect(() => {
    if (stats) console.log("[Admin] dashboard stats:", stats);
  }, [stats]);

  // ── Listings ───────────────────────────────────────────────────────────────
  const listingsParams = new URLSearchParams();
  if (searchQuery) listingsParams.set("search", searchQuery);
  if (statusFilter) listingsParams.set("status", statusFilter);
  listingsParams.set("ordering", sortBy === "price_high" ? "-price" : sortBy === "price_low" ? "price" : sortBy === "oldest" ? "created_at" : "-created_at");
  listingsParams.set("page_size", "50");
  const { data: listingsResult, refetch: listingsRefetch } = useApiQuery<PaginatedResponse<Listing>>(
    `/api/listings/?${listingsParams.toString()}`,
    { enabled: isAdmin && activeTab === "listings" }
  );

  // ── Users ──────────────────────────────────────────────────────────────────
  const usersParams = new URLSearchParams();
  if (searchQuery) usersParams.set("search", searchQuery);
  if (statusFilter) usersParams.set("role", statusFilter);
  const { data: usersResult, refetch: usersRefetch } = useApiQuery<PaginatedResponse<AdminUser>>(
    `/api/users/?${usersParams.toString()}`,
    { enabled: isAdmin && activeTab === "users" }
  );

  // ── Applications ───────────────────────────────────────────────────────────
  const appsParams = new URLSearchParams();
  if (statusFilter) appsParams.set("status", statusFilter);
  const { data: appsResult, refetch: appsRefetch } = useApiQuery<PaginatedResponse<DealerApplication>>(
    `/api/importer-applications/admin/?${appsParams.toString()}`,
    { enabled: isAdmin && activeTab === "applications" }
  );

  // ── Orders ─────────────────────────────────────────────────────────────────
  const ordersParams = new URLSearchParams();
  if (searchQuery) ordersParams.set("search", searchQuery);
  if (statusFilter) ordersParams.set("status", statusFilter);
  ordersParams.set("page_size", "50");
  const { data: ordersResult, refetch: ordersRefetch } = useApiQuery<PaginatedResponse<AdminOrder>>(
    `/api/orders/?${ordersParams.toString()}`,
    { enabled: isAdmin && activeTab === "orders" }
  );

  // ── Importers ──────────────────────────────────────────────────────────────
  const importersParams = new URLSearchParams();
  if (searchQuery) importersParams.set("search", searchQuery);
  importersParams.set("page_size", "50");
  const { data: importersResult, refetch: importersRefetch } = useApiQuery<PaginatedResponse<AdminImporter>>(
    `/api/importers/?${importersParams.toString()}`,
    { enabled: isAdmin && activeTab === "importers" }
  );

  // ── Pipeline listings ──────────────────────────────────────────────────────
  const pipelineParams = new URLSearchParams();
  if (searchQuery) pipelineParams.set("search", searchQuery);
  if (statusFilter) pipelineParams.set("import_status", statusFilter);
  pipelineParams.set("page_size", "100");
  const { data: pipelineResult } = useApiQuery<PaginatedResponse<Listing>>(
    `/api/listings/?${pipelineParams.toString()}`,
    { enabled: isAdmin && activeTab === "pipeline" }
  );

  // ── Audit log ──────────────────────────────────────────────────────────────
  const { data: auditResult } = useApiQuery<PaginatedResponse<AuditLogEntry>>(
    "/api/audit-logs/?page_size=100",
    { enabled: isAdmin && activeTab === "audit" }
  );

  // ── Verifications ──────────────────────────────────────────────────────────
  const [verifications, setVerifications] = useState<AdminVerificationRequest[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [verifFilter, setVerifFilter] = useState<'all'|'pending'|'approved'|'rejected'>('pending');
  const [rejectingVerifId, setRejectingVerifId] = useState<number | null>(null);
  const [rejectVerifReason, setRejectVerifReason] = useState('');

  useEffect(() => {
    if (!isAdmin || activeTab !== "verifications") return;
    setVerificationsLoading(true);
    djangoApi.get<AdminVerificationRequest[] | PaginatedResponse<AdminVerificationRequest>>("/api/admin/verifications/")
      .then((res) => {
        const items = Array.isArray(res) ? res : (res as PaginatedResponse<AdminVerificationRequest>).results ?? [];
        setVerifications(items);
      })
      .catch(() => {})
      .finally(() => setVerificationsLoading(false));
  }, [isAdmin, activeTab]);

  const approveVerification = async (id: number) => {
    setProcessingId(`vrf-${id}`);
    try {
      await djangoApi.patch(`/api/admin/verifications/${id}/`, { action: "approve" });
      showToast("Verification approved", "success");
      setVerifications((prev) => prev.map((v) => v.id === id ? { ...v, status: "approved" } : v));
    } catch {
      showToast("Failed to approve verification", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectVerification = async (id: number, reason: string) => {
    setProcessingId(`vrf-${id}`);
    try {
      await djangoApi.patch(`/api/admin/verifications/${id}/`, { action: "reject", reason });
      showToast("Verification rejected", "success");
      setVerifications((prev) => prev.map((v) => v.id === id ? { ...v, status: "rejected", rejection_reason: reason } : v));
      setRejectingVerifId(null);
      setRejectVerifReason('');
    } catch {
      showToast("Failed to reject verification", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Moderation / Reports ───────────────────────────────────────────────────
  const [reports, setReports]               = useState<AdminReport[]>([]);
  const [reportStats, setReportStats]       = useState<ReportStats | null>(null);
  const [reportFilter, setReportFilter]     = useState<string>("pending");
  const [modActions, setModActions]         = useState<UserModerationRecord[]>([]);
  const [modLoading, setModLoading]         = useState(false);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [reportAction, setReportAction]     = useState<string>("");
  const [reportActionNotes, setReportActionNotes] = useState("");
  const [suspendUntil, setSuspendUntil]     = useState("");
  const [submitingReportAction, setSubmittingReportAction] = useState(false);

  useEffect(() => {
    if (!isAdmin || activeTab !== "moderation") return;
    setModLoading(true);
    const params = new URLSearchParams();
    if (reportFilter && reportFilter !== "all") params.set("status", reportFilter);
    params.set("ordering", "-created_at");
    Promise.all([
      djangoApi.get<PaginatedResponse<AdminReport>>(`/api/admin/reports/?${params.toString()}`),
      djangoApi.get<ReportStats>("/api/admin/reports/stats/"),
      djangoApi.get<UserModerationRecord[] | PaginatedResponse<UserModerationRecord>>("/api/admin/moderation/users/"),
    ])
      .then(([rpts, stats, mods]) => {
        const items = Array.isArray(rpts) ? rpts : (rpts as PaginatedResponse<AdminReport>).results ?? [];
        setReports(items);
        setReportStats(stats);
        const modItems = Array.isArray(mods) ? mods : (mods as PaginatedResponse<UserModerationRecord>).results ?? [];
        setModActions(modItems);
      })
      .catch(() => {})
      .finally(() => setModLoading(false));
  }, [isAdmin, activeTab, reportFilter]);

  const handleReportAction = async () => {
    if (!selectedReport || !reportAction) return;
    setSubmittingReportAction(true);
    try {
      // Status-only transitions — don't send action_taken
      const STATUS_ONLY = new Set(["investigating", "dismissed", "resolved"]);
      // Action values that also set status → resolved
      const ACTION_VALUES = new Set(["listing_removed","listing_suspended","user_warned","user_suspended","user_banned"]);

      const body: Record<string, string> = { admin_notes: reportActionNotes };

      if (STATUS_ONLY.has(reportAction)) {
        body.status = reportAction;
      } else if (ACTION_VALUES.has(reportAction)) {
        body.status       = "resolved";
        body.action_taken = reportAction;
      }

      if (reportAction === "user_suspended" && suspendUntil) body.suspended_until = suspendUntil;
      const updated = await djangoApi.patch<AdminReport>(`/api/admin/reports/${selectedReport.id}/action/`, body);
      setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedReport(updated);
      showToast("Action taken successfully", "success");
      setReportAction("");
      setReportActionNotes("");
      setSuspendUntil("");
    } catch {
      showToast("Failed to take action", "error");
    } finally {
      setSubmittingReportAction(false);
    }
  };

  const handleLiftRestriction = async (modId: number) => {
    setProcessingId(`mod-${modId}`);
    try {
      await djangoApi.patch(`/api/admin/moderation/users/${modId}/`, { reason: "Restriction lifted by admin" });
      setModActions(prev => prev.map(m => m.id === modId ? { ...m, is_active: false } : m));
      showToast("Restriction lifted", "success");
    } catch {
      showToast("Failed to lift restriction", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Admin Reviews ──────────────────────────────────────────────────────────
  const [adminReviews, setAdminReviews]           = useState<AdminReview[]>([]);
  const [reviewStats, setReviewStats]             = useState<ReviewStats | null>(null);
  const [reviewFilter, setReviewFilter]           = useState<string>("pending");
  const [reviewsLoading, setReviewsLoading]       = useState(false);
  const [selectedAdminReview, setSelectedAdminReview] = useState<AdminReview | null>(null);
  const [reviewAdminNotes, setReviewAdminNotes]   = useState("");
  const [submittingReviewAction, setSubmittingReviewAction] = useState(false);

  useEffect(() => {
    if (!isAdmin || activeTab !== "reviews") return;
    setReviewsLoading(true);
    const params = new URLSearchParams();
    if (reviewFilter && reviewFilter !== "all") params.set("status", reviewFilter);
    params.set("ordering", "-created_at");
    Promise.all([
      djangoApi.get<ReviewStats>("/api/admin/reviews/stats/"),
      djangoApi.get<AdminReview[] | PaginatedResponse<AdminReview>>(`/api/admin/reviews/?${params.toString()}`),
    ])
      .then(([stats, revs]) => {
        setReviewStats(stats);
        const items = Array.isArray(revs) ? revs : (revs as PaginatedResponse<AdminReview>).results ?? [];
        setAdminReviews(items);
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [isAdmin, activeTab, reviewFilter]);

  const handleReviewAction = async (reviewId: number, newStatus: string, notes: string) => {
    setSubmittingReviewAction(true);
    try {
      const updated = await djangoApi.patch<AdminReview>(`/api/admin/reviews/${reviewId}/`, {
        status: newStatus,
        admin_notes: notes,
      });
      setAdminReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelectedAdminReview(updated);
      showToast("Review updated", "success");
    } catch {
      showToast("Failed to update review", "error");
    } finally {
      setSubmittingReviewAction(false);
    }
  };

  // ── Fraud Prevention ───────────────────────────────────────────────────────
  const [fraudFlags, setFraudFlags]               = useState<FraudFlag[]>([]);
  const [fraudStats, setFraudStats]               = useState<FraudStats | null>(null);
  const [fraudLoading, setFraudLoading]           = useState(false);
  const [fraudFilter, setFraudFilter]             = useState<string>("unresolved");
  const [suspiciousIPs, setSuspiciousIPs]         = useState<SuspiciousIP[]>([]);
  const [selectedFraud, setSelectedFraud]         = useState<FraudFlag | null>(null);
  const [fraudNotes, setFraudNotes]               = useState("");
  const [submittingFraud, setSubmittingFraud]     = useState(false);
  const [scanListingId, setScanListingId]         = useState("");
  const [scanUserId, setScanUserId]               = useState("");

  useEffect(() => {
    if (!isAdmin || activeTab !== "fraud") return;
    setFraudLoading(true);
    const params = new URLSearchParams();
    if (fraudFilter === "unresolved") params.set("is_resolved", "false");
    else if (fraudFilter !== "all") params.set("flag_type", fraudFilter);

    Promise.all([
      djangoApi.get<PaginatedResponse<FraudFlag>>(`/api/admin/fraud/?${params}`),
      djangoApi.get<FraudStats>("/api/admin/fraud/stats/"),
      djangoApi.get<SuspiciousIP[]>("/api/admin/fraud/ip-report/"),
    ])
      .then(([flags, stats, ips]) => {
        setFraudFlags(Array.isArray(flags) ? flags : (flags as PaginatedResponse<FraudFlag>).results ?? []);
        setFraudStats(stats);
        setSuspiciousIPs(Array.isArray(ips) ? ips : []);
      })
      .catch(() => {})
      .finally(() => setFraudLoading(false));
  }, [isAdmin, activeTab, fraudFilter]);

  const handleResolveFraud = async () => {
    if (!selectedFraud) return;
    setSubmittingFraud(true);
    try {
      const updated = await djangoApi.patch<FraudFlag>(`/api/admin/fraud/${selectedFraud.id}/`, {
        resolution_notes: fraudNotes,
      });
      setFraudFlags(prev => prev.map(f => f.id === updated.id ? updated : f));
      setSelectedFraud(updated);
      showToast("Fraud flag resolved", "success");
      setFraudNotes("");
    } catch {
      showToast("Failed to resolve flag", "error");
    } finally {
      setSubmittingFraud(false);
    }
  };

  const handleFraudScan = async () => {
    if (!scanListingId && !scanUserId) return;
    try {
      await djangoApi.post("/api/admin/fraud/scan/", {
        ...(scanListingId ? { listing_id: parseInt(scanListingId) } : {}),
        ...(scanUserId ? { user_id: parseInt(scanUserId) } : {}),
      });
      showToast("Fraud scan triggered", "success");
      setScanListingId("");
      setScanUserId("");
    } catch {
      showToast("Scan failed", "error");
    }
  };

  // ── Listing handlers ───────────────────────────────────────────────────────
  const handleSaveListing = async (data: any) => {
    if (!editingListing) return;
    setProcessingId(`lst-${editingListing.id}`);
    try {
      await djangoApi.patch(`/api/listings/${editingListing.id}/`, data);
      showToast("Listing updated", "success");
      setEditingListing(null);
      listingsRefetch();
    } catch {
      showToast("Failed to update listing", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveListing = async (listing: any) => {
    setProcessingId(`lst-${listing.id}`);
    try {
      await djangoApi.patch(`/api/listings/${listing.id}/approve/`);
      showToast("Listing approved", "success");
      listingsRefetch();
      statsRefetch();
    } catch {
      showToast("Failed to approve", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectListing = (listing: any) => {
    setRejectReason("");
    setRejectModal({ type: "listing", item: listing });
  };

  const confirmRejectListing = async (listing: any, reason: string) => {
    setProcessingId(`lst-${listing.id}`);
    try {
      await djangoApi.patch(`/api/listings/${listing.id}/reject/`, reason ? { rejection_reason: reason } : {});
      showToast("Listing rejected", "success");
      setRejectModal(null);
      listingsRefetch();
      statsRefetch();
    } catch {
      showToast("Failed to reject", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestChanges = (listing: any) => {
    setChangesNote("");
    setChangesModal({ item: listing });
  };

  const confirmRequestChanges = async (listing: any, note: string) => {
    setProcessingId(`lst-${listing.id}`);
    try {
      await djangoApi.patch(`/api/listings/${listing.id}/request-changes/`, { admin_notes: note });
      showToast("Changes requested", "success");
      setChangesModal(null);
      listingsRefetch();
      statsRefetch();
    } catch {
      showToast("Failed to request changes", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    setProcessingId(`del-${deletingItem.item.id}`);
    try {
      await djangoApi.delete(`/api/listings/${deletingItem.item.id}/`);
      showToast("Deleted successfully", "success");
      setDeletingItem(null);
      listingsRefetch();
      statsRefetch();
    } catch {
      showToast("Failed to delete", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (!selectedIds.size) return;
    setProcessingId("bulk");
    try {
      await Promise.all(Array.from(selectedIds).map((id) => djangoApi.patch(`/api/listings/${id}/approve/`)));
      showToast(`${selectedIds.size} listings approved`, "success");
      setSelectedIds(new Set());
      listingsRefetch();
      statsRefetch();
    } catch {
      showToast("Bulk approve failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} listings? This cannot be undone.`)) return;
    setProcessingId("bulk");
    try {
      await Promise.all(Array.from(selectedIds).map((id) => djangoApi.delete(`/api/listings/${id}/`)));
      showToast(`${selectedIds.size} listings deleted`, "success");
      setSelectedIds(new Set());
      listingsRefetch();
      statsRefetch();
    } catch {
      showToast("Bulk delete failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    const s = new Set(selectedIds);
    if (s.has(id)) { s.delete(id); } else { s.add(id); }
    setSelectedIds(s);
  };
  const toggleSelectAll = () => {
    if (!listingsResult?.results) return;
    setSelectedIds(selectedIds.size === listingsResult.results.length ? new Set() : new Set(listingsResult.results.map((l) => String(l.id))));
  };

  // ── User handlers ──────────────────────────────────────────────────────────
  const handleSaveUser = async (data: Partial<AdminUser>) => {
    if (!editingUser) return;
    setProcessingId(`usr-${editingUser.id}`);
    try {
      await djangoApi.patch(`/api/users/${editingUser.id}/`, data);
      showToast("User updated", "success");
      setEditingUser(null);
      usersRefetch();
      statsRefetch();
    } catch {
      showToast("Failed to update user", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivateUser = async (user: AdminUser) => {
    if (!confirm(`${user.is_active ? "Deactivate" : "Reactivate"} user "${user.name || user.email}"?`)) return;
    setProcessingId(`usr-${user.id}`);
    try {
      await djangoApi.patch(`/api/users/${user.id}/`, { is_active: !user.is_active });
      showToast(`User ${user.is_active ? "deactivated" : "reactivated"}`, "success");
      usersRefetch();
    } catch {
      showToast("Failed to update user", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const [selectedApp, setSelectedApp] = useState<DealerApplication | null>(null);

  // ── Application handlers ───────────────────────────────────────────────────
  const handleApproveApplication = async (app: DealerApplication) => {
    setProcessingId(`app-${app.id}`);
    try {
      await djangoApi.patch(`/api/importer-applications/admin/${app.id}/`, { status: "approved" });
      showToast(`${app.business_name} approved — applicant is now an importer`, "success");
      appsRefetch();
      statsRefetch();
    } catch {
      showToast("Failed to approve application", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectApplication = (app: DealerApplication) => {
    setRejectReason("");
    setRejectModal({ type: "application", item: app });
  };

  const confirmRejectApplication = async (app: DealerApplication, notes: string) => {
    setProcessingId(`app-${app.id}`);
    try {
      await djangoApi.patch(`/api/importer-applications/admin/${app.id}/`, {
        status: "rejected",
        admin_notes: notes,
      });
      showToast(`${app.business_name} rejected`, "success");
      setRejectModal(null);
      appsRefetch();
      statsRefetch();
    } catch {
      showToast("Failed to reject application", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Importer handlers ─────────────────────────────────────────────────────
  const handleVerifyImporter = async (importer: AdminImporter) => {
    setProcessingId(`imp-${importer.id}`);
    try {
      await djangoApi.post(`/api/importers/${importer.id}/verify/`, {});
      showToast(`${importer.business_name} verified`, "success");
      importersRefetch();
    } catch {
      showToast("Failed to verify importer", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSuspendImporter = async (importer: AdminImporter) => {
    if (!confirm(`${importer.is_suspended ? "Unsuspend" : "Suspend"} "${importer.business_name}"?`)) return;
    setProcessingId(`imp-${importer.id}`);
    try {
      await djangoApi.patch(`/api/importers/${importer.id}/`, { is_suspended: !importer.is_suspended });
      showToast(`Importer ${importer.is_suspended ? "unsuspended" : "suspended"}`, "success");
      importersRefetch();
    } catch {
      showToast("Failed to update importer", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Formatting helpers ─────────────────────────────────────────────────────
  const formatPrice = (p: number) => new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(p);
  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const formatDateTime = (d: string) => new Date(d).toLocaleString();

  const statusBadge = (s: string) => ({
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
    changes_requested: "bg-orange-100 text-orange-700",
    draft: "bg-gray-100 text-gray-700",
    sold: "bg-blue-100 text-blue-700",
  }[s] || "bg-slate-100 text-slate-700");

  const roleBadge = (r: string) => ({
    admin:    "bg-red-100 text-red-700",
    importer: "bg-[#f3f4f6] text-[#0a0a0a]",
    dealer:   "bg-blue-100 text-blue-700",
    user:     "bg-gray-100 text-gray-700",
  }[r] || "bg-slate-100 text-slate-700");

  const levelPill = (user: AdminUser) => {
    // Derive level if not directly available
    let level = user.verification_level;
    if (!level) {
      if (user.is_business_verified) level = "business";
      else if (user.is_identity_verified) level = "identity";
      else if (user.is_phone_verified) level = "phone";
      else if (user.is_email_verified) level = "email";
      else level = "none";
    }
    const cfg: Record<string, string> = {
      full:     "bg-amber-50 text-amber-700 border-amber-200",
      business: "bg-blue-50 text-blue-700 border-blue-200",
      identity: "bg-green-50 text-green-700 border-green-200",
      phone:    "bg-slate-100 text-slate-600 border-slate-200",
      email:    "bg-slate-100 text-slate-600 border-slate-200",
      none:     "bg-slate-100 text-slate-500 border-slate-200",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cfg[level] ?? cfg.none}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  // ── Auth guards ────────────────────────────────────────────────────────────
  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Please sign in to access admin panel</h1>
          <Link href="/auth/signin" className="inline-block px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold">Sign In</Link>
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-slate-500 mb-8">This page is only accessible to administrators.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold">Go Home</Link>
        </div>
      </div>
    );
  }

  // Pending count for Applications tab label
  const pendingAppsCount = stats?.pending_applications ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          </div>
          <p className="text-slate-500">Full control over imported car listings, orders, importers, and applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Listings", value: stats?.total_listings, icon: Car, colorBg: "bg-blue-100", colorTxt: "text-blue-600" },
            { label: "Pending Review", value: stats?.pending_listings, icon: Clock, colorBg: "bg-yellow-100", colorTxt: "text-yellow-600" },
            { label: "Pending Payments", value: (stats as { pending_payments?: number })?.pending_payments ?? paymentsResult?.count ?? 0, icon: DollarSign, colorBg: "bg-emerald-100", colorTxt: "text-emerald-600" },
            { label: "Importers", value: stats?.total_importers, icon: Store, colorBg: "bg-[#f3f4f6]", colorTxt: "text-[#0a0a0a]" },
            { label: "Active Orders", value: (stats as { active_orders?: number })?.active_orders ?? 0, icon: TrendingUp, colorBg: "bg-green-100", colorTxt: "text-green-600" },
            { label: "Users", value: stats?.total_users, icon: Users, colorBg: "bg-purple-100", colorTxt: "text-purple-600" },
          ].map(({ label, value, icon: Icon, colorBg, colorTxt }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${colorBg} rounded-lg`}><Icon className={`w-5 h-5 ${colorTxt}`} /></div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{value ?? <Loader2 className="w-5 h-5 animate-spin text-slate-300 inline" />}</p>
                  <p className="text-sm text-slate-500">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Action Required — the admin's to-do list, one line per queue ── */}
        {(() => {
          const queues = ([
            { label: "Bank transfers to verify", count: paymentsResult?.count ?? 0, tab: "payments" },
            { label: "Listings awaiting review", count: stats?.pending_listings ?? 0, tab: "listings" },
            { label: "Importer applications", count: stats?.pending_applications ?? 0, tab: "applications" },
            { label: "Verification requests", count: verifications.filter((v) => v.status === "pending").length, tab: "verifications" },
            { label: "Open reports", count: reportStats?.pending_count ?? 0, tab: "moderation" },
          ] as { label: string; count: number; tab: TabType }[]).filter((q) => q.count > 0);
          if (queues.length === 0) return null;
          return (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Action required
              </p>
              <div className="flex flex-wrap gap-2">
                {queues.map((q) => (
                  <button
                    key={q.tab + q.label}
                    onClick={() => setActiveTab(q.tab)}
                    className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-sm text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    {q.label}: <span className="font-bold">{q.count}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            { id: "listings",      icon: Car,        label: "Listings",      count: stats?.total_listings },
            { id: "orders",        icon: TrendingUp,  label: "Orders",        count: ordersResult?.count },
            { id: "payments",      icon: DollarSign,  label: "Payments",      count: paymentsResult?.count || undefined },
            { id: "importers",     icon: Store,       label: "Importers",     count: importersResult?.count },
            { id: "pipeline",      icon: Clock,       label: "Pipeline",      count: undefined },
            { id: "users",         icon: Users,       label: "Users",         count: usersResult?.count ?? stats?.total_users },
            { id: "applications",  icon: ShieldCheck, label: "Applications",  count: pendingAppsCount || undefined },
            { id: "audit",         icon: History,     label: "Audit Log",     count: undefined },
            { id: "verifications", icon: ShieldCheck, label: "Verifications", count: verifications.filter((v) => v.status === "pending").length || undefined },
            { id: "moderation",    icon: Flag,        label: "Moderation",    count: reportStats?.pending_count || undefined },
            { id: "reviews",       icon: Star,        label: "Reviews",       count: (reviewStats?.pending_count ?? 0) + (reviewStats?.flagged_count ?? 0) || undefined },
          ] as const).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id ? "bg-accent text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ""}
            </button>
          ))}
          <button
            onClick={() => setActiveTab("fraud")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "fraud" ? "bg-accent text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}
          >
            <Shield className="w-4 h-4" />
            Fraud
            {fraudStats && fraudStats.unresolved > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full leading-none">
                {fraudStats.unresolved}
              </span>
            )}
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            {activeTab !== "audit" && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent" />
              </div>
            )}
            {activeTab === "listings" && (
              <>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white min-w-[150px]">
                  <option value="">All Statuses</option>
                  {["pending", "approved", "rejected", "changes_requested", "draft", "sold"].map((s) => <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white min-w-[150px]">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_high">Price: High → Low</option>
                  <option value="price_low">Price: Low → High</option>
                </select>
              </>
            )}
            {activeTab === "orders" && (
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white min-w-[150px]">
                <option value="">All Statuses</option>
                {["pending", "confirmed", "in_transit", "arrived", "completed", "cancelled"].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            )}
            {activeTab === "pipeline" && (
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white min-w-[170px]">
                <option value="">All Import Stages</option>
                {["sourcing", "purchased", "in_transit", "customs", "arrived", "available"].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            )}
            {activeTab === "users" && (
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white min-w-[150px]">
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="importer">Importer</option>
                <option value="user">User</option>
              </select>
            )}
            {activeTab === "applications" && (
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white min-w-[150px]">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
          </div>
          {/* Bulk actions for listings */}
          {activeTab === "listings" && selectedIds.size > 0 && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-600">{selectedIds.size} selected</span>
              <button onClick={handleBulkApprove} disabled={processingId === "bulk"} className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm">
                <CheckCircle className="w-4 h-4" /> Approve All
              </button>
              <button onClick={handleBulkDelete} disabled={processingId === "bulk"} className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm">
                <Trash2 className="w-4 h-4" /> Delete All
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="text-sm text-slate-500 hover:text-slate-700">Clear</button>
            </div>
          )}
        </div>

        {/* ═══════════════ LISTINGS TAB ═══════════════ */}
        {activeTab === "listings" && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox" checked={!!listingsResult?.results?.length && selectedIds.size === listingsResult.results.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-accent" />
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Car</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Origin</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Price (SAR)</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Importer</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Import Stage</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(listingsResult?.results ?? []).map((listing: any) => (
                    <tr key={listing.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.has(String(listing.id))} onChange={() => toggleSelect(String(listing.id))} className="w-4 h-4 rounded border-slate-300 text-accent" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                            <Image src={getImageUrl(listing.images?.[0]?.image)} alt={listing.title || ""} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 truncate max-w-[180px]">{listing.title || `${listing.year} ${listing.make} ${listing.model}`}</p>
                            <p className="text-xs text-slate-500">{listing.year} • {listing.make} {listing.model}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {listing.source_country ? (
                          <span className="flex items-center gap-1.5">{listing.source_country}</span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">
                        {listing.final_price_sar
                          ? formatPrice(Number(listing.final_price_sar))
                          : formatPrice(listing.price)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-900">{listing.owner?.name || "—"}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[130px]">{listing.owner?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {listing.import_status ? (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-[#f3f4f6] text-[#0a0a0a] capitalize">
                            {listing.import_status.replace(/_/g, " ")}
                          </span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusBadge(listing.status)}`}>{listing.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/car/${listing.id}`} className="p-2 text-slate-500 hover:text-accent hover:bg-slate-100 rounded-lg" title="View"><Eye className="w-4 h-4" /></Link>
                          <button onClick={() => setEditingListing(listing)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit className="w-4 h-4" /></button>
                          {(listing.status === "pending" || listing.status === "changes_requested") && (
                            <>
                              <button onClick={() => handleApproveListing(listing)} disabled={processingId === `lst-${listing.id}`}
                                className="p-2 text-green-500 hover:bg-green-50 rounded-lg" title="Approve">
                                {processingId === `lst-${listing.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleRequestChanges(listing)} disabled={processingId === `lst-${listing.id}`}
                                className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg" title="Request Changes">
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleRejectListing(listing)} disabled={processingId === `lst-${listing.id}`}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Reject">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button onClick={() => setDeletingItem({ type: "listing", item: listing })} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!(listingsResult?.results ?? []).length && (
                <div className="text-center py-12"><Car className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">No listings found</p></div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ PAYMENTS TAB — bank-transfer verification queue ═══ */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Bank transfers awaiting verification</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Match each reference against the WARED bank account, then Confirm (releases the deal — importer gets 99%) or Reject (buyer is asked to re-submit).
              </p>
            </div>
            {pendingPayments.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                No payments waiting — all transfers are verified. 🎉
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-700 text-left">Order #</th>
                      <th className="px-4 py-3 font-medium text-slate-700 text-left">Car</th>
                      <th className="px-4 py-3 font-medium text-slate-700 text-left">Buyer</th>
                      <th className="px-4 py-3 font-medium text-slate-700 text-left">Amount</th>
                      <th className="px-4 py-3 font-medium text-slate-700 text-left">Transfer Ref.</th>
                      <th className="px-4 py-3 font-medium text-slate-700 text-left">Submitted</th>
                      <th className="px-4 py-3 font-medium text-slate-700 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <Link href={`/orders/${p.order_id}`} className="font-mono text-sm text-accent hover:underline">
                            {p.order_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 max-w-[180px] truncate">{p.car_title}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{p.buyer_name}</td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                          SAR {p.amount.toLocaleString("en-SA")}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-slate-600">{p.reference || "—"}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                          {new Date(p.submitted_at).toLocaleDateString("en-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleConfirmPayment(p)}
                              disabled={payingActionId === p.id}
                              className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                              {payingActionId === p.id ? "…" : "Confirm"}
                            </button>
                            <button
                              onClick={() => handleRejectPayment(p)}
                              disabled={payingActionId === p.id}
                              className="px-3.5 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-semibold rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ ORDERS TAB ═══════════════ */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Order #</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Car</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Buyer</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Importer</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Total</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(ordersResult?.results ?? []).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-sm text-slate-700 font-medium">#{order.order_number || order.id}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 max-w-[180px] truncate">{order.listing_title || "—"}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-900">{order.buyer_name || "—"}</p>
                        <p className="text-xs text-slate-400">{order.buyer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{order.importer_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${statusBadge(order.status)}`}>
                          {order.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700 whitespace-nowrap">
                        {order.total_amount ? formatPrice(order.total_amount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!(ordersResult?.results ?? []).length && (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="font-semibold text-slate-900">No orders yet</p>
                  <p className="text-sm text-slate-400 mt-1">Orders will appear here once buyers start placing them.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ IMPORTERS TAB ═══════════════ */}
        {activeTab === "importers" && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Business</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">CR #</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Source Countries</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Cars Listed</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Rating</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Verified</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(importersResult?.results ?? []).map((imp) => (
                    <tr key={imp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{imp.business_name}</p>
                        <p className="text-xs text-slate-400">{imp.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">{imp.cr_number || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(imp.source_countries ?? []).slice(0, 3).map((c) => (
                            <span key={c} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{c}</span>
                          ))}
                          {(imp.source_countries ?? []).length > 3 && (
                            <span className="text-xs text-slate-400">+{imp.source_countries.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{imp.active_listings_count ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium text-slate-700">
                            {Number(imp.average_rating) > 0 ? Number(imp.average_rating).toFixed(1) : "—"}
                          </span>
                          <span className="text-xs text-slate-400">({imp.total_reviews})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${imp.is_verified ? "bg-[#f3f4f6] text-[#0a0a0a]" : "bg-slate-100 text-slate-500"}`}>
                          {imp.is_verified ? <><CheckCircle className="w-3 h-3" /> Verified</> : "Unverified"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/importers/${imp.id}`} className="p-2 text-slate-500 hover:text-accent hover:bg-slate-100 rounded-lg inline-flex" title="View"><Eye className="w-4 h-4" /></Link>
                          {!imp.is_verified && (
                            <button onClick={() => handleVerifyImporter(imp)} disabled={processingId === `imp-${imp.id}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0a0a0a] hover:bg-[#1a1a1a] disabled:bg-[#737373] text-white rounded-lg text-xs font-medium">
                              {processingId === `imp-${imp.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                              Verify
                            </button>
                          )}
                          <button onClick={() => handleSuspendImporter(imp)} disabled={processingId === `imp-${imp.id}`}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${imp.is_suspended ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
                            {imp.is_suspended ? <><CheckCircle className="w-3 h-3" /> Unsuspend</> : <><Ban className="w-3 h-3" /> Suspend</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!(importersResult?.results ?? []).length && (
                <div className="text-center py-12">
                  <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="font-semibold text-slate-900">No importers found</p>
                  <p className="text-sm text-slate-400 mt-1">Approved importer applications will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ PIPELINE TAB ═══════════════ */}
        {activeTab === "pipeline" && (() => {
          const STAGES = ["sourcing", "purchased", "in_transit", "customs", "arrived", "available"] as const;
          const stageCfg: Record<string, { label: string; color: string; bg: string }> = {
            sourcing:   { label: "Sourcing",    color: "text-slate-600",  bg: "bg-slate-50" },
            purchased:  { label: "Purchased",   color: "text-blue-600",   bg: "bg-blue-50" },
            in_transit: { label: "In Transit",  color: "text-indigo-600", bg: "bg-indigo-50" },
            customs:    { label: "Customs",     color: "text-yellow-600", bg: "bg-yellow-50" },
            arrived:    { label: "Arrived",     color: "text-[#0a0a0a]",  bg: "bg-[#f3f4f6]" },
            available:  { label: "Available",   color: "text-green-600",  bg: "bg-green-50" },
          };
          const all: any[] = pipelineResult?.results ?? [];
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {STAGES.map((stage) => {
                  const count = all.filter((l) => l.import_status === stage).length;
                  const cfg = stageCfg[stage];
                  return (
                    <div key={stage} className={`${cfg.bg} border border-slate-100 rounded-xl p-4 text-center`}>
                      <p className={`text-2xl font-bold ${cfg.color}`}>{count}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{cfg.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 font-medium text-slate-700 text-left">Car</th>
                        <th className="px-4 py-3 font-medium text-slate-700 text-left">Origin</th>
                        <th className="px-4 py-3 font-medium text-slate-700 text-left">Importer</th>
                        <th className="px-4 py-3 font-medium text-slate-700 text-left">Stage</th>
                        <th className="px-4 py-3 font-medium text-slate-700 text-left">ETA</th>
                        <th className="px-4 py-3 font-medium text-slate-700 text-left">Price (SAR)</th>
                        <th className="px-4 py-3 font-medium text-slate-700 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {all.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center">
                            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No import pipeline data</p>
                          </td>
                        </tr>
                      ) : all.map((listing: any) => {
                        const stage = listing.import_status;
                        const cfg = stageCfg[stage] ?? { label: stage ?? "—", color: "text-slate-600", bg: "bg-slate-50" };
                        return (
                          <tr key={listing.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900 text-sm truncate max-w-[180px]">
                                {listing.year} {listing.make} {listing.model}
                              </p>
                              {listing.vin && <p className="text-xs font-mono text-slate-400">{listing.vin}</p>}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{listing.source_country || "—"}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{listing.owner?.name || "—"}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${cfg.bg} ${cfg.color} border border-current/20`}>
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                              {listing.estimated_arrival_date ? formatDate(listing.estimated_arrival_date) : "—"}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-700 whitespace-nowrap">
                              {listing.final_price_sar ? formatPrice(Number(listing.final_price_sar)) : formatPrice(listing.price)}
                            </td>
                            <td className="px-4 py-3">
                              <Link href={`/car/${listing.id}`} className="p-2 text-slate-500 hover:text-accent hover:bg-slate-100 rounded-lg inline-flex" title="View">
                                <Eye className="w-4 h-4" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══════════════ USERS TAB ═══════════════ */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">User</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Verified</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Verification</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Role</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Joined</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(usersResult?.results ?? []).map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{user.name || "—"}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <span title={user.is_email_verified ? "Email verified" : "Email not verified"}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${user.is_email_verified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                            <MailCheck className="w-3 h-3" />
                          </span>
                          <span title={user.is_phone_verified ? "Phone verified" : "Phone not verified"}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${user.is_phone_verified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                            <Phone className="w-3 h-3" />
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{levelPill(user)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>{user.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(user.date_joined)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingUser(user)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit user">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeactivateUser(user)} disabled={processingId === `usr-${user.id}`}
                            className={`p-2 rounded-lg ${user.is_active ? "text-red-500 hover:bg-red-50" : "text-green-500 hover:bg-green-50"}`}
                            title={user.is_active ? "Deactivate user" : "Reactivate user"}>
                            {processingId === `usr-${user.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!(usersResult?.results ?? []).length && (
                <div className="text-center py-12"><Users className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">No users found</p></div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ APPLICATIONS TAB ═══════════════ */}
        {activeTab === "applications" && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            {pendingAppsCount > 0 && !statusFilter && (
              <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 font-medium">{pendingAppsCount} pending importer application{pendingAppsCount !== 1 ? "s" : ""} awaiting review</span>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Business</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Applicant</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Type</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">City</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Phone</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Date</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(appsResult?.results ?? []).map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedApp(app)}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{app.business_name}</p>
                        {app.email && <p className="text-xs text-slate-500">{app.email}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-900">{app.applicant_name}</p>
                        <p className="text-xs text-slate-500">{app.applicant_email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 capitalize">{app.business_type}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{app.city}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{app.phone}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusBadge(app.status)}`}>{app.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(app.created_at)}</td>
                      <td className="px-4 py-3">
                        {app.status === "pending" ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleApproveApplication(app)} disabled={processingId === `app-${app.id}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-xs font-medium">
                              {processingId === `app-${app.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                              Approve
                            </button>
                            <button onClick={() => handleRejectApplication(app)} disabled={processingId === `app-${app.id}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-xs font-medium">
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">{app.admin_notes || "—"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!(appsResult?.results ?? []).length && (
                <div className="text-center py-12">
                  <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="font-semibold text-slate-900">{statusFilter === "pending" || !statusFilter ? "No pending importer applications" : `No ${statusFilter} applications`}</p>
                  <p className="text-sm text-slate-500 mt-1">All caught up!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ APPLICATION DETAIL SLIDE-OVER ═══════════════ */}
        {selectedApp && (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions
          <div
            className="fixed inset-0 flex justify-end"
            style={{ zIndex: 10000 }}
            onKeyDown={(e) => { if (e.key === "Escape") setSelectedApp(null); }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
            <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
              {/* ── Panel header (sticky) ── */}
              <div className="flex-shrink-0 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Application Details</p>
                  <h2 className="text-lg font-bold text-slate-900">{selectedApp.business_name}</h2>
                </div>
                <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" autoFocus>
                  <XCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* ── Scrollable content ── */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${statusBadge(selectedApp.status)}`}>
                    {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
                  </span>
                  <span className="text-xs text-slate-400">Submitted {formatDate(selectedApp.created_at)}</span>
                </div>

                {/* Business Info */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Business Info</h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                    {[
                      ["Business Name", selectedApp.business_name],
                      ["Business Type", selectedApp.business_type ? selectedApp.business_type.charAt(0).toUpperCase() + selectedApp.business_type.slice(1) : "—"],
                      ["City", selectedApp.city || "—"],
                      ["Address", selectedApp.address || "—"],
                      ["Expected Listings", selectedApp.expected_listings || "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-medium text-slate-800 text-end max-w-[60%]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact</h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                    {[
                      ["Applicant Name", selectedApp.applicant_name],
                      ["Applicant Email", selectedApp.applicant_email],
                      ["Phone", selectedApp.phone || "—"],
                      ["Contact Email", selectedApp.email || "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-medium text-slate-800 text-end max-w-[60%] break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Description</h3>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedApp.description || "—"}</p>
                  </div>
                </div>

                {/* Admin Notes */}
                {selectedApp.admin_notes && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Admin Notes</h3>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-sm text-amber-800">{selectedApp.admin_notes}</p>
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Meta</h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                    {[
                      ["Application ID", `#${selectedApp.id}`],
                      ["Applicant User ID", `#${selectedApp.applicant}`],
                      ["Submitted", formatDate(selectedApp.created_at)],
                      ["Last Updated", selectedApp.updated_at ? formatDate(selectedApp.updated_at) : "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-medium text-slate-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Sticky footer: actions ── */}
              {selectedApp.status === "pending" && (
                <div className="flex-shrink-0 border-t border-slate-100 px-6 py-4 flex gap-3">
                  <button
                    onClick={async () => { await handleApproveApplication(selectedApp); setSelectedApp(null); }}
                    disabled={processingId === `app-${selectedApp.id}`}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {processingId === `app-${selectedApp.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => { handleRejectApplication(selectedApp); setSelectedApp(null); }}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ AUDIT LOG TAB ═══════════════ */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Timestamp</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">User</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Action</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Model</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">Object</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-left">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(auditResult?.results ?? []).map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDateTime(entry.timestamp)}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{entry.user ? `#${entry.user}` : "System"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{entry.action.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{entry.model_name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{entry.object_id ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{entry.ip_address || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!(auditResult?.results ?? []).length && (
                <div className="text-center py-12"><History className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">No audit logs yet</p></div>
              )}
            </div>
          </div>
        )}
        {/* ═══════════════ VERIFICATIONS TAB ═══════════════ */}
        {activeTab === "verifications" && (() => {
          const filteredVerifs = verifFilter === 'all' ? verifications : verifications.filter(v => v.status === verifFilter);
          return (
            <div className="space-y-4">
              {/* Filter tabs */}
              <div className="flex gap-2">
                {(['all','pending','approved','rejected'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setVerifFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      verifFilter === f
                        ? 'bg-accent text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f === 'pending' && verifications.filter(v => v.status === 'pending').length > 0 && (
                      <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                        {verifications.filter(v => v.status === 'pending').length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                {verificationsLoading ? (
                  <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-medium text-slate-700 text-left">User</th>
                          <th className="px-4 py-3 font-medium text-slate-700 text-left">Type</th>
                          <th className="px-4 py-3 font-medium text-slate-700 text-left">Document #</th>
                          <th className="px-4 py-3 font-medium text-slate-700 text-left">Status</th>
                          <th className="px-4 py-3 font-medium text-slate-700 text-left">Submitted</th>
                          <th className="px-4 py-3 font-medium text-slate-700 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredVerifs.map((vrf) => (
                          <tr key={vrf.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-900">{vrf.user_name || "—"}</p>
                              <p className="text-xs text-slate-500">{vrf.user_email}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 capitalize">{vrf.verification_type.replace(/_/g, " ")}</td>
                            <td className="px-4 py-3 text-sm text-slate-600 font-mono">{vrf.document_number}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusBadge(vrf.status)}`}>{vrf.status}</span>
                              {vrf.status === "rejected" && vrf.rejection_reason && (
                                <p className="text-xs text-red-500 mt-1 max-w-[160px] truncate" title={vrf.rejection_reason}>{vrf.rejection_reason}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{formatDate(vrf.created_at)}</td>
                            <td className="px-4 py-3">
                              {vrf.status === "pending" ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => approveVerification(vrf.id)}
                                      disabled={processingId === `vrf-${vrf.id}`}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-xs font-medium"
                                    >
                                      {processingId === `vrf-${vrf.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                      Approve
                                    </button>
                                    {rejectingVerifId !== vrf.id && (
                                      <button
                                        onClick={() => { setRejectingVerifId(vrf.id); setRejectVerifReason(''); }}
                                        disabled={processingId === `vrf-${vrf.id}`}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-xs font-medium"
                                      >
                                        <XCircle className="w-3 h-3" />
                                        Reject
                                      </button>
                                    )}
                                  </div>
                                  {rejectingVerifId === vrf.id && (
                                    <div className="flex flex-col gap-1.5 min-w-[220px]">
                                      <input
                                        type="text"
                                        value={rejectVerifReason}
                                        onChange={e => setRejectVerifReason(e.target.value)}
                                        placeholder="Rejection reason…"
                                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                                        autoFocus
                                      />
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => rejectVerification(vrf.id, rejectVerifReason)}
                                          disabled={processingId === `vrf-${vrf.id}`}
                                          className="flex items-center gap-1 px-2.5 py-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-xs font-medium"
                                        >
                                          {processingId === `vrf-${vrf.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                          Confirm Reject
                                        </button>
                                        <button
                                          onClick={() => { setRejectingVerifId(null); setRejectVerifReason(''); }}
                                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">
                                  {vrf.reviewed_at ? `Reviewed ${formatDate(vrf.reviewed_at)}` : "—"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredVerifs.length === 0 && (
                      <div className="text-center py-12">
                        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="font-semibold text-slate-900">
                          {verifFilter === 'all' ? 'No verification requests' : `No ${verifFilter} verifications`}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">All caught up!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

        {/* ═══════════════ MODERATION TAB ═══════════════ */}
        {activeTab === "moderation" && (
          <div className="space-y-6">

            {/* Stats cards */}
            {reportStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Reports",  value: reportStats.total,               color: "text-slate-900" },
                  { label: "Pending",        value: reportStats.pending_count,        color: "text-yellow-600" },
                  { label: "Investigating",  value: reportStats.investigating_count,  color: "text-blue-600" },
                  { label: "This Month",     value: reportStats.this_month,           color: "text-accent" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 text-center">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {(["all","pending","investigating","resolved","dismissed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setReportFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    reportFilter === f ? "bg-accent text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === "pending" && (reportStats?.pending_count ?? 0) > 0 && (
                    <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {reportStats!.pending_count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {modLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Reports list ── */}
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Flag className="w-4 h-4 text-red-500" /> Reports
                    </h3>
                    <span className="text-xs text-slate-400">{reports.length} shown</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                    {reports.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-sm">No reports found</div>
                    ) : reports.map((r) => {
                      const priorityColors: Record<string, string> = { urgent: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-green-500" };
                      const statusBadgeClass: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", investigating: "bg-blue-100 text-blue-700", resolved: "bg-green-100 text-green-700", dismissed: "bg-slate-100 text-slate-500" };
                      return (
                        <button
                          key={r.id}
                          onClick={() => setSelectedReport(r)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selectedReport?.id === r.id ? "bg-accent/5 border-l-2 border-accent" : ""}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${priorityColors[r.priority] ?? "bg-slate-400"}`} />
                              <span className="text-sm font-medium text-slate-900 capitalize">
                                {r.report_type} — {r.reason.replace(/_/g, " ")}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass[r.status] ?? ""}`}>
                              {r.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            By {r.reporter?.email ?? "—"} · {new Date(r.created_at).toLocaleDateString()}
                          </div>
                          {(r.listing || r.reported_user) && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {r.listing
                                ? `${r.listing.year} ${r.listing.make} ${r.listing.model}`
                                : r.reported_user?.name ?? "—"}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Report detail + action panel ── */}
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                  {selectedReport ? (
                    <div className="h-full flex flex-col">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-900">Report #{selectedReport.id}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 capitalize">
                          {selectedReport.report_type} · {selectedReport.reason.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="p-4 space-y-4 overflow-y-auto flex-1">
                        {/* Reporter */}
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Reporter</p>
                          <p className="text-sm text-slate-900">{selectedReport.reporter?.name} <span className="text-slate-400">({selectedReport.reporter?.email})</span></p>
                        </div>
                        {/* Target */}
                        {selectedReport.listing && (
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Reported Listing</p>
                            <p className="text-sm text-slate-900">{selectedReport.listing.year} {selectedReport.listing.make} {selectedReport.listing.model}</p>
                          </div>
                        )}
                        {selectedReport.reported_user && (
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Reported User</p>
                            <p className="text-sm text-slate-900">{selectedReport.reported_user.name} <span className="text-slate-400">({selectedReport.reported_user.email})</span></p>
                          </div>
                        )}
                        {/* Description */}
                        {selectedReport.description && (
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Description</p>
                            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{selectedReport.description}</p>
                          </div>
                        )}
                        {/* Evidence */}
                        {selectedReport.evidence_url && (
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Evidence</p>
                            <a href={selectedReport.evidence_url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">View evidence file</a>
                          </div>
                        )}
                        {/* Status / action_taken */}
                        {selectedReport.status !== "pending" && (
                          <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                            <p className="text-xs text-slate-400 uppercase tracking-wide">Resolution</p>
                            <p className="text-sm text-slate-700">Status: <span className="font-medium capitalize">{selectedReport.status}</span></p>
                            {selectedReport.action_taken !== "none" && (
                              <p className="text-sm text-slate-700">Action: <span className="font-medium capitalize">{selectedReport.action_taken.replace(/_/g, " ")}</span></p>
                            )}
                            {selectedReport.admin_notes && (
                              <p className="text-sm text-slate-500">{selectedReport.admin_notes}</p>
                            )}
                          </div>
                        )}

                        {/* Action form — only if not resolved/dismissed */}
                        {!["resolved","dismissed"].includes(selectedReport.status) && (
                          <div className="space-y-3 pt-2 border-t border-slate-100">
                            <p className="text-sm font-medium text-slate-900">Take Action</p>
                            <select
                              value={reportAction}
                              onChange={e => setReportAction(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-accent focus:outline-none"
                            >
                              <option value="">Select action…</option>
                              <option value="investigating">Mark as Investigating</option>
                              <option value="dismissed">Dismiss Report</option>
                              <option value="resolved">Resolve (No Action)</option>
                              {selectedReport.listing && <option value="listing_removed">Remove Listing</option>}
                              {selectedReport.listing && <option value="listing_suspended">Suspend Listing</option>}
                              {(selectedReport.reported_user || selectedReport.listing) && <option value="user_warned">Warn User</option>}
                              {(selectedReport.reported_user || selectedReport.listing) && <option value="user_suspended">Suspend User</option>}
                              {(selectedReport.reported_user || selectedReport.listing) && <option value="user_banned">Ban User</option>}
                            </select>
                            {reportAction === "user_suspended" && (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Suspended until <span className="text-red-500">*</span></label>
                                <input
                                  type="datetime-local"
                                  value={suspendUntil}
                                  onChange={e => setSuspendUntil(e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-accent focus:outline-none"
                                />
                              </div>
                            )}
                            <textarea
                              value={reportActionNotes}
                              onChange={e => setReportActionNotes(e.target.value)}
                              placeholder="Admin notes (optional)…"
                              rows={2}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:border-accent focus:outline-none"
                            />
                            <button
                              onClick={handleReportAction}
                              disabled={!reportAction || submitingReportAction || (reportAction === "user_suspended" && !suspendUntil)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-colors"
                            >
                              {submitingReportAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Confirm Action
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                      <Flag className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="text-slate-400 text-sm">Select a report to view details</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── User Moderation History ── */}
            {!modLoading && modActions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Ban className="w-4 h-4 text-red-500" />
                  <h3 className="font-semibold text-slate-900">User Moderation History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">User</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Action</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Reason</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Expires</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {modActions.map((m) => {
                        const actionConfig: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
                          warning:    { cls: "bg-yellow-100 text-yellow-700", icon: TriangleAlert, label: "Warning" },
                          suspension: { cls: "bg-orange-100 text-orange-700", icon: CalendarClock,  label: "Suspended" },
                          ban:        { cls: "bg-red-100 text-red-700",       icon: Ban,            label: "Banned" },
                          lifted:     { cls: "bg-green-100 text-green-700",   icon: CheckCircle,    label: "Lifted" },
                        };
                        const cfg = actionConfig[m.action] ?? actionConfig.warning;
                        const Icon = cfg.icon;
                        return (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-900">{m.user_email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
                                <Icon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate">{m.reason}</td>
                            <td className="px-4 py-3 text-sm text-slate-500">
                              {m.expires_at ? new Date(m.expires_at).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.is_active ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                                {m.is_active ? "Active" : "Lifted"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {m.is_active && m.action !== "warning" && m.action !== "lifted" && (
                                <button
                                  onClick={() => handleLiftRestriction(m.id)}
                                  disabled={processingId === `mod-${m.id}`}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium"
                                >
                                  {processingId === `mod-${m.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                  Lift
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ REVIEWS TAB ═══════════════ */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            {/* Stats cards */}
            {reviewStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Reviews",      value: reviewStats.total,                        icon: Star,         color: "yellow" },
                  { label: "Pending",            value: reviewStats.pending_count,                icon: Clock,        color: "orange" },
                  { label: "Flagged",            value: reviewStats.flagged_count,                icon: Flag,         color: "red" },
                  { label: "Platform Average",   value: reviewStats.platform_average != null ? Number(reviewStats.platform_average).toFixed(1) : "—", icon: TrendingUp,   color: "green" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${color}-100 rounded-lg`}>
                        <Icon className={`w-4 h-4 text-${color}-600`} />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-900">{value ?? "—"}</p>
                        <p className="text-xs text-slate-500">{label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filter tabs */}
            <div className="bg-white rounded-xl border border-slate-100 p-3 flex gap-2 flex-wrap">
              {["all", "pending", "flagged", "approved", "rejected"].map((f) => (
                <button
                  key={f}
                  onClick={() => { setReviewFilter(f); setSelectedAdminReview(null); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    reviewFilter === f
                      ? "bg-accent text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {f}
                  {f === "pending" && reviewStats?.pending_count ? ` (${reviewStats.pending_count})` : ""}
                  {f === "flagged" && reviewStats?.flagged_count ? ` (${reviewStats.flagged_count})` : ""}
                </button>
              ))}
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : (
              <div className={`${selectedAdminReview ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : ""}`}>
                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Reviewer</th>
                          <th className="px-4 py-3">Reviewed</th>
                          <th className="px-4 py-3">Rating</th>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {adminReviews.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">
                              No reviews found.
                            </td>
                          </tr>
                        ) : adminReviews.map((r) => {
                          const statusColors: Record<string, string> = {
                            approved: "bg-green-100 text-green-700",
                            rejected: "bg-red-100 text-red-700",
                            pending:  "bg-yellow-100 text-yellow-700",
                            flagged:  "bg-orange-100 text-orange-700",
                          };
                          return (
                            <tr
                              key={r.id}
                              onClick={() => { setSelectedAdminReview(r); setReviewAdminNotes(r.admin_notes || ""); }}
                              className={`hover:bg-slate-50 cursor-pointer transition-colors text-sm ${selectedAdminReview?.id === r.id ? "bg-accent/5" : ""}`}
                            >
                              <td className="px-4 py-3 text-slate-700">{r.reviewer_name}</td>
                              <td className="px-4 py-3 text-slate-700">{r.reviewed_user_name}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-slate-800">{r.rating}</span>
                                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-700 max-w-[140px] truncate">{r.title}</td>
                              <td className="px-4 py-3">
                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">
                                  {r.review_type.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[r.status] ?? "bg-slate-100 text-slate-500"}`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                                {new Date(r.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Detail panel */}
                {selectedAdminReview && (
                  <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">Review Detail</h3>
                      <button onClick={() => setSelectedAdminReview(null)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Review content */}
                    <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`w-4 h-4 ${s <= selectedAdminReview.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400 capitalize bg-slate-200 px-2 py-0.5 rounded-full">
                          {selectedAdminReview.review_type.replace(/_/g, " ")}
                        </span>
                        {selectedAdminReview.is_verified_purchase && (
                          <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{selectedAdminReview.title}</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{selectedAdminReview.comment}</p>
                      <p className="text-xs text-slate-400">
                        By <span className="font-medium">{selectedAdminReview.reviewer_name}</span>
                        {" "}→{" "}
                        <span className="font-medium">{selectedAdminReview.reviewed_user_name}</span>
                        {" · "}{new Date(selectedAdminReview.created_at).toLocaleDateString()}
                      </p>
                      {selectedAdminReview.reply && (
                        <div className="mt-2 p-3 bg-white rounded-lg border border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Reply from {selectedAdminReview.reply.author_name}
                          </p>
                          <p className="text-sm text-slate-600">{selectedAdminReview.reply.comment}</p>
                        </div>
                      )}
                    </div>

                    {/* Admin notes */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Admin Notes</label>
                      <textarea
                        value={reviewAdminNotes}
                        onChange={(e) => setReviewAdminNotes(e.target.value)}
                        rows={3}
                        placeholder="Optional notes about this review..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent resize-none"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleReviewAction(selectedAdminReview.id, "approved", reviewAdminNotes)}
                        disabled={submittingReviewAction || selectedAdminReview.status === "approved"}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-200 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {submittingReviewAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewAction(selectedAdminReview.id, "rejected", reviewAdminNotes)}
                        disabled={submittingReviewAction || selectedAdminReview.status === "rejected"}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-200 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {submittingReviewAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Reject
                      </button>
                      <button
                        onClick={() => handleReviewAction(selectedAdminReview.id, "flagged", reviewAdminNotes)}
                        disabled={submittingReviewAction || selectedAdminReview.status === "flagged"}
                        className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {submittingReviewAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                        Flag
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ FRAUD TAB ═══════════════ */}
        {activeTab === "fraud" && (
          <div className="space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Flags",  value: fraudStats?.total,      color: "text-slate-700",   bg: "bg-white",       border: "border-slate-100" },
                { label: "Unresolved",   value: fraudStats?.unresolved,  color: "text-orange-700", bg: "bg-orange-50",   border: "border-orange-200" },
                { label: "Critical",     value: fraudStats?.critical,    color: "text-red-700",    bg: "bg-red-50",      border: "border-red-200" },
                { label: "This Week",    value: fraudStats?.this_week,   color: "text-blue-700",   bg: "bg-blue-50",     border: "border-blue-200" },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} className={`${bg} rounded-xl p-4 border ${border}`}>
                  <p className={`text-2xl font-bold ${color}`}>{value ?? <Loader2 className="w-5 h-5 animate-spin text-slate-300 inline" />}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div className="bg-white rounded-xl border border-slate-100 p-3 flex gap-2 flex-wrap">
              {["all", "unresolved", "duplicate_vin", "suspicious_price", "banned_keywords", "rapid_posting", "ip_abuse", "price_manipulation"].map((f) => (
                <button
                  key={f}
                  onClick={() => { setFraudFilter(f); setSelectedFraud(null); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    fraudFilter === f
                      ? "bg-accent text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {f.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {fraudLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : (
              <div className={`${selectedFraud ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : ""}`}>
                {/* Flags list */}
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Severity</th>
                          <th className="px-4 py-3">Flag Type</th>
                          <th className="px-4 py-3">Target</th>
                          <th className="px-4 py-3">Detection</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {fraudFlags.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                              No fraud flags found.
                            </td>
                          </tr>
                        ) : fraudFlags.map((flag) => {
                          const severityColors: Record<string, string> = {
                            critical: "bg-red-100 text-red-700 border border-red-200",
                            high:     "bg-orange-100 text-orange-700 border border-orange-200",
                            medium:   "bg-yellow-100 text-yellow-700 border border-yellow-200",
                            low:      "bg-blue-100 text-blue-700 border border-blue-200",
                          };
                          return (
                            <tr
                              key={flag.id}
                              onClick={() => setSelectedFraud(flag)}
                              className={`hover:bg-slate-50 cursor-pointer transition-colors text-sm ${selectedFraud?.id === flag.id ? "bg-accent/5" : ""}`}
                            >
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${severityColors[flag.severity] ?? "bg-slate-100 text-slate-500"}`}>
                                  {flag.severity}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-700 capitalize">
                                {flag.flag_type.replace(/_/g, " ")}
                              </td>
                              <td className="px-4 py-3 text-slate-600 text-xs">
                                {flag.listing_title ? (
                                  <span className="block truncate max-w-[120px]" title={flag.listing_title}>{flag.listing_title}</span>
                                ) : flag.user_email ? (
                                  <span className="block truncate max-w-[120px]" title={flag.user_email}>{flag.user_email}</span>
                                ) : "—"}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${flag.auto_detected ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                                  {flag.auto_detected ? "Auto" : "Manual"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                                {new Date(flag.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                {flag.is_resolved ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                                    <CheckCircle className="w-3 h-3" /> Resolved
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full font-medium">
                                    <AlertTriangle className="w-3 h-3" /> Open
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Detail panel */}
                {selectedFraud && (
                  <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 capitalize">{selectedFraud.flag_type.replace(/_/g, " ")}</h3>
                        {(() => {
                          const severityColors: Record<string, string> = {
                            critical: "bg-red-100 text-red-700 border border-red-200",
                            high:     "bg-orange-100 text-orange-700 border border-orange-200",
                            medium:   "bg-yellow-100 text-yellow-700 border border-yellow-200",
                            low:      "bg-blue-100 text-blue-700 border border-blue-200",
                          };
                          return (
                            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${severityColors[selectedFraud.severity] ?? "bg-slate-100 text-slate-500"}`}>
                              {selectedFraud.severity}
                            </span>
                          );
                        })()}
                      </div>
                      <button
                        onClick={() => setSelectedFraud(null)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Details */}
                    {Object.keys(selectedFraud.details).length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Details</p>
                        {Object.entries(selectedFraud.details).map(([k, v]) => (
                          <div key={k} className="flex gap-2 text-sm">
                            <span className="text-slate-500 capitalize flex-shrink-0">{k.replace(/_/g, " ")}:</span>
                            <span className="text-slate-800 font-medium break-all">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Related listing */}
                    {selectedFraud.listing_title && (
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-500">Listing:</span>
                        <span className="text-slate-800 font-medium">{selectedFraud.listing_title}</span>
                        {selectedFraud.listing && (
                          <Link href={`/car/${selectedFraud.listing}`} className="text-accent text-xs hover:underline ml-auto">View</Link>
                        )}
                      </div>
                    )}

                    {/* Related user */}
                    {selectedFraud.user_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-500">User:</span>
                        <span className="text-slate-800 font-medium">{selectedFraud.user_email}</span>
                      </div>
                    )}

                    {/* Resolution section */}
                    {!selectedFraud.is_resolved ? (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <label className="block text-sm font-medium text-slate-700">Resolution Notes</label>
                        <textarea
                          value={fraudNotes}
                          onChange={(e) => setFraudNotes(e.target.value)}
                          rows={3}
                          placeholder="Describe the action taken..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent resize-none"
                        />
                        <button
                          onClick={handleResolveFraud}
                          disabled={submittingFraud}
                          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          {submittingFraud ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Resolve Flag
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">Resolved</span>
                          {selectedFraud.resolved_at && (
                            <span className="text-slate-400 text-xs ml-auto">{new Date(selectedFraud.resolved_at).toLocaleDateString()}</span>
                          )}
                        </div>
                        {selectedFraud.resolved_by_email && (
                          <p className="text-xs text-slate-500">By: <span className="font-medium text-slate-700">{selectedFraud.resolved_by_email}</span></p>
                        )}
                        {selectedFraud.resolution_notes && (
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedFraud.resolution_notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Suspicious IPs */}
            {suspiciousIPs.length > 0 && (
              <div className="mt-6 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <h3 className="font-semibold text-slate-900 text-sm">Suspicious IPs ({suspiciousIPs.length})</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-2 text-left">IP Address</th>
                      <th className="px-4 py-2 text-left">Accounts</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suspiciousIPs.map(ip => (
                      <tr key={ip.ip_address} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-slate-700">{ip.ip_address}</td>
                        <td className="px-4 py-2 text-orange-600">{ip.user_count}</td>
                        <td className="px-4 py-2 text-slate-600">{ip.action_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Manual Scan */}
            <div className="mt-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Search className="w-4 h-4 text-accent" />
                Manual Fraud Scan
              </h3>
              <div className="flex gap-3 flex-wrap">
                <input
                  type="number"
                  placeholder="Listing ID"
                  value={scanListingId}
                  onChange={e => setScanListingId(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm w-32"
                />
                <input
                  type="number"
                  placeholder="User ID"
                  value={scanUserId}
                  onChange={e => setScanUserId(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm w-32"
                />
                <button
                  onClick={handleFraudScan}
                  disabled={!scanListingId && !scanUserId}
                  className="px-4 py-2 bg-accent hover:bg-accent/90 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
                >
                  Run Scan
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Modals */}
      {editingListing && (
        <EditListingModal listing={editingListing} onClose={() => setEditingListing(null)} onSave={handleSaveListing} isSaving={processingId === `lst-${editingListing.id}`} />
      )}
      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} isSaving={processingId === `usr-${editingUser.id}`} />
      )}
      {deletingItem && (
        <DeleteConfirmModal
          title={`Delete ${deletingItem.type}?`}
          message={`Are you sure you want to delete "${deletingItem.item.title || deletingItem.item.name}"?`}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDeleteItem}
          isDeleting={processingId === `del-${deletingItem.item.id}`}
        />
      )}
      {/* Rejection Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Reject {rejectModal.type === "listing" ? "Listing" : "Application"}
              </h2>
              <button onClick={() => setRejectModal(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Rejecting: <span className="font-medium text-slate-900">
                {rejectModal.type === "listing"
                  ? (rejectModal.item.title || `${rejectModal.item.year} ${rejectModal.item.make} ${rejectModal.item.model}`)
                  : rejectModal.item.business_name}
              </span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Rejection reason <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Explain why this is being rejected…"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-accent focus:ring-1 focus:ring-accent resize-none"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-sm">Cancel</button>
              <button
                onClick={() => {
                  if (rejectModal.type === "listing") {
                    confirmRejectListing(rejectModal.item, rejectReason);
                  } else {
                    confirmRejectApplication(rejectModal.item, rejectReason);
                  }
                }}
                disabled={processingId === `lst-${rejectModal.item.id}` || processingId === `app-${rejectModal.item.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium text-sm"
              >
                {(processingId === `lst-${rejectModal.item.id}` || processingId === `app-${rejectModal.item.id}`)
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <XCircle className="w-4 h-4" />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Request Changes Modal */}
      {changesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setChangesModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {t("listingStatus.requestChanges")}
              </h2>
              <button onClick={() => setChangesModal(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              {changesModal.item.title || `${changesModal.item.year} ${changesModal.item.make} ${changesModal.item.model}`}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("listingStatus.adminNote")}</label>
              <textarea
                value={changesNote}
                onChange={(e) => setChangesNote(e.target.value)}
                rows={3}
                placeholder={t("listingStatus.enterNote")}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-accent focus:ring-1 focus:ring-accent resize-none"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setChangesModal(null)} className="flex-1 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-sm">Cancel</button>
              <button
                onClick={() => confirmRequestChanges(changesModal.item, changesNote)}
                disabled={!changesNote.trim() || processingId === `lst-${changesModal.item.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium text-sm"
              >
                {processingId === `lst-${changesModal.item.id}`
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <MessageSquare className="w-4 h-4" />}
                {t("listingStatus.requestChanges")}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
