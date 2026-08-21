"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/hooks/use-api";
import { useTranslation } from "@/lib/i18n";
import type { Order, OrderTimelineEvent, OrderDocument } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import nextDynamic from "next/dynamic";
import {
  ArrowLeft,
  Loader2,
  Package,
  CheckCircle,
  Clock,
  MapPin,
  FileText,
  Download,
  MessageSquare,
  XCircle,
  Ship,
  Anchor,
  ShieldCheck,
  Truck,
  Home,
  CreditCard,
  AlertCircle,
  User,
  Calendar,
  DollarSign,
  ExternalLink,
  ChevronRight,
  Upload,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { getImageUrl } from "@/lib/utils";

const OrderTrackingMap = nextDynamic(
  () => import("@/components/OrderTrackingMap"),
  { ssr: false, loading: () => (
    <div className="h-[300px] rounded-xl bg-slate-100 animate-pulse" />
  )}
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatSAR = (n: number | null | undefined) => {
  if (n == null) return "—";
  const num = typeof (n as unknown) === "string" ? parseFloat(n as unknown as string) : n;
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-SA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const COUNTRY_FLAGS: Record<string, string> = {
  usa: "🇺🇸", us: "🇺🇸", japan: "🇯🇵", jp: "🇯🇵",
  uae: "🇦🇪", ae: "🇦🇪", korea: "🇰🇷", kr: "🇰🇷",
  germany: "🇩🇪", de: "🇩🇪", uk: "🇬🇧", gb: "🇬🇧",
  canada: "🇨🇦", ca: "🇨🇦", europe: "🇪🇺", eu: "🇪🇺",
};

const STATUS_STEPS: { key: OrderStatus | string; label: string; icon: React.ElementType }[] = [
  { key: "pending",             label: "Pending",          icon: CreditCard },
  { key: "deposit_requested",   label: "Deposit",          icon: CreditCard },
  { key: "deposit_paid",        label: "Paid",             icon: CheckCircle },
  { key: "confirmed",           label: "Confirmed",        icon: CheckCircle },
  { key: "sourcing",            label: "Sourcing",         icon: Package },
  { key: "purchased",           label: "Purchased",        icon: CheckCircle },
  { key: "preparing_shipment",  label: "Preparing",        icon: Package },
  { key: "shipped",             label: "Shipped",          icon: Ship },
  { key: "arrived_port",        label: "At Port",          icon: Anchor },
  { key: "in_customs",          label: "Customs",          icon: ShieldCheck },
  { key: "customs_cleared",     label: "Cleared",          icon: CheckCircle },
  { key: "inspection",          label: "Inspection",       icon: ShieldCheck },
  { key: "ready",               label: "Ready",            icon: Truck },
  { key: "delivered",           label: "Delivered",        icon: Home },
];

type OrderStatus = import("@/lib/types").OrderStatus;

const STATUS_ORDER_MAP: Record<string, number> = Object.fromEntries(
  STATUS_STEPS.map((s, i) => [s.key, i])
);

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
  disputed:           "bg-red-100 text-red-700",
};

const DOC_ICONS: Record<string, React.ElementType> = {
  bill_of_lading:     Ship,
  inspection_report:  ShieldCheck,
  customs_document:   FileText,
  payment_receipt:    CreditCard,
  title_transfer:     FileText,
};

// ---------------------------------------------------------------------------
// Payment — buyer pays the car balance to WARED by bank transfer.
// States: awaiting_payment → under_review → paid.
// ---------------------------------------------------------------------------
function PaymentSection({ order, onUpdated }: { order: Order; onUpdated: () => void }) {
  const o = order as unknown as {
    id: number;
    payment_status?: string;
    balance_payment?: { status: string; amount: number; reference: string } | null;
    payment_instructions?: {
      bank_name: string; beneficiary: string; iban: string;
      amount_sar: number; note: string;
    } | null;
    status?: string;
  };
  const [reference, setReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const payStatus = o.payment_status;
  const instr = o.payment_instructions;

  if (o.status === "cancelled" || o.status === "refunded") return null;

  if (payStatus === "paid") {
    return (
      <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
        <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
          <CheckCircle className="w-5 h-5" /> Payment confirmed by WARED
        </div>
        <p className="text-[13px] text-green-700/80 mt-1.5">
          Full payment received{o.balance_payment ? ` (${formatSAR(o.balance_payment.amount)})` : ""}. The importer is now arranging delivery — follow progress in the timeline.
        </p>
      </div>
    );
  }

  if (payStatus === "under_review") {
    return (
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
        <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
          <Clock className="w-5 h-5" /> Payment under review by WARED
        </div>
        <p className="text-[13px] text-amber-800/80 mt-1.5">
          We received your transfer reference
          {o.balance_payment?.reference ? <> (<span className="font-mono">{o.balance_payment.reference}</span>)</> : null}.
          WARED verifies bank transfers within 1 business day — you&apos;ll be notified once confirmed.
        </p>
      </div>
    );
  }

  if (!instr) return null;

  const submit = async () => {
    if (!reference.trim()) { setError("Enter the bank transfer reference number."); return; }
    setIsSubmitting(true); setError("");
    try {
      await api.post(`/api/orders/${o.id}/pay-balance/`, { reference: reference.trim() });
      onUpdated();
    } catch {
      setError("Could not submit the reference. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-accent/30 p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-accent" /> Pay for your car
      </h2>
      <p className="text-[13px] text-slate-500 mb-4">
        For an amount this size, payment is made by <span className="font-semibold text-slate-700">bank transfer to WARED</span> — your money is held safely by the platform and only released to the importer after delivery.
      </p>
      <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm mb-4">
        <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold text-slate-900">{formatSAR(instr.amount_sar)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Bank</span><span className="font-medium text-slate-800">{instr.bank_name}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Beneficiary</span><span className="font-medium text-slate-800">{instr.beneficiary}</span></div>
        <div className="flex justify-between gap-3"><span className="text-slate-500">IBAN</span><span className="font-mono text-[13px] text-slate-800 text-right">{instr.iban}</span></div>
        <p className="text-xs text-slate-400 pt-1 border-t border-slate-200">{instr.note}</p>
      </div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        After transferring, enter your bank reference number:
      </label>
      <div className="flex gap-2">
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. SNB-TRF-2026-001234"
          className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-accent"
        />
        <button
          onClick={submit}
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          I&apos;ve paid
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}

// Importer-side payment state: awaiting / under review / paid + payout share
function ImporterPaymentCard({ order }: { order: Order }) {
  const o = order as unknown as {
    payment_status?: string;
    balance_payment?: { amount: number; reference: string } | null;
    importer_payout?: { commission_pct: number; payout_pct: number; payout_sar: number } | null;
    status?: string;
  };
  if (o.status === "cancelled" || o.status === "refunded") return null;
  const ps = o.payment_status;
  const payout = o.importer_payout;

  const state =
    ps === "paid"
      ? { cls: "bg-green-50 border-green-200 text-green-700", icon: CheckCircle, label: "Buyer has paid — cleared for delivery" }
      : ps === "under_review"
      ? { cls: "bg-amber-50 border-amber-200 text-amber-800", icon: Clock, label: "Buyer submitted payment — WARED is verifying" }
      : { cls: "bg-slate-50 border-slate-200 text-slate-600", icon: Clock, label: "Waiting for buyer payment" };
  const Icon = state.icon;

  return (
    <div className={`rounded-2xl border p-5 ${state.cls}`}>
      <div className="flex items-center gap-2 font-semibold text-sm">
        <Icon className="w-5 h-5" /> {state.label}
      </div>
      {payout && (
        <p className="text-[13px] mt-1.5 opacity-85">
          Your payout after WARED&apos;s {payout.commission_pct}% commission:{" "}
          <span className="font-bold">{formatSAR(payout.payout_sar)}</span> ({payout.payout_pct}%)
          {ps === "paid" ? " — released after delivery is confirmed." : "."}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
function TimelineView({ events, currentStatus }: { events: OrderTimelineEvent[]; currentStatus: string }) {
  const currentStep = STATUS_ORDER_MAP[currentStatus] ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-slate-400" />
        Order Timeline
      </h2>

      <div className="space-y-0">
        {events.length > 0 ? (
          events.map((event, i) => {
            const isLast = i === events.length - 1;
            return (
              <div key={event.id} className="flex gap-4">
                {/* Spine */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    event.is_current
                      ? "bg-accent text-white ring-4 ring-accent/20"
                      : "bg-green-500 text-white"
                  }`}>
                    {event.is_current ? (
                      <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </div>
                  {!isLast && <div className="w-0.5 h-full bg-slate-100 my-1 min-h-[2rem]" />}
                </div>
                {/* Content */}
                <div className={`pb-6 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${event.is_current ? "text-accent" : "text-slate-800"}`}>
                        {event.title}
                      </p>
                      {event.description && (
                        <p className="text-sm text-slate-500 mt-0.5">{event.description}</p>
                      )}
                      {event.location && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">
                      {formatDateTime(event.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* No events yet — show projected stepper */
          <div>
            <p className="text-sm text-slate-400 mb-4">Tracking events will appear here as your order progresses.</p>
            <div className="space-y-3">
              {STATUS_STEPS.filter(s => s.key !== "cancelled" && s.key !== "refunded").map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                const StepIcon = step.icon;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done ? "bg-green-500 text-white"
                        : active ? "bg-accent text-white ring-4 ring-accent/20"
                        : "bg-slate-100 text-slate-400"
                    }`}>
                      {done ? <CheckCircle className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                    </div>
                    <span className={`text-sm font-medium ${
                      active ? "text-accent" : done ? "text-slate-700" : "text-slate-400"
                    }`}>
                      {step.label}
                    </span>
                    {active && (
                      <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full font-semibold">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------
function DocumentsSection({ orderId }: { orderId: string }) {
  const { data: docs, isLoading } = useApiQuery<OrderDocument[]>(
    `/api/orders/${orderId}/documents/`,
    { enabled: !!orderId }
  );

  if (isLoading) return null;
  if (!docs || docs.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <FileText className="w-5 h-5 text-slate-400" />
        Documents
      </h2>
      <p className="text-sm text-slate-400">No documents uploaded yet. They will appear here as your order progresses.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-slate-400" />
        Documents
        <span className="ml-auto text-xs text-slate-400">{docs.length} file{docs.length !== 1 ? "s" : ""}</span>
      </h2>
      <div className="space-y-3">
        {docs.map((doc) => {
          const DocIcon = DOC_ICONS[doc.document_type] ?? FileText;
          return (
            <div key={doc.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
              <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                <DocIcon className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{doc.title}</p>
                <p className="text-xs text-slate-400">
                  {doc.document_type_display} · {formatDate(doc.uploaded_at)}
                </p>
              </div>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Valid status transitions (matches backend ImportOrder.VALID_TRANSITIONS)
// ---------------------------------------------------------------------------
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:            ["deposit_requested", "confirmed", "cancelled"],
  deposit_requested:  ["deposit_paid", "cancelled"],
  deposit_paid:       ["confirmed", "refunded"],
  confirmed:          ["sourcing", "cancelled"],
  sourcing:           ["purchased", "cancelled"],
  purchased:          ["preparing_shipment"],
  preparing_shipment: ["shipped"],
  shipped:            ["arrived_port"],
  arrived_port:       ["in_customs"],
  in_customs:         ["customs_cleared"],
  customs_cleared:    ["inspection"],
  inspection:         ["ready"],
  ready:              ["delivered"],
  delivered:          ["completed"],
};

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_STEPS.map(s => [s.key, s.label])
);

// ---------------------------------------------------------------------------
// Importer: Status Update Panel
// ---------------------------------------------------------------------------
function StatusUpdatePanel({ order, onUpdated }: { order: Order; onUpdated: () => void }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [newStatus, setNewStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const nextStatuses = VALID_TRANSITIONS[order.status] ?? [];
  if (nextStatuses.length === 0) return null;

  const handleUpdate = async () => {
    if (!newStatus) return;
    setIsUpdating(true);
    try {
      await api.patch(`/api/orders/${order.id}/update-status/`, { status: newStatus });
      showToast("success", t("orderDetail.statusUpdated"));
      setNewStatus("");
      onUpdated();
    } catch {
      showToast("error", t("orderDetail.statusUpdateFailed"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-accent/20 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Package className="w-4 h-4 text-accent" />
        {t("orderDetail.updateStatus")}
      </h2>
      <select
        value={newStatus}
        onChange={e => setNewStatus(e.target.value)}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-accent focus:outline-none mb-3"
      >
        <option value="">{t("orderDetail.selectStatus")}</option>
        {nextStatuses.map(s => (
          <option key={s} value={s}>{STATUS_LABELS[s] ?? s.replace(/_/g, " ")}</option>
        ))}
      </select>
      <button
        onClick={handleUpdate}
        disabled={!newStatus || isUpdating}
        className="w-full py-2.5 bg-accent hover:bg-accent-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("orderDetail.update")}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Importer: Document Upload
// ---------------------------------------------------------------------------
function DocUploadSection({ orderId, onUploaded }: { orderId: string; onUploaded: () => void }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("other");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !title.trim()) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title.trim());
      fd.append("document_type", docType);
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/orders/${orderId}/documents/`,
        { method: "POST", credentials: "include", body: fd }
      );
      showToast("success", t("orderDetail.documentUploaded"));
      setTitle("");
      setDocType("other");
      if (fileRef.current) fileRef.current.value = "";
      onUploaded();
    } catch {
      showToast("error", "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Upload className="w-4 h-4 text-slate-400" />
        {t("orderDetail.uploadDocument")}
      </h2>
      <div className="space-y-3">
        <input
          type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Document title"
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-accent focus:outline-none"
        />
        <select value={docType} onChange={e => setDocType(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-accent focus:outline-none"
        >
          <option value="invoice">Invoice</option>
          <option value="bill_of_lading">Bill of Lading</option>
          <option value="customs_declaration">Customs Declaration</option>
          <option value="inspection_report">Inspection Report</option>
          <option value="conformity_cert">Conformity Certificate</option>
          <option value="delivery_receipt">Delivery Receipt</option>
          <option value="other">Other</option>
        </select>
        <input ref={fileRef} type="file" className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200" />
        <button
          onClick={handleUpload}
          disabled={isUploading || !title.trim()}
          className="w-full py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {isUploading ? t("orderDetail.uploading") : t("orderDetail.upload")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  const { data: order, isLoading, refetch: refetchOrder } = useApiQuery<Order>(
    `/api/orders/${orderId}/`,
    { enabled: !!orderId && isAuthenticated }
  );

  const { data: timeline, isLoading: timelineLoading } = useApiQuery<OrderTimelineEvent[]>(
    `/api/orders/${orderId}/timeline/`,
    { enabled: !!orderId && isAuthenticated }
  );

  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      await api.post(`/api/orders/${orderId}/cancel/`);
      refetchOrder();
      setShowCancelConfirm(false);
      showToast("success", "Order cancellation requested.");
    } catch {
      showToast("error", "Could not cancel order. Please contact support.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Please sign in to view your orders.</p>
          <Link href="/auth/signin" className="px-6 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-600 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 text-center py-20">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h1>
          <p className="text-slate-500 mb-6">This order doesn't exist or you don't have access to it.</p>
          <Link href="/orders" className="px-6 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-600 transition-colors">
            My Orders
          </Link>
        </div>
      </div>
    );
  }

  const isImporter = user?.id === order.importer?.id;

  const listing = order.car;
  const countryFlag = COUNTRY_FLAGS[listing?.source_country?.toLowerCase() ?? ""] ?? "🌍";
  const statusColor = STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600";
  const rawImage = listing?.primary_image;
  const imageUrl = rawImage
    ? (rawImage.startsWith("http") ? rawImage : getImageUrl(rawImage))
    : "/images/car-placeholder.jpg";

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href={isImporter ? "/dashboard/importer/orders" : "/orders"}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {isImporter ? t("orderDetail.importerOrders") : t("orderDetail.backToOrders")}
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-slate-900">{order.order_number}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                  {order.status_display}
                </span>
              </div>
              <p className="text-sm text-slate-400">Placed {formatDate(order.created_at)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{countryFlag}</span>
              <div>
                <div className="font-semibold text-slate-900">
                  {listing.year} {listing.make} {listing.model}
                </div>
                {listing.source_country && (
                  <div className="text-xs text-slate-400 capitalize">
                    Imported from {listing.source_country}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Car thumbnail strip */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
            <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
              <Image src={imageUrl} alt={`${listing.make} ${listing.model}`} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <div className="text-xs text-slate-400">Final Price</div>
                <div className="text-sm font-semibold text-slate-800">{formatSAR(listing.final_price_sar ?? listing.price)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Reservation Fee</div>
                <div className="text-sm font-semibold text-slate-800">{formatSAR(order.reservation_fee)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Payment</div>
                <div className={`text-sm font-semibold capitalize ${
                  order.payment_status === "paid" ? "text-green-600"
                    : order.payment_status === "refunded" ? "text-slate-500"
                    : "text-yellow-600"
                }`}>{order.payment_status}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Est. Delivery</div>
                <div className="text-sm font-semibold text-slate-800">{formatDate(order.estimated_delivery_date)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Shipping map — visible during transit statuses ── */}
        {["purchased", "preparing_shipment", "shipped", "arrived_port",
          "in_customs", "customs_cleared", "inspection", "ready", "delivered"
        ].includes(order.status) && (
          <div className="relative z-[1] mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Ship className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700">Shipping Route</h2>
              {listing.vessel_name && (
                <span className="text-xs text-slate-400">· {listing.vessel_name}</span>
              )}
            </div>
            <OrderTrackingMap
              portOfOrigin={listing.port_of_origin}
              portOfEntry={listing.port_of_entry}
              currentStatus={order.status}
              vesselName={listing.vessel_name}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Timeline + Docs */}
          <div className="lg:col-span-2 space-y-6">
            {timelineLoading ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : (
              <TimelineView
                events={timeline ?? []}
                currentStatus={order.status}
              />
            )}
            <DocumentsSection orderId={orderId} />
          </div>

          {/* Right: Sidebar — role-aware */}
          <div className="space-y-4">

            {/* ── IMPORTER VIEW ── */}
            {isImporter ? (
              <>
                {/* Status Update — importer's main action */}
                <StatusUpdatePanel order={order} onUpdated={refetchOrder} />

                {/* Payment state (importer POV) */}
                <ImporterPaymentCard order={order} />

                {/* Buyer Card */}
                {order.buyer_info && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-5">
                    <h2 className="text-sm font-semibold text-slate-700 mb-4">{t("orderDetail.buyerCard")}</h2>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <Link href={`/user/${order.buyer_info.id}`} className="font-semibold text-slate-900 hover:text-accent hover:underline">{order.buyer_info.name}</Link>
                        {order.buyer_info.city && (
                          <div className="text-sm text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {order.buyer_info.city}
                          </div>
                        )}
                      </div>
                    </div>
                    {order.buyer_notes && (
                      <div className="bg-slate-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">{t("orderDetail.buyerNotes")}</p>
                        <p className="text-sm text-slate-700">{order.buyer_notes}</p>
                      </div>
                    )}
                    <Link
                      href={`/messages?buyer_user=${order.buyer_info.id}${order.car?.id ? `&car_id=${order.car.id}` : ""}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {t("orderDetail.messageBuyer")}
                    </Link>
                  </div>
                )}

                {/* Importer Economics */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                  <h2 className="text-sm font-semibold text-slate-700 mb-4">{t("orderDetail.yourEarnings")}</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Car Price</span>
                      <span className="font-medium text-slate-800">{formatSAR(listing.final_price_sar ?? listing.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-500">
                      <span>{t("orderDetail.platformCommission")}</span>
                      <span className="font-medium">
                        -{formatSAR(Math.round(Number(listing.final_price_sar ?? listing.price ?? 0) * 0.01))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-100">
                      <span className="text-slate-700">Net</span>
                      <span className="text-green-700">
                        {formatSAR(Math.round(Number(listing.final_price_sar ?? listing.price ?? 0) * 0.99))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <DocUploadSection orderId={orderId} onUploaded={refetchOrder} />

                {/* Car Link */}
                <Link href={`/car/${listing.id}`}
                  className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-slate-700">View Car Listing</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </Link>
              </>
            ) : (
              /* ── BUYER VIEW (unchanged) ── */
              <>
                {/* Payment (buyer POV) — bank transfer to WARED */}
                <PaymentSection order={order} onUpdated={refetchOrder} />

                {/* Order Summary Card */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                  <h2 className="text-sm font-semibold text-slate-700 mb-4">Order Summary</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Car Price</span>
                      <span className="font-medium text-slate-800">{formatSAR(listing.final_price_sar ?? listing.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Reservation Fee</span>
                      <span className="font-medium text-slate-800">{formatSAR(order.reservation_fee)}</span>
                    </div>
                    {order.total_price != null && (
                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-100">
                        <span className="text-slate-700">Total</span>
                        <span className="text-slate-900">{formatSAR(order.total_price)}</span>
                      </div>
                    )}
                  </div>

                  {order.estimated_delivery_date && (
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-400">Estimated Delivery</div>
                        <div className="font-medium text-slate-700">{formatDate(order.estimated_delivery_date)}</div>
                      </div>
                    </div>
                  )}
                  {order.actual_delivery_date && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <div>
                        <div className="text-xs">Delivered</div>
                        <div className="font-medium">{formatDate(order.actual_delivery_date)}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Importer Card */}
                {order.importer_info && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-5">
                    <h2 className="text-sm font-semibold text-slate-700 mb-4">Your Importer</h2>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{order.importer_info.business_name ?? order.importer_info.name}</div>
                      </div>
                    </div>
                    <Link
                      href={`/messages?order=${order.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message Importer
                    </Link>
                  </div>
                )}

                {/* Car Link */}
                <Link href={`/car/${listing.id}`}
                  className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-slate-700">View Car Listing</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </Link>

                {/* Cancel */}
                {order.can_cancel && order.status !== "cancelled" && order.status !== "refunded" && (
                  <div>
                    {!showCancelConfirm ? (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="w-full py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100"
                      >
                        Cancel Order
                      </button>
                    ) : (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-700">Cancel this order?</p>
                            <p className="text-xs text-red-500 mt-0.5">Cancellation may be subject to fees depending on order stage.</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setShowCancelConfirm(false)}
                            className="flex-1 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            Keep Order
                          </button>
                          <button onClick={handleCancel} disabled={isCancelling}
                            className="flex-1 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1">
                            {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            Confirm
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {order.notes && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Note from Importer</p>
                    <p className="text-sm text-amber-700">{order.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
