"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Loader2, Gauge, MapPin, X, GitCompare, Check,
  Car as CarIcon, Clock, Heart, ArrowRight,
} from "lucide-react";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { isCompared, toggleCompare, getCompareIds, clearCompare } from "@/lib/compare";
import { useApiQuery } from "@/lib/hooks/use-api";
import { getImageUrl } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { ImportedListing, PaginatedResponse } from "@/lib/types";

// ---------------------------------------------------------------------------
// Legacy sample-car exports (used by Favorites page & compare — keep shape)
// ---------------------------------------------------------------------------
export type SampleCar = {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  city: string;
  priceSar: number;
  mileageKm: number;
  fuelType: string;
  transmission: string;
  condition: string;
  color: string;
  description: string;
  imageUrl: string;
  sellerPhone?: string;
  sellerEmail?: string;
  ownerVerificationLevel?: string;
};

export const sampleCars: SampleCar[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_CLS: Record<string, string> = {
  available:         "bg-white/95 backdrop-blur-sm text-[#0B1424] border border-white/40",
  arriving:          "bg-[#E8F5F0] text-[#0B8470]",
  in_transit:        "bg-[#E8F5F0] text-[#0B8470]",
  at_port:           "bg-violet-50 text-violet-700",
  customs_clearance: "bg-amber-50 text-amber-700",
  reserved:          "bg-amber-50 text-amber-800",
  delivered:         "bg-slate-100 text-slate-500",
  ready_for_delivery:"bg-green-50 text-green-700",
  shipping:          "bg-[#E8F5F0] text-[#0B8470]",
};

const SOURCE_FLAG: Record<string, string> = {
  usa:    "🇺🇸", uae: "🇦🇪", japan: "🇯🇵",
  korea:  "🇰🇷", europe: "🇪🇺", canada: "🇨🇦",
  qatar:  "🇶🇦", other: "🌐",
};

function formatSAR(n: number | string | null | undefined) {
  if (!n) return null;
  return new Intl.NumberFormat("en-SA", {
    style: "currency", currency: "SAR", maximumFractionDigits: 0,
  }).format(Number(n));
}

// ---------------------------------------------------------------------------
// Imported Car Card
// ---------------------------------------------------------------------------
function ImportedCarCard({ listing }: { listing: ImportedListing }) {
  const { t } = useTranslation();
  const [isFav, setIsFav] = useState(() => isFavorite(String(listing.id)));
  const [isInCompare, setIsInCompare] = useState(() => isCompared(String(listing.id)));

  useEffect(() => {
    const sync = () => {
      setIsFav(isFavorite(String(listing.id)));
      setIsInCompare(isCompared(String(listing.id)));
    };
    window.addEventListener("favoritesUpdated", sync);
    window.addEventListener("compareUpdated", sync);
    return () => {
      window.removeEventListener("favoritesUpdated", sync);
      window.removeEventListener("compareUpdated", sync);
    };
  }, [listing.id]);

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFav(toggleFavorite(String(listing.id)));
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleCompare(String(listing.id));
    if (result.success) setIsInCompare(result.newState);
  };

  const primaryImage = listing.images?.find((img) => img.is_primary) ?? listing.images?.[0];
  const imageUrl =
    listing.primary_image ||
    primaryImage?.image_url ||
    (primaryImage?.image ? getImageUrl(primaryImage.image) : null);

  const statusCls = listing.import_status
    ? (STATUS_CLS[listing.import_status] ?? "bg-slate-100 text-slate-600")
    : null;
  const statusLabel = listing.import_status
    ? t(`importStatus.${listing.import_status}`)
    : null;

  const flag = listing.source_country ? (SOURCE_FLAG[listing.source_country] ?? "🌐") : null;
  const finalPrice = listing.final_price_sar ?? listing.price;
  const showArrival =
    listing.estimated_arrival_date &&
    listing.import_status &&
    ["in_transit", "arriving", "at_port"].includes(listing.import_status);

  return (
    <Link href={`/car/${listing.id}`}>
      <div className="group bg-white rounded-2xl overflow-hidden border border-[#0B1424]/8 hover:shadow-[0_20px_40px_-20px_rgba(11,20,36,0.2)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer">
        {/* Image — locked 4:3 aspect */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 flex-shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${listing.year} ${listing.make} ${listing.model}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#F5F4F0]">
              <span className="text-[22px] font-medium text-[#888780] tracking-tight">{listing.make}</span>
              <span className="text-[13px] text-[#888780]/60">{listing.model}</span>
            </div>
          )}

          {/* Status badge */}
          {statusLabel && statusCls && (
            <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-medium ${statusCls}`}>
              {statusLabel}
            </span>
          )}

          {/* Favorite */}
          <button
            onClick={handleFav}
            aria-label={isFav ? t("actions.removeFromFavorites") : t("actions.saveToFavorites")}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : "text-[#0B1424]/40"}`} />
          </button>

          {/* Compare */}
          <button
            onClick={handleCompare}
            aria-label={isInCompare ? t("actions.compared") : t("actions.compare")}
            className={`absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium shadow-sm transition-all ${
              isInCompare
                ? "bg-[#0B1424] text-white"
                : "bg-white/90 backdrop-blur-sm text-[#0B1424]/60 hover:text-[#0B1424]"
            }`}
          >
            {isInCompare ? <Check className="w-3 h-3" /> : <GitCompare className="w-3 h-3" />}
            {isInCompare ? t("actions.compared") : t("actions.compare")}
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-1.5 flex-grow">
          {/* Title + flag */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[17px] font-medium text-[#0B1424] tracking-tight leading-snug line-clamp-1">
              {listing.year} {listing.make} {listing.model}
            </h3>
            {flag && <span className="text-lg leading-none flex-shrink-0">{flag}</span>}
          </div>

          {/* Meta row */}
          <p className="text-[13px] text-[#0B1424]/55 flex items-center gap-1.5 flex-wrap">
            {listing.mileage > 0 && <span>{Number(listing.mileage).toLocaleString()} {t("browse.kmUnit")}</span>}
            {listing.city && <><span>·</span><span>{listing.city}</span></>}
            {listing.spec_origin && <><span>·</span><span>{t(`specOrigin.${listing.spec_origin}`)}</span></>}
          </p>

          {/* ETA for in-transit */}
          {showArrival && listing.estimated_arrival_date && (
            <p className="text-[12px] text-[#0B8470] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t("browse.arrivingDate", { date: new Date(listing.estimated_arrival_date).toLocaleDateString("en-SA", { month: "short", day: "numeric" }) })}
            </p>
          )}

          {/* Price + Reserve */}
          <div className="mt-auto pt-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-[20px] font-medium text-[#0B1424] tracking-tight tabular-nums leading-none">
                {formatSAR(finalPrice) ?? "—"}
              </p>
              {listing.source_price && listing.source_currency && (
                <p className="text-[11px] text-[#0B1424]/40 mt-1">
                  {listing.source_currency.toUpperCase()} {Number(listing.source_price).toLocaleString()}
                </p>
              )}
            </div>
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-[#0B1424]/15 text-[13px] font-medium text-[#0B1424] group-hover:bg-[#0B1424] group-hover:text-white transition-colors">
              {t("browse.reserve")}
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Compare bar
// ---------------------------------------------------------------------------
function CompareBar() {
  const { t } = useTranslation();
  const router = useRouter();
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    setCompareIds(getCompareIds());
    const sync = () => setCompareIds(getCompareIds());
    window.addEventListener("compareUpdated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("compareUpdated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (compareIds.length < 2) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-accent" />
          <span className="font-semibold text-slate-900 text-sm">
            {t("actions.compareSelected", { count: compareIds.length })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={clearCompare} className="text-sm text-slate-500 hover:text-slate-800 font-medium">
            {t("common.clear")}
          </button>
          <button
            onClick={() => router.push(`/compare?ids=${compareIds.join(",")}`)}
            className="px-5 py-2 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            {t("actions.compareNow")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------
interface CarGridFilters {
  make?: string;
  model?: string;
  city?: string;
  fuelType?: string;
  transmission?: string;
  condition?: string;
  bodyType?: string;
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  maxYear?: string;
  minMileage?: string;
  maxMileage?: string;
  sort?: string;
  negotiable?: string;
  warrantyRemaining?: string;
  noAccidents?: string;
  search?: string;
  // Import-specific
  sourceCountry?: string;
  specOrigin?: string;
  importStatus?: string;
  hasSalvageTitle?: string;
  gccSpecs?: string;
}

function buildQueryString(filters: CarGridFilters, page: number, pageSize?: number): string {
  const p = new URLSearchParams();
  // Standard listing params
  if (filters.make)              p.set("make",              filters.make);
  if (filters.model)             p.set("model",             filters.model);
  if (filters.city)              p.set("city",              filters.city);
  if (filters.fuelType)          p.set("fuel_type",         filters.fuelType);
  if (filters.transmission)      p.set("transmission",      filters.transmission);
  if (filters.condition)         p.set("condition",         filters.condition);
  if (filters.bodyType)          p.set("body_type",         filters.bodyType);
  // Price → final_price_sar range
  if (filters.minPrice)          p.set("final_price_sar_min", filters.minPrice);
  if (filters.maxPrice)          p.set("final_price_sar_max", filters.maxPrice);
  if (filters.minYear)           p.set("year_min",          filters.minYear);
  if (filters.maxYear)           p.set("year_max",          filters.maxYear);
  if (filters.minMileage)        p.set("mileage_min",       filters.minMileage);
  if (filters.maxMileage)        p.set("mileage_max",       filters.maxMileage);
  if (filters.sort)              p.set("ordering",          filters.sort);
  if (filters.negotiable === "true")       p.set("negotiable",       "true");
  if (filters.warrantyRemaining === "true") p.set("warranty_remaining","true");
  if (filters.noAccidents === "true")      p.set("accident_history", "false");
  if (filters.search)            p.set("search",            filters.search);
  // Import-specific params
  if (filters.sourceCountry)     p.set("source_country",   filters.sourceCountry);
  if (filters.specOrigin)        p.set("spec_origin",       filters.specOrigin);
  if (filters.importStatus)      p.set("import_status",     filters.importStatus);
  if (filters.hasSalvageTitle === "true") p.set("has_salvage_title", "true");
  if (filters.gccSpecs === "true")        p.set("spec_origin",       "gcc");
  // Pagination
  if (pageSize)                  p.set("page_size",         String(pageSize));
  if (page > 1)                  p.set("page",              String(page));
  return p.toString();
}

// ---------------------------------------------------------------------------
// CarGrid
// ---------------------------------------------------------------------------
interface CarGridProps {
  filters?: CarGridFilters;
  limit?: number;
  onResultCount?: (count: number) => void;
  searchTerm?: string;
}

export default function CarGrid({ filters = {}, limit, onResultCount, searchTerm }: CarGridProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [allListings, setAllListings] = useState<ImportedListing[]>([]);

  // Reset on filter change
  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    setPage(1);
    setAllListings([]);
  }, [filterKey]);

  const queryString = useMemo(
    () => buildQueryString(filters, page, limit),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey, page, limit]
  );

  const { data: listingsPage, isLoading } = useApiQuery<PaginatedResponse<ImportedListing>>(
    `/api/imported-cars/?${queryString}`
  );

  useEffect(() => {
    if (!listingsPage) return;
    const results = Array.isArray(listingsPage) ? listingsPage : (listingsPage.results ?? []);
    const count   = Array.isArray(listingsPage) ? results.length : (listingsPage.count ?? 0);
    if (page === 1) {
      setAllListings(results);
    } else {
      setAllListings((prev) => [...prev, ...results]);
    }
    onResultCount?.(count);
  }, [listingsPage, page, onResultCount]);

  const hasNextPage  = !Array.isArray(listingsPage) && !!listingsPage?.next;
  const displayCars  = limit ? allListings.slice(0, limit) : allListings;

  // Loading skeleton
  if (isLoading && page === 1) {
    return (
      <>
        <div className="pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: limit || 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-200 animate-pulse">
                <div className="aspect-[16/10] bg-slate-100" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-5 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <CompareBar />
      </>
    );
  }

  if (displayCars.length > 0) {
    return (
      <>
        <div className="pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayCars.map((listing) => (
              <ImportedCarCard key={listing.id} listing={listing} />
            ))}
          </div>

          {!limit && hasNextPage && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent-600 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isLoading ? t("browse.loading") : t("browse.loadMore")}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
        <CompareBar />
      </>
    );
  }

  // Empty state
  return (
    <>
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🚗</div>
        {searchTerm ? (
          <>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {t("browse.noCarsMatching", { query: searchTerm })}
            </h3>
            <p className="text-slate-500 text-sm mb-1">
              {t("browse.tryDifferentKeywords")}
            </p>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t("browse.noCarsFound")}</h3>
            <p className="text-slate-500 text-sm">
              {t("browse.noCarsMessage")}
            </p>
          </>
        )}
      </div>
      <CompareBar />
    </>
  );
}
