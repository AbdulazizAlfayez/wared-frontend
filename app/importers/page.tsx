"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useMemo } from "react";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { PaginatedResponse } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import {
  Search, BadgeCheck, Loader2, X, ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ImporterCard {
  id:                  number;
  business_name:       string;
  business_name_ar?:   string;
  city:                string | null;
  logo:                string | null;
  logo_url?:           string | null;
  is_verified:         boolean;
  average_rating:      number | string;
  total_reviews:       number;
  review_count?:       number;
  source_countries:    string[];
  specializations:     string[];
  total_cars_imported: number;
  total_imports?:      number;
  avg_delivery_days?:  number | null;
  years_in_business:   number | string | null;
  active_listings?:    number;
  success_rate?:       number | string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const COUNTRY_FLAGS: Record<string, string> = {
  usa: "🇺🇸", us: "🇺🇸", japan: "🇯🇵", jp: "🇯🇵",
  uae: "🇦🇪", ae: "🇦🇪", korea: "🇰🇷", kr: "🇰🇷",
  germany: "🇩🇪", de: "🇩🇪", uk: "🇬🇧", gb: "🇬🇧",
  canada: "🇨🇦", ca: "🇨🇦", europe: "🇪🇺", eu: "🇪🇺",
  china: "🇨🇳", cn: "🇨🇳", australia: "🇦🇺", au: "🇦🇺",
  qatar: "🇶🇦", qa: "🇶🇦",
};

const COUNTRY_LABELS: Record<string, string> = {
  usa: "USA", japan: "Japan", uae: "UAE", korea: "Korea",
  germany: "Germany", uk: "UK", canada: "Canada", europe: "Europe",
  china: "China", australia: "Australia", qatar: "Qatar",
};

const SOURCE_PILLS = [
  { code: "usa",    flag: "🇺🇸", countryKey: "usa" },
  { code: "japan",  flag: "🇯🇵", countryKey: "japan" },
  { code: "korea",  flag: "🇰🇷", countryKey: "korea" },
  { code: "uae",    flag: "🇦🇪", countryKey: "uae" },
  { code: "europe", flag: "🇪🇺", countryKey: "europe" },
];

type SortKey = "experienced" | "rated" | "imports" | "newest";

const SORT_OPTIONS: { value: SortKey; labelKey: string }[] = [
  { value: "experienced", labelKey: "importers.sortExperienced" },
  { value: "rated",       labelKey: "importers.sortRated" },
  { value: "imports",     labelKey: "importers.sortImports" },
  { value: "newest",      labelKey: "importers.sortNewest" },
];

// ---------------------------------------------------------------------------
// Helpers (preserved)
// ---------------------------------------------------------------------------
function getInitials(name: string): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!/[a-zA-Z]/.test(name)) return name.substring(0, 2);
  return words.slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const AVATAR_PALETTE = [
  { bg: "#E8F5F0", text: "#0B8470" },
  { bg: "#E8ECF4", text: "#1E2A44" },
  { bg: "#F2EDDC", text: "#856F3F" },
  { bg: "#F5E6DD", text: "#8B4513" },
  { bg: "#E8EFE6", text: "#4A6B3A" },
];

function getPillColor(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("uae") || t.includes("gcc") || t.includes("qatar")) return "bg-[#E8F5F0] text-[#0B8470]";
  if (t.includes("usa") || t.includes("american") || t.includes("copart")) return "bg-[#E8ECF4] text-[#1E2A44]";
  if (t.includes("japan") || t.includes("jdm")) return "bg-[#F5E6DD] text-[#8B4513]";
  if (t.includes("korea")) return "bg-[#F2EDDC] text-[#856F3F]";
  if (t.includes("europ")) return "bg-[#E8EFE6] text-[#4A6B3A]";
  return "bg-[#0B1424]/5 text-[#0B1424]/70";
}

function isArabicName(name: string): boolean {
  return /[\u0600-\u06FF]/.test(name);
}

