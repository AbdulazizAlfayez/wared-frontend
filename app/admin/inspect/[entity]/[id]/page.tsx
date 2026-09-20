"use client";

export const dynamic = "force-dynamic";

/**
 * The admin inspector.
 *
 * A case file, not a product page: everything the platform knows about one
 * record, the reasons to hesitate at the top, the audit trail underneath, and
 * the decisions in a bar that stays put while the reviewer reads. Admins used
 * to be sent to /car/<id> — the buyer's page, with a Reserve button and none
 * of the record they have to review.
 *
 * Nothing here is fetched twice: the single `GET /api/admin/inspect/...`
 * response carries the record, the relations, the signals and which actions
 * are legal right now, so what the page offers and what the server will
 * accept cannot drift apart.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Flag,
  History,
  Loader2,
  Lock,
  Shield,
  ShieldCheck,
  TriangleAlert,
  User as UserIcon,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api as djangoApi } from "@/lib/api";
import { parseApiError } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import {
  inspectorEndpoint,
  inspectorHref,
  relation,
  relationList,
  type InspectorAction,
  type InspectorAuditEntry,
  type InspectorField,
  type InspectorFraudFlag,
  type InspectorImage,
  type InspectorImporter,
  type InspectorOrder,
  type InspectorPerson,
  type InspectorPriceChange,
  type InspectorRecord,
  type InspectorReport,
  type InspectorReservation,
  type InspectorRisk,
  type InspectorSection,
  type RiskSeverity,
} from "@/lib/inspector";

/* ── Shared look, borrowed from the admin panel ────────────────────────────── */

const PANEL = "bg-white rounded-xl border border-slate-100 overflow-hidden";
const HEADING = "text-xs font-bold text-slate-400 uppercase tracking-wider";

/** The admin panel's own status colours, so the two views agree. */
const statusBadge = (s: string) =>
  ({
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
    changes_requested: "bg-orange-100 text-orange-700",
    draft: "bg-gray-100 text-gray-700",
    sold: "bg-blue-100 text-blue-700",
  }[s] || "bg-slate-100 text-slate-700");

/** Severity reuses the panel's rejected/changes-requested tones. Nothing new. */
const severityTone: Record<RiskSeverity, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-orange-100 text-orange-700",
  low: "bg-slate-100 text-slate-600",
};

const fmtDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : "—";

const fmtDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString() : "—";

/** Long prose gets its own row; a number does not. */
const isLongValue = (field: InspectorField) =>
  field.display.length > 60 || field.key.startsWith("description");

/* ── Small pieces ──────────────────────────────────────────────────────────── */

