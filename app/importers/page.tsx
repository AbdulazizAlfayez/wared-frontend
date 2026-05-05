"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { PaginatedResponse } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import {
  Search, MapPin, Star, BadgeCheck, Loader2, X, Globe, Package,
  ChevronRight, SlidersHorizontal, Users,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ImporterCard {
  id:               number;
  business_name:    string;
  city:             string;
  logo_url:         string | null;
  cover_photo_url:  string | null;
  is_verified:      boolean;
  average_rating:   number | string;
  review_count:     number;
  source_countries: string[];
  specializations:  string[];
  total_imports:    number;
  years_in_business: number | string | null;
  active_listings:  number;
  description?:     string;
  success_rate?:    number | string | null;
}

// ---------------------------------------------------------------------------
// Gradient palette — 3 premium options cycled by index
// ---------------------------------------------------------------------------
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",  // black
  "linear-gradient(135deg, #1E293B 0%, #334155 100%)",  // slate-dark
  "linear-gradient(135deg, #262626 0%, #404040 100%)",  // charcoal
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const COUNTRY_FLAGS: Record<string, string> = {
  usa: "🇺🇸", us: "🇺🇸", japan: "🇯🇵", jp: "🇯🇵",
  uae: "🇦🇪", ae: "🇦🇪", korea: "🇰🇷", kr: "🇰🇷",
  germany: "🇩🇪", de: "🇩🇪", uk: "🇬🇧", gb: "🇬🇧",
  canada: "🇨🇦", ca: "🇨🇦", europe: "🇪🇺", eu: "🇪🇺",
  china: "🇨🇳", cn: "🇨🇳", australia: "🇦🇺", au: "🇦🇺",
};

const COUNTRY_LABELS: Record<string, string> = {
  usa: "USA", japan: "Japan", uae: "UAE", korea: "Korea",
  germany: "Germany", uk: "UK", canada: "Canada", europe: "Europe",
  china: "China", australia: "Australia",
};

const SAUDI_CITIES = [
  "Riyadh", "Jeddah", "Dammam", "Khobar", "Jubail", "Makkah",
  "Madinah", "Taif", "Abha", "Tabuk", "Hail", "Buraidah",
];

const SOURCE_FILTER_OPTIONS = ["USA", "Japan", "Korea", "UAE", "Germany", "Canada", "UK", "Europe"];

