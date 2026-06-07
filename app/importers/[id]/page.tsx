"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { PaginatedResponse } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowLeft, Star, BadgeCheck, MapPin,
  Package, Clock, CheckCircle, Loader2, MessageSquare,
  Users, Car, ChevronRight, Truck, TrendingUp, Shield, Award,
} from "lucide-react";
import { getImageUrl } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ImporterProfile {
  id:               number;
  business_name:    string;
  description:      string | null;
  city:             string | null;
  address:          string | null;
  logo_url:         string | null;
  cover_photo_url:  string | null;
  is_verified:      boolean;
  average_rating:   number;
  review_count:     number;
  source_countries: string[];
  specializations:  string[];
  total_imports:    number;
  avg_delivery_days: number | null;
  success_rate:     number | null;
  years_in_business: string | null;
  member_since:     string;
  active_listings:  number;
}

interface ImporterInventoryItem {
  id:              number;
  make:            string;
  model:           string;
  year:            number;
  final_price_sar: number | null;
  price:           number;
  source_country:  string | null;
  import_status:   string | null;
  import_status_display?: string;
  primary_image:   string | null;
  mileage:         number;
}

interface ImporterReview {
  id:         number;
  reviewer:   { name: string; avatar_url: string | null };
  rating:     number;
  comment:    string;
  created_at: string;
  order_number?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const COUNTRY_FLAGS: Record<string, string> = {
  usa:"🇺🇸", us:"🇺🇸", japan:"🇯🇵", jp:"🇯🇵",
  uae:"🇦🇪", ae:"🇦🇪", korea:"🇰🇷", kr:"🇰🇷",
  germany:"🇩🇪", de:"🇩🇪", uk:"🇬🇧", gb:"🇬🇧",
  canada:"🇨🇦", ca:"🇨🇦", europe:"🇪🇺", eu:"🇪🇺",
};

const COUNTRY_NAMES: Record<string, string> = {
  usa:"United States", japan:"Japan", uae:"UAE", korea:"South Korea",
  germany:"Germany", uk:"United Kingdom", canada:"Canada", europe:"Europe",
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  available:         { bg: "bg-emerald-50", text: "text-emerald-700" },
  arriving:          { bg: "bg-blue-50", text: "text-blue-700" },
  in_transit:        { bg: "bg-blue-50", text: "text-blue-700" },
  at_port:           { bg: "bg-violet-50", text: "text-violet-700" },
  customs_clearance: { bg: "bg-amber-50", text: "text-amber-700" },
  delivered:         { bg: "bg-slate-50", text: "text-slate-600" },
};

const formatSAR = (n: number | null | undefined) => {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(Number(n));
};

const formatDate = (s: string) => new Date(s).toLocaleDateString("en-SA", { year: "numeric", month: "long", day: "numeric" });

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------
function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <svg key={n} className={n <= Math.round(rating) ? "text-yellow-400" : "text-slate-200"}
          width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab content components
// ---------------------------------------------------------------------------
function InventoryGrid({ importerId }: { importerId: string }) {
  const { data, isLoading } = useApiQuery<PaginatedResponse<ImporterInventoryItem> | ImporterInventoryItem[]>(
    `/api/importers/${importerId}/inventory/`
  );
  const items: ImporterInventoryItem[] = Array.isArray(data) ? data : (data?.results ?? []);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (items.length === 0) return (
    <div className="py-16 text-center">
      <Car className="w-10 h-10 text-slate-200 mx-auto mb-3" />
      <p className="text-slate-400 text-sm">No active listings right now.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((car) => {
        const img = car.primary_image
          ? (car.primary_image.startsWith("http") ? car.primary_image : getImageUrl(car.primary_image))
          : null;
        const flag = COUNTRY_FLAGS[car.source_country?.toLowerCase() ?? ""] ?? "🌍";
        const st = STATUS_STYLES[car.import_status ?? ""] ?? { bg: "bg-slate-50", text: "text-slate-600" };

        return (
          <Link key={car.id} href={`/car/${car.id}`}
            className="group bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all overflow-hidden">
            <div className="relative aspect-[16/10] bg-slate-100">
              {img ? (
                <Image src={img} alt={`${car.make} ${car.model}`} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Car className="w-8 h-8 text-slate-200" /></div>
              )}
              <div className="absolute top-3 left-3">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                  {car.import_status_display ?? car.import_status?.replace(/_/g," ") ?? "Available"}
                </span>
              </div>
              <div className="absolute top-3 right-3 text-lg">{flag}</div>
            </div>
            <div className="p-4">
              <p className="font-semibold text-slate-900 text-sm">{car.year} {car.make} {car.model}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Intl.NumberFormat("en-SA").format(car.mileage)} km
                {car.source_country && ` · ${COUNTRY_NAMES[car.source_country.toLowerCase()] ?? car.source_country}`}
              </p>
              <p className="text-[15px] font-bold text-slate-900 mt-3">{formatSAR(car.final_price_sar ?? car.price)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ReviewsList({ importerId }: { importerId: string }) {
  const { data, isLoading } = useApiQuery<PaginatedResponse<ImporterReview> | ImporterReview[]>(
    `/api/importers/${importerId}/reviews/`
  );
  const reviews: ImporterReview[] = Array.isArray(data) ? data : (data?.results ?? []);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (reviews.length === 0) return (
    <div className="py-16 text-center">
      <Star className="w-10 h-10 text-slate-200 mx-auto mb-3" />
      <p className="text-slate-400 text-sm">No reviews yet.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              {r.reviewer.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-slate-400">{r.reviewer.name[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 text-sm">{r.reviewer.name}</span>
                <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span>
              </div>
              <Stars rating={r.rating} size={14} />
              {r.order_number && <p className="text-xs text-slate-400 mt-1 font-mono">{r.order_number}</p>}
              {r.comment && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{r.comment}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
type TabKey = "overview" | "inventory" | "in_transit" | "reviews" | "about";

export default function ImporterProfilePage() {
  const params = useParams();
  const importerId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const { data: importer, isLoading } = useApiQuery<ImporterProfile>(
    `/api/importers/${importerId}/`,
    { enabled: !!importerId }
  );

  if (isLoading) return (
    <div className="min-h-screen bg-[#FAFAF8] pt-24 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
    </div>
  );

  if (!importer) return (
    <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 text-center py-20">
        <Truck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-4">Importer not found</h1>
        <Link href="/importers" className="px-5 py-2.5 bg-[#0A0A0A] text-white rounded-xl font-medium text-sm">
          Back to importers
        </Link>
      </div>
    </div>
  );

  const initials = importer.business_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const rating = Number(importer.average_rating);
  const inTransitCount = 0; // placeholder — would come from API

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "inventory", label: "Inventory", count: importer.active_listings },
    { key: "in_transit", label: "In transit", count: inTransitCount },
    { key: "reviews", label: "Reviews", count: importer.review_count },
    { key: "about", label: "About" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-16">

      {/* ─── HERO ─── */}
      <div className="relative bg-[#0A0A0A] overflow-hidden" style={{ paddingTop: 64, paddingBottom: 160 }}>
        {importer.cover_photo_url && (
          <Image src={importer.cover_photo_url} alt="" fill className="object-cover opacity-30" />
        )}
        {/* Route map pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 800 300" preserveAspectRatio="none">
          <path d="M0 200 Q200 50 400 180 T800 100" stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="6 4" />
          <circle cx="100" cy="170" r="4" fill="white" />
          <circle cx="400" cy="180" r="4" fill="white" />
          <circle cx="700" cy="120" r="4" fill="white" />
        </svg>

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <Link href="/importers" className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />
              All importers
            </Link>
            {/* Live status pill */}
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/20 backdrop-blur-sm border border-teal-400/30 text-teal-200 text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
              Active · {inTransitCount > 0 ? `${inTransitCount} shipments in transit` : "Verified importer"}
            </span>
          </div>

          <div>
            <h1 className="text-white text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
              {importer.business_name.split(" ").map((w, i, arr) =>
                i === 1
                  ? <span key={i} className="mk-serif-it font-normal">{w} </span>
                  : <span key={i}>{w}{i < arr.length - 1 ? " " : ""}</span>
              )}
            </h1>
            {importer.description && (
              <p className="text-white/60 text-base mt-3 max-w-lg leading-relaxed">{importer.description}</p>
            )}
            {/* Trust badges */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {importer.is_verified && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white text-xs font-medium">
                  <BadgeCheck className="w-4 h-4 text-teal-300" /> Verified Importer
                </span>
              )}
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white text-xs font-medium">
                <Shield className="w-4 h-4 text-white/60" /> SASO Compliant
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white text-xs font-medium">
                <Award className="w-4 h-4 text-white/60" /> MOC Licensed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PROFILE CARD (overlapping hero) ─── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-8 -mt-24 z-10">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white shadow-md -mt-14">
                {importer.logo_url ? (
                  <Image src={importer.logo_url} alt={importer.business_name} width={96} height={96} className="object-contain p-1" />
                ) : (
                  <span className="text-[36px] font-bold text-[#0a0a0a]">{initials}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{importer.business_name}</h2>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm text-slate-500">
                      {importer.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{importer.city}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Responds in 2h</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Stars rating={rating} size={15} />
                      <span className="text-sm font-semibold text-slate-900">{rating > 0 ? rating.toFixed(1) : "—"}</span>
                      {importer.review_count > 0 && <span className="text-xs text-slate-400">({importer.review_count})</span>}
                    </div>
                  </div>

                  {/* CTA — in-app messaging only */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/messages?importer=${importer.id}`}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0A0A0A] text-white rounded-xl text-sm font-medium hover:bg-black transition-colors">
                      <MessageSquare className="w-4 h-4" /> مراسلة المستورد / Message importer
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="border-t border-slate-100 px-6 sm:px-8">
            <div className="flex gap-0 overflow-x-auto -mb-px">
              {tabs.map(({ key, label, count }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`relative px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === key
                      ? "text-slate-900"
                      : "text-slate-400 hover:text-slate-600"
                  }`}>
                  {label}{count != null ? ` (${count})` : ""}
                  {activeTab === key && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A0A0A] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Overview / Inventory / In Transit / Reviews / About */}
            {(activeTab === "overview" || activeTab === "inventory") && (
              <>
                {/* 4-up metric grid (overview only) */}
                {activeTab === "overview" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Cars imported", value: importer.total_imports > 0 ? importer.total_imports : null, fallback: "No data yet", hint: "all time" },
                      { label: "Avg. delivery", value: importer.avg_delivery_days != null && Number(importer.avg_delivery_days) > 0 ? `${Number(importer.avg_delivery_days)} days` : null, fallback: "No data yet", hint: "to Saudi" },
                      { label: "Success rate", value: importer.success_rate != null && Number(importer.success_rate) > 0 ? `${Number(importer.success_rate).toFixed(0)}%` : null, fallback: "No data yet", hint: "orders completed" },
                      { label: "Repeat buyers", value: null, fallback: "No data yet", hint: "returning customers" },
                    ].map(({ label, value, fallback, hint }) => (
                      <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4">
                        {value != null ? (
                          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
                        ) : (
                          <p className="text-sm text-slate-300 italic">{fallback}</p>
                        )}
                        <p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
                        <p className="text-[10px] text-slate-300 mt-0.5">{hint}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent inventory / full inventory */}
                <div>
                  {activeTab === "overview" && (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Recent inventory</h3>
                      <button onClick={() => setActiveTab("inventory")} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5">
                        View all <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <InventoryGrid importerId={importerId} />
                </div>

                {/* Reviews preview (overview only) */}
                {activeTab === "overview" && importer.review_count > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Reviews</h3>
                      <button onClick={() => setActiveTab("reviews")} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5">
                        View all <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <ReviewsList importerId={importerId} />
                  </div>
                )}
              </>
            )}

            {activeTab === "in_transit" && (
              <div className="py-16 text-center">
                <Truck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No cars currently in transit.</p>
              </div>
            )}

            {activeTab === "reviews" && <ReviewsList importerId={importerId} />}

            {activeTab === "about" && (
              <div className="space-y-6">
                {importer.description && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">About</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{importer.description}</p>
                  </div>
                )}
                {importer.source_countries.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Source markets</h3>
                    <div className="flex flex-wrap gap-2">
                      {importer.source_countries.map((c) => (
                        <div key={c} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-xl">{COUNTRY_FLAGS[c.toLowerCase()] ?? "🌍"}</span>
                          <span className="text-sm font-medium text-slate-700">{COUNTRY_NAMES[c.toLowerCase()] ?? c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {importer.specializations.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {importer.specializations.map((s) => (
                        <span key={s} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-sm font-medium text-slate-700">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── SIDEBAR ─── */}
          <div className="space-y-4">
            {/* Contact card — in-app messaging only */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Contact</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Usually responds within <strong className="text-slate-700">2 hours</strong></span>
              </div>
              <Link
                href={`/messages?importer=${importer.id}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#0A0A0A] text-white rounded-xl text-sm font-medium hover:bg-black transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                مراسلة المستورد / Message importer
              </Link>
            </div>

            {/* Business info */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Business info</h3>
              <div className="space-y-3 text-sm">
                {importer.years_in_business && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Years in business</span>
                    <span className="font-medium text-slate-700">{importer.years_in_business}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Member since</span>
                  <span className="font-medium text-slate-700">
                    {importer.member_since && !isNaN(new Date(importer.member_since).getTime())
                      ? new Date(importer.member_since).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                      : "Recently joined"}
                  </span>
                </div>
                {importer.source_countries.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Source countries</span>
                    <span className="flex items-center gap-1">
                      {importer.source_countries.slice(0, 5).map(c => (
                        <span key={c} className="text-base">{COUNTRY_FLAGS[c.toLowerCase()] ?? "🌍"}</span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {importer.address && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Location</h3>
                <div className="w-full h-32 bg-slate-100 rounded-xl mb-3 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm text-slate-600">{importer.address}</p>
                {importer.city && <p className="text-xs text-slate-400 mt-1">{importer.city}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
