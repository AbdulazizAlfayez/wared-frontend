"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { ImportedListing, PublicOwnerProfile } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, type ElementType } from "react";
import {
  Heart,
  Flag,
  Loader2,
  ArrowLeft,
  Calendar,
  Fuel,
  Gauge,
  MapPin,
  Car,
  Palette,
  User,
  CheckCircle,
  XCircle,
  Share2,
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MessageSquare,
  Eye,
  Clock,
  ExternalLink,
  Shield,
  Globe,
  Zap,
  Settings2,
  Hash,
  Navigation2,
  AlertCircle,
  Settings,
  Users,
  Package,
  Anchor,
  FileText,
  DollarSign,
  TrendingUp,
  BadgeCheck,
  ShipIcon,
  Truck,
  Landmark,
  Tag,
  Receipt,
  FileCheck2,
  ChevronDown,
  Info,
} from "lucide-react";
import VerificationBadge from "@/components/VerificationBadge";
import ReportModal from "@/components/ReportModal";
import ReviewsSection from "@/components/ReviewsSection";
import { useToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n";
import { getImageUrl } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

const maskVin = (vin: string) =>
  vin.length > 4 ? "···" + vin.slice(-4) : vin;

const daysAgo = (dateStr: string) => {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatSAR = (n: number | null | undefined) => {
  if (n == null) return "—";
  const num = typeof (n as unknown) === "string" ? parseFloat(n as unknown as string) : n;
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(num);
};

const COUNTRY_FLAGS: Record<string, string> = {
  usa: "🇺🇸", us: "🇺🇸",
  japan: "🇯🇵", jp: "🇯🇵",
  uae: "🇦🇪", ae: "🇦🇪",
  korea: "🇰🇷", kr: "🇰🇷",
  germany: "🇩🇪", de: "🇩🇪",
  uk: "🇬🇧", gb: "🇬🇧",
  canada: "🇨🇦", ca: "🇨🇦",
  europe: "🇪🇺", eu: "🇪🇺",
  china: "🇨🇳", cn: "🇨🇳",
  australia: "🇦🇺", au: "🇦🇺",
};

const COUNTRY_NAMES: Record<string, string> = {
  usa: "United States", us: "United States",
  japan: "Japan", jp: "Japan",
  uae: "UAE", ae: "UAE",
  korea: "South Korea", kr: "South Korea",
  germany: "Germany", de: "Germany",
  uk: "United Kingdom", gb: "United Kingdom",
  canada: "Canada", ca: "Canada",
  europe: "Europe", eu: "Europe",
  china: "China", cn: "China",
  australia: "Australia", au: "Australia",
};

const CURRENCY_LABELS: Record<string, string> = {
  usd: "USD", jpy: "JPY", aed: "AED", krw: "KRW",
  eur: "EUR", cad: "CAD", gbp: "GBP", qar: "QAR",
};

const STATUS_STEPS = [
  { key: "sourcing",          label: "Sourcing" },
  { key: "available",         label: "Available" },
  { key: "in_transit",        label: "In Transit" },
  { key: "at_port",           label: "At Port" },
  { key: "customs_clearance", label: "Customs" },
  { key: "delivered",         label: "Delivered" },
] as const;

const STATUS_ORDER: Record<string, number> = {
  sourcing: 0, available: 1, arriving: 1,
  in_transit: 2, at_port: 3, customs_clearance: 4,
  delivered: 5, reserved: 1, sold: 5,
};

// ---------------------------------------------------------------------------
// Status display config + badge
// ---------------------------------------------------------------------------
const STATUS_DISPLAY: Record<string, { labelKey: string; bg: string; text: string; border: string; dot: string; pulse: boolean }> = {
  available:         { labelKey: "available",              bg: "bg-teal-50",       text: "text-teal-700",       border: "border-teal-200",       dot: "bg-teal-500",       pulse: false },
  reserved:          { labelKey: "reserved",               bg: "bg-amber-50",      text: "text-amber-800",      border: "border-amber-200",      dot: "bg-amber-500",      pulse: false },
  sourcing:          { labelKey: "importerSourcing",       bg: "bg-blue-50",       text: "text-blue-700",       border: "border-blue-200",       dot: "bg-blue-500",       pulse: true },
  purchased:         { labelKey: "purchasedPreparing",     bg: "bg-blue-50",       text: "text-blue-700",       border: "border-blue-200",       dot: "bg-blue-500",       pulse: true },
  preparing_shipment:{ labelKey: "preparingShipment",      bg: "bg-blue-50",       text: "text-blue-700",       border: "border-blue-200",       dot: "bg-blue-500",       pulse: true },
  shipped:           { labelKey: "in_transit",             bg: "bg-blue-50",       text: "text-blue-700",       border: "border-blue-200",       dot: "bg-blue-500",       pulse: true },
  in_transit:        { labelKey: "in_transit",             bg: "bg-blue-50",       text: "text-blue-700",       border: "border-blue-200",       dot: "bg-blue-500",       pulse: true },
  arrived_port:      { labelKey: "arrivedAtPort",          bg: "bg-violet-50",     text: "text-violet-700",     border: "border-violet-200",     dot: "bg-violet-500",     pulse: true },
  at_port:           { labelKey: "at_port",                bg: "bg-violet-50",     text: "text-violet-700",     border: "border-violet-200",     dot: "bg-violet-500",     pulse: true },
  in_customs:        { labelKey: "inCustoms",              bg: "bg-amber-50",      text: "text-amber-700",      border: "border-amber-200",      dot: "bg-amber-500",      pulse: true },
  customs_clearance: { labelKey: "customs_clearance",      bg: "bg-amber-50",      text: "text-amber-700",      border: "border-amber-200",      dot: "bg-amber-500",      pulse: true },
  customs_cleared:   { labelKey: "customsCleared",         bg: "bg-teal-50",       text: "text-teal-700",       border: "border-teal-200",       dot: "bg-teal-500",       pulse: false },
  inspection:        { labelKey: "inspection",             bg: "bg-blue-50",       text: "text-blue-700",       border: "border-blue-200",       dot: "bg-blue-500",       pulse: true },
  ready:             { labelKey: "ready",                  bg: "bg-teal-50",       text: "text-teal-700",       border: "border-teal-200",       dot: "bg-teal-500",       pulse: false },
  delivered:         { labelKey: "delivered",              bg: "bg-[#0B1424]/5",   text: "text-[#0B1424]/60",   border: "border-[#0B1424]/10",   dot: "bg-[#0B1424]/40",   pulse: false },
  completed:         { labelKey: "completed",              bg: "bg-[#0B1424]/5",   text: "text-[#0B1424]/60",   border: "border-[#0B1424]/10",   dot: "bg-[#0B1424]/40",   pulse: false },
  sold:              { labelKey: "sold",                   bg: "bg-[#0B1424]/5",   text: "text-[#0B1424]/60",   border: "border-[#0B1424]/10",   dot: "bg-[#0B1424]/40",   pulse: false },
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config = STATUS_DISPLAY[status] ?? STATUS_DISPLAY.available;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12.5px] font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.pulse ? "animate-pulse" : ""}`} />
      {t(`importStatus.${config.labelKey}`)}
    </span>
  );
}

const NON_AVAILABLE_PIPELINE = new Set([
  "purchased", "preparing_shipment", "shipped", "in_transit",
  "arrived_port", "at_port", "in_customs", "customs_clearance",
  "customs_cleared", "inspection", "ready", "ready_for_delivery",
]);

const SOLD_STATUSES = new Set(["delivered", "completed", "sold"]);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SpecRow({
  icon: Icon,
  label,
  value,
  dir,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  dir: string;
}) {
  return (
    <div className={`flex items-center gap-3 py-2.5 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className={`min-w-0 flex-1 ${dir === "rtl" ? "text-right" : ""}`}>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-sm font-semibold text-slate-800 truncate">{value}</div>
      </div>
    </div>
  );
}