// ---------------------------------------------------------------------------
// Star Rating
// ---------------------------------------------------------------------------
function StarRow({ rating, count }: { rating: number; count: number }) {
  const { t } = useTranslation();
  if (count === 0) {
    return <span className="text-[12px] text-ink-300">{t("importers.noReviewsYet")}</span>;
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <svg key={n} className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? "text-yellow-400" : "text-ink-200"}`}
            viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-[12.5px] font-semibold text-ink-700">{rating.toFixed(1)}</span>
      <span className="text-[12px] text-ink-400">({count} {t("importers.reviews")})</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Importer Card
// ---------------------------------------------------------------------------
function ImporterCardItem({ importer, siteRTL }: { importer: ImporterCard; siteRTL: boolean }) {
  const { t } = useTranslation();
  const initials  = getInitials(importer.business_name);
  const rating    = Number(importer.average_rating);
  const reviews   = importer.total_reviews ?? importer.review_count ?? 0;
  const years     = importer.years_in_business ? Number(importer.years_in_business) : null;
  const imported  = importer.total_cars_imported ?? importer.total_imports ?? 0;
  const avgDays   = importer.avg_delivery_days ?? null;
  const successRate = importer.success_rate ? Number(importer.success_rate) : null;
  const palette   = AVATAR_PALETTE[importer.id % AVATAR_PALETTE.length];
  const cardRTL   = siteRTL || isArabicName(importer.business_name);
  const hasStats  = imported > 0;
  const logoSrc   = importer.logo_url || importer.logo || null;

  return (
    <Link
      href={`/importers/${importer.id}`}
      dir={cardRTL ? "rtl" : "ltr"}
      className="group relative flex flex-col rounded-2xl border border-ink-100 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_20px_50px_-25px_rgba(11,20,36,0.25)] hover:-translate-y-1 hover:border-ink-200"
      style={{ backgroundColor: "var(--mk-paper)" }}
    >
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent" />

      <div className="p-6 flex flex-col flex-1 gap-3">

        {/* Header row: avatar + name + verified */}
        <div className="flex items-start gap-3.5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border border-ink-100"
            style={{ backgroundColor: palette.bg }}
          >
            {logoSrc ? (
              <Image src={logoSrc} alt={importer.business_name} width={56} height={56} className="object-contain rounded-xl p-1" />
            ) : (
              <span className="text-[18px] font-medium tracking-tight leading-none" style={{ color: palette.text }}>{initials}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-[15px] text-ink-900 leading-snug group-hover:text-teal-700 transition-colors truncate">
                {importer.business_name}
              </h3>
              {importer.is_verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[11px] font-medium border border-teal-200/50 flex-shrink-0">
                  <BadgeCheck className="w-3 h-3" />
                  {t("importers.verified")}
                </span>
              )}
            </div>
            {importer.city && (
              <p className="text-[12px] text-ink-400 mt-0.5">{importer.city}</p>
            )}
          </div>
        </div>

        {/* Trust row: rating + years */}
        <div className="flex items-center gap-2 flex-wrap">
          <StarRow rating={rating} count={reviews} />
          {years != null && years > 0 && (
            <>
              <span className="text-ink-200">&middot;</span>
              <span className="text-[12px] text-ink-400">{years} {t("importers.yearsInBusiness")}</span>
            </>
          )}
        </div>

        {/* Sources from */}
        {importer.source_countries.length > 0 && (
          <div>
            <p className="text-[11px] text-ink-400 font-medium mb-1.5">{t("importers.sourcesFrom")}</p>
            <div className="flex flex-wrap gap-1.5">
              {importer.source_countries.map((c) => {
                const key = c.toLowerCase();
                return (
                  <span key={c} className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1 bg-ink-50 text-ink-600 border border-ink-100">
                    <span className="text-[13px] leading-none">{COUNTRY_FLAGS[key] ?? "🌍"}</span>
                    {t(`countries.${key}`) !== `countries.${key}` ? t(`countries.${key}`) : (COUNTRY_LABELS[key] ?? c)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="h-px bg-ink-100" />

        {/* Stats row or "New" */}
        {hasStats ? (
          <div className="flex items-center gap-3 text-[12.5px] text-ink-500 flex-wrap">
            <span className="font-medium text-ink-700">{imported} {t("importers.imported")}</span>
            {successRate != null && successRate > 0 && (
              <>
                <span className="text-ink-200">&middot;</span>
                <span>{successRate}% {t("importers.onTime")}</span>
              </>
            )}
            {avgDays != null && avgDays > 0 && (
              <>
                <span className="text-ink-200">&middot;</span>
                <span>{t("importers.avgDays").replace("{days}", String(avgDays))}</span>
              </>
            )}
          </div>
        ) : (
          <div className="text-[12px] text-ink-400">
            {t("importers.newOnWared")}{years ? ` · ${years} ${t("importers.yearsInBusiness")}` : ""}
          </div>
        )}

        {/* Specializations */}
        {importer.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {importer.specializations.slice(0, 2).map((s) => (
              <span key={s} className={`text-[11px] font-medium rounded-full px-2.5 py-1 max-w-[120px] truncate ${getPillColor(s)}`}>
                {s}
              </span>
            ))}
            {importer.specializations.length > 2 && (
              <span className="text-[11px] text-ink-400 bg-ink-50 rounded-full px-2.5 py-1">
                +{importer.specializations.length - 2} {t("importers.more")}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-1 border-t border-ink-100">
          <div className="flex items-center gap-1 py-2 text-[13px] font-medium text-ink-500 group-hover:text-teal-700 transition-colors">
            {t("importers.viewProfile")}
            <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${cardRTL ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
          </div>
        </div>

      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ImportersPage() {
  const { t, dir } = useTranslation();
  const siteRTL = dir === "rtl";

  const [search, setSearch] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("experienced");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const params = new URLSearchParams();
  if (debouncedSearch) params.set("search", debouncedSearch);

  const { data, isLoading } = useApiQuery<PaginatedResponse<ImporterCard> | ImporterCard[]>(
    `/api/importers/?${params.toString()}`,
    { deps: [debouncedSearch] }
  );

  const rawImporters: ImporterCard[] = Array.isArray(data) ? data : (data?.results ?? []);

  // Client-side filter by selected source countries
  const filtered = useMemo(() => {
    if (selectedCountries.length === 0) return rawImporters;
    return rawImporters.filter(imp =>
      imp.source_countries.some(c => selectedCountries.includes(c.toLowerCase()))
    );
  }, [rawImporters, selectedCountries]);

  // Client-side sort
  const importers = useMemo(() => {
    const sorted = [...filtered];
    switch (sortBy) {
      case "experienced":
        sorted.sort((a, b) => (Number(b.years_in_business) || 0) - (Number(a.years_in_business) || 0));
        break;
      case "rated":
        sorted.sort((a, b) => {
          const diff = Number(b.average_rating) - Number(a.average_rating);
          if (diff !== 0) return diff;
          return (b.total_reviews ?? 0) - (a.total_reviews ?? 0);
        });
        break;
      case "imports":
        sorted.sort((a, b) => (b.total_cars_imported ?? 0) - (a.total_cars_imported ?? 0));
        break;
      case "newest":
        sorted.sort((a, b) => (Number(a.years_in_business) || 0) - (Number(b.years_in_business) || 0));
        break;
    }
    return sorted;
  }, [filtered, sortBy]);

  const hasFilters = !!(search || selectedCountries.length > 0);

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCountries([]);
  };

  // Collect active source country names for summary
  const activeCountryNames = selectedCountries.length > 0
    ? selectedCountries.map(c => {
        const translated = t(`countries.${c}`);
        return translated !== `countries.${c}` ? translated : (COUNTRY_LABELS[c] ?? c);
      }).join(", ")
    : t("common.all");

  return (
    <div className="min-h-screen pb-16" style={{ background: "var(--mk-paper)" }}>

      {/* Hero */}
      <section className="px-8 pt-12 pb-8 lg:pt-16 lg:pb-10 border-b border-ink-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-[11px] uppercase tracking-[0.15em] text-ink-400 font-medium mb-3">
            {t("importers.heroSubhead")} &middot; {rawImporters.length} {t("nav.importers").toLowerCase()}
          </div>
          <h1
            className="leading-[1.05] tracking-tight font-light mb-3 max-w-2xl text-ink-900"
            style={{ fontSize: "clamp(32px, 5vw, 48px)" }}
          >
            {t("importers.heroTitle")}
            <span className="font-serif italic"> {t("importers.heroTitleAccent")}</span>
          </h1>
          <p className="text-[15.5px] text-ink-400 max-w-xl leading-relaxed">
            {t("importers.heroDesc")}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-8 pt-8">

        {/* Filter bar */}
        <div className="space-y-4 mb-8">
          {/* Row 1: Search + Sort */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("importers.searchPlaceholder")}
                className="w-full pl-10 pr-10 py-3 border border-ink-100 rounded-xl text-ink-900 placeholder-ink-300 text-sm focus:border-ink-400 focus:outline-none transition"
                style={{ background: "var(--mk-paper)" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-700">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="px-4 py-3 border border-ink-100 rounded-xl text-ink-700 text-sm focus:border-ink-400 focus:outline-none transition"
              style={{ background: "var(--mk-paper)" }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
              ))}
            </select>
          </div>

          {/* Row 2: Source country pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] text-ink-400 font-medium">{t("importers.sourceMarkets")}:</span>
            {SOURCE_PILLS.map(p => {
              const active = selectedCountries.includes(p.code);
              return (
                <button
                  key={p.code}
                  onClick={() => toggleCountry(p.code)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium border transition ${
                    active
                      ? "bg-ink-900 text-white border-ink-900"
                      : "bg-ink-50 text-ink-700 border-ink-100 hover:border-ink-300"
                  }`}
                >
                  <span className="text-[14px] leading-none">{p.flag}</span>
                  {t(`countries.${p.countryKey}`)}
                </button>
              );
            })}
            {hasFilters && (
              <button onClick={clearAllFilters} className="text-[12px] text-ink-400 hover:text-red-500 flex items-center gap-1 transition-colors ms-2">
                <X className="w-3.5 h-3.5" /> {t("common.clear")}
              </button>
            )}
          </div>
        </div>

        {/* Results summary */}
        {!isLoading && (
          <p className="text-[13px] text-ink-400 mb-5">
            <span className="font-medium text-ink-600">{importers.length}</span> importer{importers.length !== 1 ? "s" : ""} &middot; sourcing from {activeCountryNames}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : importers.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-10 h-10 text-ink-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
            <div className="text-[16px] font-medium text-ink-700 mb-1">{t("importers.noMatch")}</div>
            <div className="text-[13.5px] text-ink-400 mb-5">{t("importers.noMatchHint")}</div>
            <button onClick={clearAllFilters} className="text-[13px] font-medium text-teal-600 hover:text-teal-700">
              {t("importers.clearAllFilters")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {importers.map((imp) => (
              <ImporterCardItem key={imp.id} importer={imp} siteRTL={siteRTL} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