function Panel({
  title,
  note,
  count,
  children,
}: {
  title: string;
  note?: string | null;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className={PANEL}>
      <div className="px-5 py-4 border-b border-slate-100 flex items-baseline justify-between gap-3">
        <h2 className={HEADING}>{title}</h2>
        {count !== undefined && (
          <span className="text-xs text-slate-400 font-mono">{count}</span>
        )}
      </div>
      {note && (
        <p className="px-5 pt-3 text-xs text-slate-400">{note}</p>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="font-medium text-slate-800 text-end max-w-[60%] break-words">
        {children}
      </span>
    </div>
  );
}

function InternalTag() {
  return (
    <span
      className="ms-1.5 align-middle px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#f3f4f6] text-[#0a0a0a] uppercase tracking-wide"
      title="Not returned by the public API"
    >
      Internal
    </span>
  );
}

function FieldRow({ field }: { field: InspectorField }) {
  return (
    <div
      className={`py-1.5 border-b border-slate-50 last:border-0 ${
        isLongValue(field) ? "" : "flex justify-between gap-3"
      }`}
    >
      <span className="text-sm text-slate-500 shrink-0">
        {field.label}
        {field.internal && <InternalTag />}
      </span>
      <span
        className={`text-sm font-medium text-slate-800 break-words ${
          isLongValue(field) ? "block mt-1 whitespace-pre-wrap" : "text-end max-w-[60%]"
        }`}
        title={field.hint ?? undefined}
      >
        {field.display}
      </span>
    </div>
  );
}

function PersonLink({ person }: { person: InspectorPerson | null }) {
  if (!person) return <span className="text-slate-400">—</span>;
  return (
    <Link
      href={inspectorHref(person.entity || "user", person.id)}
      className="text-[#0a0a0a] hover:underline"
    >
      {person.name || person.email}
    </Link>
  );
}

function RiskList({ signals }: { signals: InspectorRisk[] }) {
  if (signals.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <CheckCircle className="w-4 h-4 text-green-600" />
        Nothing flagged on this record.
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {signals.map((signal) => (
        <li key={signal.code} className="flex gap-3">
          <span
            className={`shrink-0 h-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${severityTone[signal.severity]}`}
          >
            {signal.severity}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{signal.title}</p>
            <p className="text-sm text-slate-500">{signal.detail}</p>
            {signal.code === "duplicate_vin" && (
              <div className="mt-1 flex flex-wrap gap-2">
                {(
                  (signal.evidence?.listings as { id: number; status: string }[]) || []
                ).map((row) => (
                  <Link
                    key={row.id}
                    href={inspectorHref("listing", row.id)}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-[#f3f4f6] text-[#0a0a0a] hover:underline"
                  >
                    #{row.id} · {row.status}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function AuditTrail({ entries }: { entries: InspectorAuditEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">Nothing recorded yet.</p>;
  }
  return (
    <ol className="space-y-4">
      {entries.map((entry) => (
        <li key={entry.id} className="text-sm">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-semibold text-slate-900">{entry.action_display}</span>
            <span className="text-slate-500">
              {entry.actor ? entry.actor.name || entry.actor.email : "system"}
            </span>
            <span className="text-slate-400 text-xs font-mono">
              {fmtDateTime(entry.timestamp)}
            </span>
          </div>
          {entry.changes.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {entry.changes.map((change) => (
                <li key={change.field} className="text-xs text-slate-500 font-mono">
                  {change.field}: {String(change.before ?? "—")} → {String(change.after ?? "—")}
                </li>
              ))}
            </ul>
          )}
          {(entry.ip_address || entry.user_agent) && (
            <p className="mt-1 text-[11px] text-slate-400 font-mono break-all">
              {entry.ip_address ?? "no ip"}
              {entry.user_agent ? ` · ${entry.user_agent.slice(0, 80)}` : ""}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Asks for the words a rejection or a change request cannot be sent without. */
function ReasonModal({
  action,
  onClose,
  onSubmit,
  isSaving,
}: {
  action: InspectorAction;
  onClose: () => void;
  onSubmit: (value: string) => void;
  isSaving: boolean;
}) {
  const [value, setValue] = useState("");
  const required = action.requires[0];
  return (
    <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{action.label}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <label className="block text-sm text-slate-500 mb-2">
          {required?.label ?? "Reason"}
        </label>
        <textarea
          autoFocus
          rows={4}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
          placeholder="The importer reads this."
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            disabled={!value.trim() || isSaving}
            onClick={() => onSubmit(value.trim())}
            className={`px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-40 ${
              action.destructive ? "bg-red-600 hover:bg-red-700" : "bg-accent hover:bg-accent-600"
            }`}
          >
            {isSaving ? "Saving…" : action.label}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-24 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${
        type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="w-5 h-5" />
      ) : (
        <AlertCircle className="w-5 h-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ── The page ──────────────────────────────────────────────────────────────── */

export default function InspectorPage() {
  const { dir } = useTranslation();
  const router = useRouter();
  const params = useParams<{ entity: string; id: string }>();
  const entity = String(params?.entity ?? "");
  const id = String(params?.id ?? "");

  const { role, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = role === "admin";

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pendingAction, setPendingAction] = useState<InspectorAction | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => setToast({ message, type }),
    []
  );

  const { data, error, isLoading, refetch } = useApiQuery<InspectorRecord>(
    inspectorEndpoint(entity, id),
    { enabled: isAdmin && Boolean(entity && id) }
  );

  const runAction = async (action: InspectorAction, body?: Record<string, string>) => {
    setIsSaving(true);
    try {
      await djangoApi.patch(action.endpoint, body ?? {});
      showToast(`${action.label} done`, "success");
      setPendingAction(null);
      refetch();
    } catch (err) {
      showToast(parseApiError(err, ` failed`), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const onAction = (action: InspectorAction) => {
    if (!action.available) return;
    if (action.requires.length > 0) {
      setPendingAction(action);
      return;
    }
    runAction(action);
  };

  /* -- gates, copied from the admin panel so the two behave alike ----------- */
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
        <div className="max-w-lg mx-auto px-4 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Please sign in to access admin panel
          </h1>
          <Link
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold"
          >
            Sign In
          </Link>
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
          <p className="text-slate-500 mb-8">
            This page is only accessible to administrators.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold"
          >
            Go Home
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

  if (error || !data) {
    const message = parseApiError(error, "");
    const notBuiltYet = /No inspector for/i.test(message);
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12" dir={dir}>
        <div className="max-w-lg mx-auto px-4 text-center">
          <FileText className="w-14 h-14 text-slate-300 mx-auto mb-6" />
          <h1 className="text-xl font-bold text-slate-900 mb-3">
            {notBuiltYet
              ? `There is no inspector for "${entity}" yet.`
              : `No ${entity} record to inspect.`}
          </h1>
          <p className="text-slate-500 mb-8 text-sm">
            {notBuiltYet
              ? "Listings are the only entity with an inspector so far."
              : message || "The record may have been deleted."}
          </p>
          <button
            onClick={() => router.push("/admin")}
            className="inline-block px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold"
          >
            Back to admin
          </button>
        </div>
      </div>
    );
  }

  const importer = relation<InspectorImporter>(data, "importer");
  const images = relationList<InspectorImage>(data, "images");
  const reports = relationList<InspectorReport>(data, "reports");
  const reservations = relationList<InspectorReservation>(data, "reservations");
  const orders = relationList<InspectorOrder>(data, "orders");
  const fraudFlags = relationList<InspectorFraudFlag>(data, "fraud_flags");
  const priceHistory = relationList<InspectorPriceChange>(data, "price_history");

  const highCount = data.risk_signals.filter((s) => s.severity === "high").length;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-32" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-accent mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Admin panel
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              {data.headline.image && (
                <Image
                  src={data.headline.image}
                  alt=""
                  width={88}
                  height={66}
                  className="rounded-lg object-cover bg-slate-100 shrink-0"
                  unoptimized
                />
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide bg-[#f3f4f6] text-[#0a0a0a]`}>
                    {data.entity_label}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {data.headline.reference}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 break-words">
                  {data.headline.title}
                </h1>
                {data.headline.subtitle && (
                  <p className="text-slate-500 text-sm">{data.headline.subtitle}</p>
                )}
              </div>
            </div>
            {data.status && (
              <div className="text-end">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(data.status.value)}`}
                >
                  {data.status.display}
                </span>
                {data.status.since && (
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {data.status.since.phrase} in this status
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 justify-end mt-2">
                  {data.status.secondary.map((chip) => (
                    <span
                      key={chip.label}
                      className="px-2 py-0.5 rounded bg-[#f3f4f6] text-[#0a0a0a] text-[11px] font-medium"
                    >
                      {chip.label}: {chip.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: signals, the record, the trail */}
          <div className="lg:col-span-2 space-y-6">
            <div className={PANEL}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <h2 className={`${HEADING} flex items-center gap-2`}>
                  <TriangleAlert className="w-3.5 h-3.5" />
                  Risk signals
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {data.risk_signals.length}
                  {highCount > 0 ? ` · ${highCount} high` : ""}
                </span>
              </div>
              <div className="p-5">
                <RiskList signals={data.risk_signals} />
              </div>
            </div>

            <Panel title="Provenance">
              <div className="grid sm:grid-cols-2 gap-x-8">
                <Row label="Created">{fmtDateTime(data.provenance.created_at)}</Row>
                <Row label="Created by">
                  <PersonLink person={data.provenance.created_by} />
                </Row>
                <Row label="Submitted">{fmtDateTime(data.provenance.submitted_at)}</Row>
                <Row label="Approved">{fmtDateTime(data.provenance.approved_at)}</Row>
                <Row label="Approved by">
                  <PersonLink person={data.provenance.approved_by} />
                </Row>
                <Row label="Status changed">
                  {fmtDateTime(data.provenance.status_changed_at)}
                </Row>
                <Row label="Changed by">
                  <PersonLink person={data.provenance.status_changed_by} />
                </Row>
                <Row label="Time in status">
                  {data.provenance.time_in_status?.phrase ?? "—"}
                </Row>
              </div>
            </Panel>

            {data.record.map((section: InspectorSection) => (
              <Panel
                key={section.key}
                title={section.title}
                note={section.note}
                count={section.fields.length}
              >
                <div className="grid sm:grid-cols-2 gap-x-8">
                  {section.fields.map((field) => (
                    <div
                      key={field.key}
                      className={isLongValue(field) ? "sm:col-span-2" : ""}
                    >
                      <FieldRow field={field} />
                    </div>
                  ))}
                </div>
              </Panel>
            ))}

            <div className={PANEL}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <h2 className={`${HEADING} flex items-center gap-2`}>
                  <History className="w-3.5 h-3.5" />
                  Audit trail
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {data.audit_trail.length}
                </span>
              </div>
              <div className="p-5">
                <AuditTrail entries={data.audit_trail} />
              </div>
            </div>
          </div>

          {/* Right: who stands behind it, and what is attached */}
          <div className="space-y-6">
            {importer && (
              <div className={PANEL}>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                  <h2 className={`${HEADING} flex items-center gap-2`}>
                    <UserIcon className="w-3.5 h-3.5" />
                    Importer
                  </h2>
                  <Link
                    href={inspectorHref("user", importer.id)}
                    className="text-xs text-slate-400 hover:text-accent hover:underline"
                  >
                    Inspect
                  </Link>
                </div>
                <div className="p-5">
                  <p className="font-semibold text-slate-900">
                    {importer.profile?.business_name || importer.name}
                  </p>
                  <p className="text-sm text-slate-500 mb-3 break-all">{importer.email}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {importer.is_business_verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        Business verified
                      </span>
                    )}
                    {importer.is_suspended && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-medium">
                        Suspended
                      </span>
                    )}
                    {importer.is_banned && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-medium">
                        Banned
                      </span>
                    )}
                  </div>

                  <Row label="Phone">{importer.phone || "—"}</Row>
                  <Row label="Joined">
                    {fmtDate(importer.joined)}
                    {importer.account_age ? ` · ${importer.account_age.phrase}` : ""}
                  </Row>
                  <Row label="Verification">{importer.verification_level}</Row>
                  <Row label="Warnings">{importer.warning_count}</Row>
                  <Row label="Listings">
                    {importer.listing_total}
                    {Object.keys(importer.listing_counts).length > 0 && (
                      <span className="block text-xs text-slate-400 font-normal font-mono">
                        {Object.entries(importer.listing_counts)
                          .map(([status, count]) => `${status} ${count}`)
                          .join(" · ")}
                      </span>
                    )}
                  </Row>
                  <Row label="Orders">{importer.order_count}</Row>
                  <Row label="Complaints">
                    {importer.complaint_count}
                    {importer.open_complaint_count > 0
                      ? ` (${importer.open_complaint_count} open)`
                      : ""}
                  </Row>

                  {importer.profile ? (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className={`${HEADING} mb-2`}>Commercial registration</p>
                      <Row label="CR number">
                        {importer.profile.commercial_registration || "—"}
                      </Row>
                      <Row label="CR status">
                        {importer.profile.cr_verification_status_display}
                      </Row>
                      <Row label="Issued">{fmtDate(importer.profile.cr_issue_date)}</Row>
                      <Row label="Expires">{fmtDate(importer.profile.cr_expiry_date)}</Row>
                      <Row label="Last confirmed">
                        {fmtDate(importer.profile.cr_last_confirmed_date)}
                      </Row>
                      <Row label="Broker licence">
                        {importer.profile.customs_broker_license || "—"}
                      </Row>
                      <Row label="Import licence">
                        {importer.profile.import_license_number || "—"}
                      </Row>
                      <Row label="Cars imported">
                        {importer.profile.total_cars_imported}
                      </Row>
                      <Row label="Rating">
                        {importer.profile.average_rating} ({importer.profile.total_reviews})
                      </Row>
                    </div>
                  ) : (
                    <p className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
                      No importer profile — no commercial registration has ever been
                      checked.
                    </p>
                  )}
                </div>
              </div>
            )}

            {images.length > 0 && (
              <Panel title="Images" count={images.length}>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((image) =>
                    image.url ? (
                      <a
                        key={image.id}
                        href={image.url}
                        target="_blank"
                        rel="noreferrer"
                        className="relative block aspect-[4/3] rounded-lg overflow-hidden bg-slate-100"
                      >
                        <Image
                          src={image.url}
                          alt=""
                          fill
                          sizes="120px"
                          className="object-cover"
                          unoptimized
                        />
                        {image.is_primary && (
                          <span className="absolute bottom-1 start-1 px-1.5 py-0.5 rounded bg-[#0a0a0a] text-white text-[10px] font-semibold">
                            Primary
                          </span>
                        )}
                      </a>
                    ) : null
                  )}
                </div>
              </Panel>
            )}

            {priceHistory.length > 0 && (
              <Panel title="Price history" count={priceHistory.length}>
                <ul className="space-y-2">
                  {priceHistory.map((change, index) => (
                    <li key={`${change.timestamp}-${index}`} className="text-sm">
                      <span className="font-mono text-slate-800">
                        {String(change.before ?? "—")} → {String(change.after ?? "—")}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {change.field} · {change.actor?.name ?? "system"} ·{" "}
                        {fmtDateTime(change.timestamp)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {fraudFlags.length > 0 && (
              <Panel title="Fraud flags" count={fraudFlags.length}>
                <ul className="space-y-3">
                  {fraudFlags.map((flag) => (
                    <li key={flag.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Flag className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-900">
                          {flag.flag_type_display}
                        </span>
                        <span className="text-xs text-slate-400">{flag.severity}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {flag.is_resolved
                          ? `Resolved by ${flag.resolved_by?.name ?? "—"}`
                          : "Unresolved"}{" "}
                        · {fmtDate(flag.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {reports.length > 0 && (
              <Panel title="Reports" count={reports.length}>
                <ul className="space-y-3">
                  {reports.map((report) => (
                    <li key={report.id} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">
                          {report.reason}
                        </span>
                        <span className="text-xs text-slate-400">
                          {report.status_display}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-3">
                        {report.description}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {report.reporter?.name ?? "—"} · {fmtDate(report.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {reservations.length > 0 && (
              <Panel title="Reservations" count={reservations.length}>
                <ul className="space-y-3">
                  {reservations.map((reservation) => (
                    <li key={reservation.id} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-800">
                          {reservation.reservation_number}
                        </span>
                        <span className="text-xs text-slate-400">
                          {reservation.status_display}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {reservation.buyer?.name ?? "—"} · SAR{" "}
                        {reservation.platform_fee_sar} · {reservation.payment_status}
                      </p>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {orders.length > 0 && (
              <Panel title="Orders" count={orders.length}>
                <ul className="space-y-3">
                  {orders.map((order) => (
                    <li key={order.id} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-800">
                          {order.order_number}
                        </span>
                        <span className="text-xs text-slate-400">
                          {order.status_display}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {order.buyer?.name ?? "—"} · SAR {order.total_price ?? "—"} ·{" "}
                        {order.deposit_paid ? "deposit paid" : "no deposit"}
                      </p>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        </div>
      </div>

      {/* Decisions, where they stay reachable while reading */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400 font-mono me-auto">
            {data.entity_label} {data.headline.reference}
          </span>
          {data.actions.map((action) => {
            const blocked = !action.available;
            const tone = action.destructive
              ? "border border-red-200 text-red-600 hover:bg-red-50"
              : action.key === "approve"
                ? "bg-accent hover:bg-accent-600 text-white"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50";
            return (
              <button
                key={action.key}
                onClick={() => onAction(action)}
                disabled={blocked || isSaving}
                title={action.reason ?? undefined}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${tone}`}
              >
                {blocked && <Lock className="w-3.5 h-3.5" />}
                {action.label}
              </button>
            );
          })}
        </div>
        {data.actions.some((action) => !action.available) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 -mt-1">
            {data.actions
              .filter((action) => !action.available && action.reason)
              .map((action) => (
                <p
                  key={action.key}
                  className="text-[11px] text-slate-400 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {action.label}: {action.reason}
                </p>
              ))}
          </div>
        )}
      </div>

      {pendingAction && (
        <ReasonModal
          action={pendingAction}
          isSaving={isSaving}
          onClose={() => setPendingAction(null)}
          onSubmit={(value) =>
            runAction(pendingAction, {
              [pendingAction.requires[0].field]: value,
            })
          }
        />
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