// ---------------------------------------------------------------------------
// Star Rating (inline, no count — used inside card)
// ---------------------------------------------------------------------------
function StarRow({ rating, count }: { rating: number | string; count: number }) {
  const r = Number(rating);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <svg key={n} className={`w-3.5 h-3.5 ${n <= Math.round(r) ? "text-yellow-400" : "text-slate-200"}`}
            viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-700">{r > 0 ? r.toFixed(1) : "—"}</span>
      {count > 0 && <span className="text-xs text-slate-400">({count} reviews)</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Importer Card
// ---------------------------------------------------------------------------
function ImporterCardItem({ importer, index }: { importer: ImporterCard; index: number }) {
  const words    = importer.business_name.split(" ").filter(Boolean);
  const initials = words.slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const rating   = Number(importer.average_rating);
  const years    = importer.years_in_business ? Number(importer.years_in_business) : null;
  const success  = importer.success_rate != null ? Number(importer.success_rate) : null;
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <Link
      href={`/importers/${importer.id}`}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* ── Gradient header strip (shorter so logo initials are visible) ── */}
      <div className="relative h-16 overflow-hidden flex-shrink-0"
        style={{ background: gradient }}
      >
        {/* subtle dot texture */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }}
        />
        {importer.cover_photo_url && (
          <Image src={importer.cover_photo_url} alt="" fill className="object-cover opacity-25 mix-blend-overlay" />
        )}

        {/* Verified badge */}
        {importer.is_verified && (
          <div className="absolute top-2.5 right-3 flex items-center gap-1 bg-white/95 px-2 py-1 rounded-full shadow-sm">
            <BadgeCheck className="w-3 h-3 text-accent" />
            <span className="text-[10px] font-bold text-accent">Verified</span>
          </div>
        )}
      </div>

      {/* ── Logo circle overlapping strip ── */}
      <div className="px-5 -mt-8 mb-1 flex-shrink-0">
        <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden flex items-center justify-center">
          {importer.logo_url ? (
            <Image src={importer.logo_url} alt={importer.business_name} width={64} height={64} className="object-contain p-1" />
          ) : (
            <span className="text-xl font-bold text-[#0a0a0a] leading-none">{initials}</span>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-5 pb-5 flex flex-col flex-1 gap-2.5">

        {/* Name + city + flags */}
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-accent transition-colors">
            {importer.business_name}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
            {importer.city && (
              <>
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{importer.city}</span>
              </>
            )}
            {importer.source_countries.length > 0 && (
              <>
                {importer.city && <span className="text-slate-300">·</span>}
                {importer.source_countries.slice(0, 3).map((c) => {
                  const key = c.toLowerCase();
                  return (
                    <span key={c} title={COUNTRY_LABELS[key] ?? c} className="text-lg leading-none">
                      {COUNTRY_FLAGS[key] ?? "🌍"}
                    </span>
                  );
                })}
                {importer.source_countries.length > 3 && (
                  <span className="text-[10px] font-semibold text-slate-400">
                    +{importer.source_countries.length - 3}
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {/* Stars + rating + review count */}
        <StarRow rating={importer.average_rating} count={importer.review_count} />

        {/* Description */}
        {importer.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {importer.description}
          </p>
        )}

        {/* Specializations */}
        {importer.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {importer.specializations.slice(0, 3).map((s) => (
              <span key={s} className="text-xs bg-slate-100 text-slate-700 rounded-full px-3 py-1">
                {s}
              </span>
            ))}
            {importer.specializations.length > 3 && (
              <span className="text-xs bg-slate-100 text-slate-400 rounded-full px-3 py-1">
                +{importer.specializations.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats row — pushed to bottom */}
        <div className="mt-auto pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-bold text-slate-900">
              {importer.active_listings ?? 0}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">Cars Listed</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {importer.total_imports > 0 ? importer.total_imports : "—"}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">Imported</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {years ? `${years}y` : (success != null && success > 0 ? `${Number(success).toFixed(0)}%` : (rating > 0 ? `${rating.toFixed(1)}★` : "—"))}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              {years ? "Experience" : (success != null && success > 0 ? "Success" : "Rating")}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#f3f4f6] text-[#0a0a0a] hover:bg-[#e5e7eb] font-medium text-xs transition-colors">
          View Inventory
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ImportersPage() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const params = new URLSearchParams();
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (cityFilter)       params.set("city", cityFilter);
  if (countryFilter)    params.set("source_country", countryFilter.toLowerCase());

  const { data, isLoading } = useApiQuery<PaginatedResponse<ImporterCard> | ImporterCard[]>(
    `/api/importers/?${params.toString()}`,
    { deps: [debouncedSearch, cityFilter, countryFilter] }
  );

  const importers: ImporterCard[] = Array.isArray(data) ? data : (data?.results ?? []);
  const hasFilters = !!(search || cityFilter || countryFilter);

  const clearFilters = () => { setSearch(""); setCityFilter(""); setCountryFilter(""); };

  const totalListings = importers.reduce((s, i) => s + (i.active_listings ?? 0), 0);
  const avgRating = importers.length > 0
    ? importers.reduce((s, i) => s + Number(i.average_rating), 0) / importers.length
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">

      {/* ── Hero header ── */}
      <div className="bg-slate-50 border-b border-slate-100 pt-24 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-2">Marketplace</p>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3">Verified Importers</h1>
          <p className="text-slate-500 max-w-xl text-base">
            Every importer is vetted — commercial registration, customs license, and track record confirmed before listing.
          </p>

          {/* Stat pills */}
          {!isLoading && importers.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm font-semibold text-slate-700 shadow-sm">
                <BadgeCheck className="w-4 h-4 text-accent" />
                {importers.length} Verified Importers
              </span>
              {totalListings > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm font-semibold text-slate-700 shadow-sm">
                  <Package className="w-4 h-4 text-slate-400" />
                  {totalListings}+ Cars Listed
                </span>
              )}
              {avgRating > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm font-semibold text-slate-700 shadow-sm">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {avgRating.toFixed(1)} Avg Rating
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Search + Filters Bar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap sm:flex-nowrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search importers…"
              className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle (mobile) / Inline filters (desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm focus:border-accent focus:outline-none"
            >
              <option value="">All Cities</option>
              {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm focus:border-accent focus:outline-none"
            >
              <option value="">All Countries</option>
              {SOURCE_FILTER_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasFilters && <span className="w-2 h-2 bg-accent rounded-full" />}
          </button>

          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-1 whitespace-nowrap transition-colors">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Mobile filter panel */}
        {showFilters && (
          <div className="sm:hidden bg-white rounded-xl border border-slate-100 p-4 mb-5 grid grid-cols-2 gap-3">
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm focus:border-accent focus:outline-none">
              <option value="">All Cities</option>
              {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm focus:border-accent focus:outline-none">
              <option value="">All Countries</option>
              {SOURCE_FILTER_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-slate-400 mb-4">
            <span className="font-semibold text-slate-700">{importers.length}</span> importer{importers.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : importers.length === 0 ? (
          <div className="text-center py-24">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-700 mb-2">No importers found</h2>
            <p className="text-slate-400 text-sm mb-6">Try adjusting your search or filters.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {importers.map((imp, idx) => (
              <ImporterCardItem key={imp.id} importer={imp} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