function OwnerStatusControl({ listingId, currentStatus }: { listingId: string; currentStatus: string | null }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [newStatus, setNewStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!newStatus) return;
    setIsUpdating(true);
    try {
      await api.patch(`/api/listings/${listingId}/`, { import_status: newStatus });
      showToast("success", t("carDetail.statusUpdated"));
      setNewStatus("");
      window.location.reload();
    } catch {
      showToast("error", t("carDetail.statusUpdateFailed"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-accent/20 p-4 mt-3">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
        {t("carDetail.updateImportStatus")}
      </label>
      <div className="flex gap-2">
        <select
          value={newStatus}
          onChange={e => setNewStatus(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-accent focus:outline-none"
        >
          <option value="">{currentStatus?.replace(/_/g, " ") ?? "—"}</option>
          {STATUS_STEPS.filter(s => s.key !== currentStatus).map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={handleUpdate}
          disabled={!newStatus || isUpdating}
          className="px-4 py-2 bg-accent hover:bg-accent-600 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {isUpdating ? "..." : t("orderDetail.update")}
        </button>
      </div>
    </div>
  );
}

function ImportStatusStepper({ status }: { status: string | null }) {
  const currentStep = STATUS_ORDER[status ?? ""] ?? 0;
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-slate-500" />
        <h2 className="text-base font-semibold text-slate-900">Import Status</h2>
        {status && (
          <span className="ml-auto px-2.5 py-0.5 bg-accent/10 text-accent text-xs font-semibold rounded-full capitalize">
            {status.replace(/_/g, " ")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentStep;
          const active = i === currentStep;
          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    done
                      ? active
                        ? "bg-accent text-white ring-4 ring-accent/20"
                        : "bg-accent text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done && !active ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span
                  className={`text-[9px] mt-1 font-medium text-center leading-tight max-w-[50px] ${
                    active ? "text-accent" : done ? "text-slate-500" : "text-slate-300"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 mb-4 rounded-full ${
                    i < currentStep ? "bg-accent" : "bg-slate-100"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cost Breakdown helpers
// ---------------------------------------------------------------------------

const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: "$", eur: "€", gbp: "£", jpy: "¥", aed: "AED",
  krw: "₩", cad: "CA$", aud: "A$", sar: "SAR",
};

function fmtSource(amount: number, currency: string) {
  const sym = CURRENCY_SYMBOLS[currency.toLowerCase()] ?? currency.toUpperCase();
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
  return `${sym} ${formatted}`;
}

interface CostLineProps {
  icon: ElementType;
  label: string;
  value: string;
  sub?: string;
  dim?: boolean;
  iconColor?: string;
}
function CostLine({ icon: Icon, label, value, sub, dim, iconColor = "text-slate-400" }: CostLineProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${dim ? "opacity-60" : ""}`}>
      <span className={`flex items-center gap-2 text-sm ${dim ? "text-slate-400" : "text-slate-600"} min-w-0`}>
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${iconColor}`} />
        <span className="leading-snug">{label}</span>
      </span>
      <span className="text-right flex-shrink-0">
        <span className={`text-sm font-medium ${dim ? "text-slate-400" : "text-slate-800"}`} dir="ltr">{value}</span>
        {sub && <span className="block text-[10px] text-slate-400 leading-tight">{sub}</span>}
      </span>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-0.5">
      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function CostDivider() {
  return <div className="h-px bg-slate-100 my-1" />;
}

function CostBreakdownCard({ listing }: { listing: ImportedListing }) {
  const [expanded, setExpanded] = useState(true);

  const cur = (listing.source_currency ?? "usd").toLowerCase();
  const curLabel = cur.toUpperCase();

  // Resolve correct field names (backend uses customs_duty_amount)
  const customsDuty = listing.customs_duty_amount ?? (listing as any).customs_duty ?? null;

  const hasAnyBreakdown =
    listing.source_price != null ||
    listing.shipping_cost != null ||
    customsDuty != null ||
    listing.vat_amount != null ||
    listing.total_landed_cost != null ||
    listing.final_price_sar != null;

  if (!hasAnyBreakdown) return null;

  // Computed importer margin
  const margin =
    listing.final_price_sar != null && listing.total_landed_cost != null
      ? Number(listing.final_price_sar) - Number(listing.total_landed_cost)
      : null;

  // Section visibility flags
  const hasShipping =
    listing.shipping_cost != null ||
    listing.transportation_cost != null ||
    (listing as any).port_fees != null;

  const hasGovFees =
    customsDuty != null ||
    listing.vat_amount != null ||
    listing.inspection_fee != null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-card">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/70 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-4 h-4 text-accent" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-semibold text-slate-900 leading-tight">Cost Breakdown</h2>
            <p className="text-[11px] text-slate-400 leading-tight">Full import cost transparency</p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-50 space-y-3">

          {/* ── 1. SOURCE PRICE ── */}
          {listing.source_price != null && (
            <>
              <SectionHeader label="Source Price" />
              <CostLine
                icon={Tag}
                label={`Original price (${curLabel})`}
                value={fmtSource(Number(listing.source_price), cur)}
                iconColor="text-gold-500"
              />
            </>
          )}

          {/* ── 2. SHIPPING & LOGISTICS ── */}
          {hasShipping && (
            <>
              <SectionHeader label="Shipping & Logistics" />
              {listing.shipping_cost != null && (
                <CostLine
                  icon={ShipIcon}
                  label="International shipping"
                  value={formatSAR(listing.shipping_cost)}
                  iconColor="text-slate-500"
                />
              )}
              {(listing as any).port_fees != null && (
                <CostLine
                  icon={Anchor}
                  label="Port handling fee"
                  value={formatSAR((listing as any).port_fees)}
                  iconColor="text-slate-500"
                />
              )}
              {listing.transportation_cost != null && (
                <CostLine
                  icon={Truck}
                  label="Port → destination"
                  value={formatSAR(listing.transportation_cost)}
                  iconColor="text-slate-500"
                />
              )}
            </>
          )}

          {/* ── 3. GOVERNMENT FEES ── */}
          {hasGovFees && (
            <>
              <SectionHeader label="Government Fees" />
              {customsDuty != null && (
                <CostLine
                  icon={Landmark}
                  label="Customs duty (5%)"
                  value={formatSAR(customsDuty)}
                  iconColor="text-orange-500"
                />
              )}
              {listing.vat_amount != null && (
                <CostLine
                  icon={Receipt}
                  label="VAT (15%)"
                  value={formatSAR(listing.vat_amount)}
                  iconColor="text-orange-500"
                />
              )}
              {listing.inspection_fee != null && (
                <CostLine
                  icon={FileCheck2}
                  label="SASO inspection fee"
                  value={formatSAR(listing.inspection_fee)}
                  iconColor="text-slate-500"
                />
              )}
            </>
          )}

          {/* ── Divider + Total Landed ── */}
          {listing.total_landed_cost != null && (
            <>
              <CostDivider />
              <div className="flex items-center justify-between py-0.5">
                <span className="text-sm font-bold text-slate-700">Total Landed Cost</span>
                <span className="text-sm font-bold text-slate-900" dir="ltr">
                  {formatSAR(listing.total_landed_cost)}
                </span>
              </div>
            </>
          )}

          {/* ── Importer margin ── */}
          {margin != null && margin > 0 && (
            <CostLine
              icon={TrendingUp}
              label="Importer margin"
              value={formatSAR(margin)}
              dim
            />
          )}

          {/* ── Divider + Final price ── */}
          {listing.final_price_sar != null && (
            <>
              <CostDivider />
              <div className="flex items-center justify-between pt-0.5">
                <div>
                  <span className="text-sm font-bold text-slate-900">Final Price</span>
                  <span className="block text-[11px] text-slate-400 leading-tight">What you pay</span>
                </div>
                <span
                  className="text-xl font-black text-accent leading-none price-display"
                  dir="ltr"
                >
                  {formatSAR(listing.final_price_sar)}
                </span>
              </div>
            </>
          )}

          {/* ── Footer ── */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-50">
            <Info className="w-3 h-3 text-emerald-500 flex-shrink-0" />
            <p className="text-[11px] text-slate-400 leading-snug">
              Full transparency — every cost is shown. No hidden fees.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SourceInfoCard({ listing }: { listing: ImportedListing }) {
  const { t } = useTranslation();
  const country = listing.source_country?.toLowerCase() ?? "";
  const flag = COUNTRY_FLAGS[country] ?? "🌍";
  const countryName = listing.source_country_display ?? COUNTRY_NAMES[country] ?? capitalize(listing.source_country ?? "");

  const hasInfo =
    listing.source_country ||
    listing.auction_source ||
    listing.spec_origin ||
    listing.port_of_origin ||
    listing.port_of_entry ||
    listing.auction_grade;

  if (!hasInfo) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
        <Globe className="w-5 h-5 text-slate-500" />
        <h2 className="text-base font-semibold text-slate-900">Import Source</h2>
      </div>
      <div className="px-5 py-4 space-y-3">
        {listing.source_country && (
          <div className="flex items-center gap-3">
            <span className="text-2xl">{flag}</span>
            <div>
              <div className="text-xs text-slate-400">Source Country</div>
              <div className="font-semibold text-slate-800">{countryName}</div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {listing.auction_source && (
            <div>
              <div className="text-xs text-slate-400">Auction</div>
              <div className="text-sm font-medium text-slate-700">{listing.auction_source}</div>
            </div>
          )}
          {listing.auction_grade && (
            <div>
              <div className="text-xs text-slate-400">Auction Grade</div>
              <div className="text-sm font-medium text-slate-700">{listing.auction_grade}</div>
            </div>
          )}
          {listing.spec_origin && (
            <div>
              <div className="text-xs text-slate-400">Spec Origin</div>
              <div className="text-sm font-medium text-slate-700 capitalize">{listing.spec_origin}</div>
            </div>
          )}
          {listing.port_of_origin && (
            <div>
              <div className="text-xs text-slate-400">Port of Origin</div>
              <div className="text-sm font-medium text-slate-700">{listing.port_of_origin}</div>
            </div>
          )}
          {listing.port_of_entry && (
            <div>
              <div className="text-xs text-slate-400">{t("carDetail.portOfEntry")}</div>
              <div className="text-sm font-medium text-slate-700">{t(`ports.${listing.port_of_entry}`)}</div>
            </div>
          )}
          {listing.shipping_company && (
            <div>
              <div className="text-xs text-slate-400">Shipping Co.</div>
              <div className="text-sm font-medium text-slate-700">{listing.shipping_company}</div>
            </div>
          )}
        </div>
        {listing.estimated_arrival_date && !listing.actual_arrival_date && (
          <div className="flex items-center gap-2 pt-1 text-sm text-accent font-medium">
            <Calendar className="w-4 h-4" />
            ETA: {formatDate(listing.estimated_arrival_date)}
          </div>
        )}
        {listing.actual_arrival_date && (
          <div className="flex items-center gap-2 pt-1 text-sm text-green-600 font-medium">
            <CheckCircle className="w-4 h-4" />
            Arrived: {formatDate(listing.actual_arrival_date)}
          </div>
        )}
      </div>
    </div>
  );
}

function ImportVehicleHistory({ listing }: { listing: ImportedListing }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
        <Shield className="w-5 h-5 text-slate-500" />
        <h2 className="text-base font-semibold text-slate-900">Vehicle History</h2>
      </div>
      <div className="px-5 py-3 space-y-2.5">
        {/* Salvage title */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Salvage Title</span>
          {listing.has_salvage_title ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />
              Yes — Has Salvage
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              Clean Title
            </span>
          )}
        </div>
        {/* Odometer rollback */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Odometer Rollback</span>
          {listing.odometer_rollback ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />
              Flagged
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              None Detected
            </span>
          )}
        </div>
        {/* Accident history */}
        {listing.accident_history !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Accident History</span>
            {listing.accident_history ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                <XCircle className="w-3.5 h-3.5" />
                Reported
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                No Accidents
              </span>
            )}
          </div>
        )}
        {/* Inspection result */}
        {listing.inspection_result && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Inspection</span>
            <span className="text-sm font-medium text-slate-700 capitalize">{listing.inspection_result}</span>
          </div>
        )}
        {/* Previous owners */}
        {listing.previous_owners != null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Previous Owners</span>
            <span className="text-sm font-medium text-slate-700">{listing.previous_owners}</span>
          </div>
        )}
        {/* Customs cleared */}
        {listing.customs_cleared !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Customs Cleared</span>
            {listing.customs_cleared ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                Yes
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                Pending
              </span>
            )}
          </div>
        )}
        {/* Warranty */}
        {listing.warranty_remaining !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Warranty Remaining</span>
            {listing.warranty_remaining ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                <Shield className="w-3.5 h-3.5" />
                Yes
              </span>
            ) : (
              <span className="text-sm text-slate-500">None</span>
            )}
          </div>
        )}
        {/* Service history */}
        {listing.service_history !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Service History</span>
            {listing.service_history ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <FileText className="w-3.5 h-3.5" />
                Available
              </span>
            ) : (
              <span className="text-sm text-slate-500">Not Available</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CarDetailPage() {
  const { t, dir } = useTranslation();
  const params = useParams();
  const listingId = params.id as string;
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const isArabic = dir === "rtl";

  const { data: listing, isLoading } = useApiQuery<ImportedListing>(
    `/api/listings/${listingId}/`,
    { enabled: !!listingId }
  );

  const ownerId = listing?.owner_id ?? listing?.owner?.id;
  const isOwner = isAuthenticated && user?.id === ownerId;
  const { data: ownerProfile } = useApiQuery<PublicOwnerProfile>(
    `/api/users/${ownerId}/profile/`,
    { enabled: !!ownerId }
  );

  const [isFav, setIsFav] = useState(false);
  const [favoriteId, setFavoriteId] = useState<number | undefined>();
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [showReport, setShowReport] = useState(false);

  const [isReserving, setIsReserving] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState(false);
  const [reserveError, setReserveError] = useState("");

  const images =
    listing?.images
      ?.slice()
      .sort((a, b) => a.order - b.order)
      .map((img) => img.image_url || getImageUrl(img.image)) ?? [];
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    if (!isAuthenticated || !listing) return;
    api
      .get<{ results: { id: number; listing: { id: number } }[] }>(
        `/api/favorites/?listing=${listing.id}`
      )
      .then((res) => {
        const match = res.results?.[0];
        if (match) {
          setIsFav(true);
          setFavoriteId(match.id);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, listing]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showFullscreen) return;
      if (e.key === "Escape") setShowFullscreen(false);
      else if (e.key === "ArrowLeft") navigateImage(isArabic ? 1 : -1);
      else if (e.key === "ArrowRight") navigateImage(isArabic ? -1 : 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFullscreen, selectedImage, images.length, isArabic]);

  const navigateImage = useCallback(
    (delta: number) => {
      setSelectedImage((prev) => {
        const next = prev + delta;
        if (next < 0) return images.length - 1;
        if (next >= images.length) return 0;
        return next;
      });
    },
    [images.length]
  );

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || isTogglingFav || !listing) return;
    setIsTogglingFav(true);
    try {
      if (isFav && favoriteId !== undefined) {
        await api.delete(`/api/favorites/${favoriteId}/`);
        setIsFav(false);
        setFavoriteId(undefined);
      } else {
        const result = await api.post<{ id: number }>("/api/favorites/", {
          listing: listing.id,
        });
        setIsFav(true);
        setFavoriteId(result.id);
      }
    } catch {
      // ignore
    } finally {
      setIsTogglingFav(false);
    }
  };

  const handleReserve = async () => {
    if (!isAuthenticated || !listing) return;
    setIsReserving(true);
    setReserveError("");
    try {
      const result = await api.post<{ id: number; reservation_number: string }>("/api/reservations/", {
        car_id: listing.id,
      });
      window.location.href = `/checkout/${result.id}`;
    } catch (err: any) {
      let message = "Failed to reserve. Please try again.";
      try {
        const body = typeof err?.message === "string" ? JSON.parse(err.message) : err;
        if (body.car_id) message = Array.isArray(body.car_id) ? body.car_id[0] : body.car_id;
        else if (body.non_field_errors) message = Array.isArray(body.non_field_errors) ? body.non_field_errors[0] : body.non_field_errors;
        else if (body.detail) message = body.detail;
        else if (body.error) message = body.error;
        else {
          const first = Object.values(body)[0];
          if (Array.isArray(first)) message = first[0];
          else if (typeof first === "string") message = first;
        }
      } catch { /* use default */ }
      setReserveError(message);
    } finally {
      setIsReserving(false);
    }
  };

  const handleShare = async (platform: string) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = listing
      ? `${listing.year} ${listing.make} ${listing.model}`
      : "Imported Car";
    const text = listing
      ? `Check out this ${listing.year} ${listing.make} ${listing.model} imported from ${COUNTRY_NAMES[listing.source_country?.toLowerCase() ?? ""] ?? listing.source_country ?? "abroad"}!`
      : "";
    switch (platform) {
      case "copy":
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = url;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
        setShowShareMenu(false);
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
        setShowShareMenu(false);
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        setShowShareMenu(false);
        break;
    }
  };

  const displayMake  = isArabic && listing?.make_ar  ? listing.make_ar  : listing?.make ?? "";
  const displayModel = isArabic && listing?.model_ar ? listing.model_ar : listing?.model ?? "";

  // ---------------------------------------------------------------------------
  // Loading / Not found
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <Car className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Car Not Found</h1>
            <p className="text-slate-500 mb-8">This listing may have been removed or is no longer available.</p>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Browse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const displayDesc  = isArabic && listing.description_ar
    ? listing.description_ar
    : listing.description_display ?? listing.description;
  const displayCity  = isArabic && listing.city_ar ? listing.city_ar : listing.city_display ?? listing.city;
  const displayColor = isArabic && listing.color_ar ? listing.color_ar : listing.color_display ?? listing.color;
  const viewCount = listing.view_count ?? listing.views_count ?? listing.unique_view_count ?? 0;

  const sourceCountry = listing.source_country?.toLowerCase() ?? "";
  const countryFlag = COUNTRY_FLAGS[sourceCountry] ?? "🌍";
  const countryName = listing.source_country_display ?? COUNTRY_NAMES[sourceCountry] ?? capitalize(listing.source_country ?? "");

  const displayPrice = listing.final_price_sar ?? listing.price;

  const hasFullSpecs = !!(
    listing.body_type || listing.drive_type || listing.engine_size ||
    listing.horsepower || listing.cylinders || listing.seats ||
    listing.doors || listing.color_interior || listing.vin
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("carDetail.backToBrowse")}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ---------------------------------------------------------------- */}
          {/* LEFT: Image Gallery                                               */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-4">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 group">
              <Image
                src={images[selectedImage] || "/images/car-placeholder.jpg"}
                alt={`${listing.year} ${displayMake} ${displayModel}`}
                fill
                className="object-cover cursor-pointer"
                onClick={() => setShowFullscreen(true)}
              />
              {/* Import status badge */}
              <div className="absolute top-4 left-4">
                <StatusBadge status={(listing as any).is_reserved ? "reserved" : (listing.import_status ?? "available")} />
              </div>
              {/* Country flag badge */}
              {listing.source_country && (
                <div className="absolute top-4 right-14 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full">
                  <span className="text-base leading-none">{countryFlag}</span>
                  <span className="text-white text-xs font-medium">FROM {countryName.toUpperCase()}</span>
                </div>
              )}
              {/* Fullscreen Button */}
              <button
                onClick={() => setShowFullscreen(true)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              {/* Nav arrows */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateImage(-1); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateImage(1); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
              {hasMultipleImages && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 text-white text-sm rounded-full">
                  {selectedImage + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {hasMultipleImages && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                      selectedImage === index
                        ? "ring-2 ring-accent ring-offset-2"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={image} alt={`Photo ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Import Status — owner sees stepper + update control ONLY on approved listings */}
            {isOwner && listing.status === 'approved' && (
              <div className="hidden lg:block">
                <ImportStatusStepper status={listing.import_status} />
                <OwnerStatusControl listingId={listingId} currentStatus={listing.import_status} />
              </div>
            )}

            {/* Cost Breakdown — shown below stepper on desktop */}
            <div className="hidden lg:block">
              <CostBreakdownCard listing={listing} />
            </div>

            {/* Source Info — shown below cost on desktop */}
            <div className="hidden lg:block">
              <SourceInfoCard listing={listing} />
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* RIGHT: Details                                                    */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-5">

            {/* Title + Price + Share */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-slate-900 mb-1 leading-tight">
                    {listing.year} {displayMake} {displayModel}
                  </h1>
                  {!isArabic && listing.make_ar && listing.model_ar && (
                    <p className="text-sm text-slate-400 mb-1" dir="rtl">
                      {listing.year} {listing.make_ar} {listing.model_ar}
                    </p>
                  )}
                </div>
                {/* Share Button */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-slate-600" />
                  </button>
                  {showShareMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                      <div className="absolute top-12 right-0 z-50 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2">
                        <p className="px-4 py-2 text-sm text-slate-500 border-b border-slate-100">Share via</p>
                        <button onClick={() => handleShare("copy")} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                          {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                          <span className={linkCopied ? "text-green-600" : "text-slate-700"}>{linkCopied ? "Link Copied!" : "Copy Link"}</span>
                        </button>
                        <button onClick={() => handleShare("whatsapp")} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                          <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                          <span className="text-slate-700">WhatsApp</span>
                        </button>
                        <button onClick={() => handleShare("twitter")} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                          <svg className="w-4 h-4 text-slate-700" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                          <span className="text-slate-700">X / Twitter</span>
                        </button>
                        <button onClick={() => handleShare("facebook")} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                          <span className="text-slate-700">Facebook</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 flex-wrap mt-2">
                <div className="text-3xl font-bold text-accent" dir="ltr">
                  {formatSAR(displayPrice)}
                </div>
                {listing.negotiable && (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                    Negotiable
                  </span>
                )}
                {listing.source_price != null && listing.source_currency && (
                  <span className="text-sm text-slate-400">
                    Source: {new Intl.NumberFormat("en-US").format(listing.source_price)}{" "}
                    {CURRENCY_LABELS[listing.source_currency.toLowerCase()] ?? listing.source_currency.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Mileage</div>
                    <div className="font-semibold text-slate-900" dir="ltr">
                      {new Intl.NumberFormat("en-SA").format(listing.mileage)} km
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Year</div>
                    <div className="font-semibold text-slate-900">{listing.year}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <Fuel className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Fuel</div>
                    <div className="font-semibold text-slate-900">{capitalize(listing.fuel_type)}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Transmission</div>
                    <div className="font-semibold text-slate-900">{capitalize(listing.transmission)}</div>
                  </div>
                </div>
              </div>
              {displayColor && (
                <div className="bg-white rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-500">Color</div>
                      <div className="font-semibold text-slate-900">{displayColor}</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Location</div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {displayCity}
                      {listing.region_display && `, ${listing.region_display}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile-only: stepper (owner only), cost breakdown, source info */}
            <div className="lg:hidden space-y-5">
              {isOwner && listing.status === 'approved' && (
                <>
                  <ImportStatusStepper status={listing.import_status} />
                  <OwnerStatusControl listingId={listingId} currentStatus={listing.import_status} />
                </>
              )}
              <CostBreakdownCard listing={listing} />
              <SourceInfoCard listing={listing} />
            </div>

            {/* Vehicle History */}
            <ImportVehicleHistory listing={listing} />

            {/* Full Specifications */}
            {hasFullSpecs && (
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
                  <Settings2 className="w-5 h-5 text-slate-500" />
                  <h2 className="text-base font-semibold text-slate-900">Specifications</h2>
                </div>
                <div className="px-5 pb-2 divide-y divide-slate-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    {listing.body_type && <SpecRow icon={Car} label={t("carDetail.bodyType")} value={capitalize(listing.body_type)} dir={dir} />}
                    {listing.drive_type && <SpecRow icon={Navigation2} label={t("carDetail.driveType")} value={listing.drive_type.toUpperCase()} dir={dir} />}
                    {listing.engine_size && <SpecRow icon={Zap} label={t("carDetail.engineSize")} value={listing.engine_size} dir={dir} />}
                    {listing.horsepower != null && <SpecRow icon={Zap} label={t("carDetail.horsepower")} value={`${listing.horsepower} hp`} dir={dir} />}
                    {listing.cylinders != null && <SpecRow icon={Settings} label={t("carDetail.cylinders")} value={listing.cylinders} dir={dir} />}
                    {listing.seats != null && <SpecRow icon={Users} label={t("carDetail.seats")} value={listing.seats} dir={dir} />}
                    {listing.doors != null && <SpecRow icon={Car} label={t("carDetail.doors")} value={listing.doors} dir={dir} />}
                    {listing.color_interior && <SpecRow icon={Palette} label="Interior Color" value={capitalize(listing.color_interior)} dir={dir} />}
                    {listing.vin && <SpecRow icon={Hash} label="VIN" value={maskVin(listing.vin)} dir={dir} />}
                    {listing.condition && <SpecRow icon={CheckCircle} label={t("carDetail.condition")} value={capitalize(listing.condition)} dir={dir} />}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {displayDesc && (
              <div className="bg-white rounded-xl p-5 border border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 mb-3">Description</h2>
                <p className="text-slate-600 whitespace-pre-line text-sm leading-relaxed">{displayDesc}</p>
              </div>
            )}

            {/* Listing Stats */}
            <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
              {viewCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {viewCount.toLocaleString()} views
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Listed {daysAgo(listing.created_at)}
              </span>
              <span className="text-slate-300">{formatDate(listing.created_at)}</span>
            </div>

            {/* Importer Info */}
            <div className="bg-white rounded-xl p-5 border border-slate-100">
              <h2 className="text-base font-semibold text-slate-900 mb-4">{t("carDetail.importerInfo")}</h2>
              {ownerProfile ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {ownerProfile.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ownerProfile.avatar_url} alt={ownerProfile.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-7 h-7 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{ownerProfile.name || "Importer"}</span>
                        {ownerProfile.is_business_verified && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-full font-semibold">
                            <BadgeCheck className="w-3 h-3" />
                            Verified Importer
                          </span>
                        )}
                        {/* DEPRECATED: Subscription badge removed — commission-only model */}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {ownerProfile.city_name && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {ownerProfile.city_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {ownerProfile.bio && (
                    <p className="text-sm text-slate-500">{ownerProfile.bio}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-slate-400" />
                      {ownerProfile.stats.active_listings} active listings
                    </span>
                    {ownerProfile.stats.sold_count > 0 && (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        {ownerProfile.stats.sold_count} sold
                      </span>
                    )}
                  </div>
                  {ownerId && (
                    <Link
                      href={`/importers/${ownerId}`}
                      className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-600 font-medium"
                    >
                      {t("carDetail.viewProfile")}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              ) : (
                listing.owner && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{listing.owner.name || "Importer"}</div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Importer Reviews */}
            {ownerId && (
              <div className="bg-white rounded-xl p-5 border border-slate-100">
                <ReviewsSection
                  endpoint={`/api/users/${ownerId}/reviews/`}
                  title={t("carDetail.importerReviews")}
                  emptyMessage="This importer has no reviews yet."
                />
              </div>
            )}

            {/* Action Buttons — status-aware */}
            <div className="space-y-3">
              {(() => {
                // Owner sees status banner instead of reserve CTA when listing is not approved
                const listingApprovalStatus = (listing as any).status ?? "approved";
                if (isOwner && listingApprovalStatus !== "approved") {
                  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                    pending:           { bg: "bg-amber-50 border-amber-200",   text: "text-amber-800",  label: t("listingStatus.pending") },
                    rejected:          { bg: "bg-red-50 border-red-200",       text: "text-red-800",    label: t("listingStatus.rejected") },
                    changes_requested: { bg: "bg-orange-50 border-orange-200", text: "text-orange-800", label: t("listingStatus.changes_requested") },
                    draft:             { bg: "bg-slate-50 border-slate-200",   text: "text-slate-600",  label: t("listingStatus.draft") },
                  };
                  const cfg = statusConfig[listingApprovalStatus] || statusConfig.pending;
                  const adminNotes = (listing as any).admin_notes || (listing as any).rejection_reason;
                  return (
                    <div className={`rounded-2xl border p-5 ${cfg.bg}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className={`w-5 h-5 ${cfg.text}`} />
                        <span className={`font-medium ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      {adminNotes && (listingApprovalStatus === "rejected" || listingApprovalStatus === "changes_requested") && (
                        <p className={`text-[13.5px] mb-4 ${cfg.text} opacity-85`}>
                          {t("listingStatus.adminNote")}: {adminNotes}
                        </p>
                      )}
                      <Link
                        href={`/listing/edit/${listingId}`}
                        className={`block w-full text-center py-3 rounded-xl bg-white border ${cfg.bg.replace("bg-", "border-").replace("50", "300")} ${cfg.text} text-[14px] font-medium hover:opacity-80 transition-colors`}
                      >
                        {t("carDetail.editListing")}
                      </Link>
                    </div>
                  );
                }

                const status = listing.import_status ?? "available";
                const isReserved = status === "reserved" || !!(listing as any).is_reserved;

                // Case: Reserved by someone else
                if (isReserved) {
                  return (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-amber-700" />
                        <span className="font-medium text-amber-900">{t("carDetail.currentlyReserved")}</span>
                      </div>
                      <p className="text-[13.5px] text-amber-800/85 mb-4">
                        {t("carDetail.reservedDesc")}
                      </p>
                      {listing.owner && (
                        <Link
                          href={`/importers/${listing.owner.id}`}
                          className="block w-full text-center py-3 rounded-xl bg-white border border-amber-300 text-amber-900 text-[14px] font-medium hover:bg-amber-50 transition-colors"
                        >
                          {t("carDetail.seeSimilar")} →
                        </Link>
                      )}
                    </div>
                  );
                }

                // Case: In pipeline (shipping/customs/etc)
                if (NON_AVAILABLE_PIPELINE.has(status)) {
                  return (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="w-5 h-5 text-blue-700" />
                        <span className="font-medium text-blue-900">{t("carDetail.inPipeline")}</span>
                      </div>
                      <p className="text-[13.5px] text-blue-800/85">
                        {t("carDetail.pipelineDesc")}
                      </p>
                    </div>
                  );
                }

                // Case: Sold / delivered
                if (SOLD_STATUSES.has(status)) {
                  return (
                    <div className="rounded-2xl border border-[#0B1424]/10 bg-[#0B1424]/[0.03] p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-[#0B1424]/50" />
                        <span className="font-medium text-[#0B1424]/70">{t("carDetail.noLongerAvailable")}</span>
                      </div>
                      <p className="text-[13.5px] text-[#0B1424]/55">
                        {t("carDetail.noLongerDesc")}
                      </p>
                    </div>
                  );
                }

                // Case: Available — show reserve CTA
                if (!isAuthenticated) {
                  return (
                    <Link
                      href="/auth/signin"
                      className="block w-full py-4 bg-[#0B1424] hover:bg-black text-white rounded-xl font-medium text-[15px] text-center transition-colors"
                    >
                      {t("carDetail.signInToReserve")}
                    </Link>
                  );
                }

                return (
                  <>
                    {reserveError && (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[13px] text-red-800">
                        {reserveError}
                      </div>
                    )}
                    <button
                      onClick={handleReserve}
                      disabled={isReserving}
                      className="w-full py-4 bg-[#0B1424] hover:bg-black disabled:opacity-50 text-white rounded-2xl font-medium text-[15px] flex flex-col items-center justify-center gap-0.5 transition-colors"
                    >
                      {isReserving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span>{t("carDetail.reserveButton")}</span>
                      )}
                    </button>
                    <p className="text-center text-[12.5px] text-[#0B1424]/55">
                      {t("carDetail.reserveFee")}
                    </p>
                  </>
                );
              })()}

              {/* Secondary: Favorite + Contact (always shown) */}
              <div className="flex gap-3">
                <button
                  onClick={isAuthenticated ? handleToggleFavorite : undefined}
                  disabled={!isAuthenticated || isTogglingFav}
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border ${
                    isFav
                      ? "bg-red-50 text-red-500 border-red-200"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
                  <span className="hidden sm:inline">{isFav ? t("carDetail.saved") : t("carDetail.save")}</span>
                </button>
                <Link
                  href={isAuthenticated && ownerId ? `/messages?importer_user=${ownerId}&car_id=${listingId}` : "/auth/signin"}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>{t("carDetail.messageImporter")}</span>
                </Link>
              </div>

              {/* Report */}
              {isAuthenticated && ownerId && user?.id !== ownerId && (
                <button
                  onClick={() => setShowReport(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  {t("carDetail.reportListing")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && listing && (
        <ReportModal
          reportType="listing"
          targetId={listing.id}
          targetLabel={`${listing.year} ${listing.make} ${listing.model}`}
          onClose={() => setShowReport(false)}
          onSuccess={() => {
            setShowReport(false);
            showToast("success", t("carDetail.reportSubmitted"));
          }}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Fullscreen Gallery Modal                                              */}
      {/* -------------------------------------------------------------------- */}
      {showFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 text-white rounded-lg">
            {selectedImage + 1} / {images.length}
          </div>
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <Image
              src={images[selectedImage] || "/images/car-placeholder.jpg"}
              alt={`${listing.year} ${displayMake} ${displayModel}`}
              fill
              className="object-contain"
            />
          </div>
          {hasMultipleImages && (
            <>
              <button
                onClick={() => navigateImage(-1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={() => navigateImage(1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
          {hasMultipleImages && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/10 rounded-xl max-w-[90%] overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                    selectedImage === index ? "ring-2 ring-white" : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image src={image} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
