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
const IMPORT_STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  available:         { label: "Available",         cls: "bg-[#f3f4f6] text-[#0a0a0a]"     },
  arriving:          { label: "Arriving Soon",      cls: "bg-[#f3f4f6] text-[#0a0a0a]"     },
  in_transit:        { label: "In Transit",         cls: "bg-[#f3f4f6] text-[#0a0a0a]"     },
  at_port:           { label: "At Port",            cls: "bg-violet-100 text-violet-700"   },
  customs_clearance: { label: "Customs",            cls: "bg-amber-100 text-amber-700"     },
  reserved:          { label: "Reserved",           cls: "bg-orange-100 text-orange-700"   },
  delivered:         { label: "Delivered",          cls: "bg-slate-100 text-slate-600"     },
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

  const statusInfo = listing.import_status
    ? (IMPORT_STATUS_STYLES[listing.import_status] ??
       { label: listing.import_status, cls: "bg-slate-100 text-slate-600" })
    : null;

  const flag = listing.source_country ? (SOURCE_FLAG[listing.source_country] ?? "🌐") : null;
  const finalPrice = listing.final_price_sar ?? listing.price;
  const showArrival =
    listing.estimated_arrival_date &&
    listing.import_status &&
    ["in_transit", "arriving", "at_port"].includes(listing.import_status);

  return (
    <Link href={`/car/${listing.id}`}>
      <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-accent/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 flex-shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${listing.year} ${listing.make} ${listing.model}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <CarIcon className="w-10 h-10 text-slate-300" />
              <span className="text-xs text-slate-400">No Image</span>
            </div>
          )}

          {/* Status badge */}
          {statusInfo && (
            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.cls}`}>
              {statusInfo.label}
            </div>
          )}

          {/* Country flag */}
          {flag && (
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-base">
              {flag}
            </div>
          )}

          {/* Favorite */}
          <button
            onClick={handleFav}
            aria-label={isFav ? "Remove from favorites" : "Save"}
            className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-white/85 shadow flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : "text-slate-500"}`} />
          </button>

          {/* Compare */}
          <button
            onClick={handleCompare}
            aria-label={isInCompare ? "Remove from compare" : "Compare"}
            className={`absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shadow transition-all ${
              isInCompare
                ? "bg-accent text-white"
                : "bg-white/85 text-slate-600 hover:text-accent"
            }`}
          >
            {isInCompare ? <Check className="w-3 h-3" /> : <GitCompare className="w-3 h-3" />}
            {isInCompare ? "Added" : "Compare"}
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-2 flex-grow">
          {/* Title */}
          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
            {listing.year} {listing.make} {listing.model}
          </h3>

          {/* Source country + port */}
          {(listing.source_country || listing.port_of_entry) && (
            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              {listing.source_country && (
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  {flag} FROM {listing.source_country.toUpperCase()}
                </span>
              )}
              {listing.port_of_entry && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />
                    {listing.port_of_entry}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Price section */}
          <div className="mt-auto pt-2 border-t border-slate-100">
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="text-xs text-slate-400 leading-none mb-0.5">Total landed cost</div>
                <div className="text-base font-black text-[#0a0a0a] leading-none">
                  {formatSAR(finalPrice) ?? "—"}
                </div>
              </div>
              {listing.source_price && listing.source_currency && (
                <div className="text-right">
                  <div className="text-xs text-slate-400 leading-none mb-0.5">Source price</div>
                  <div className="text-xs font-semibold text-slate-600 leading-none">
                    {listing.source_currency.toUpperCase()}{" "}
                    {Number(listing.source_price).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mileage + arrival */}
          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            {listing.mileage > 0 && (
              <span className="flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                {Number(listing.mileage).toLocaleString()} km
              </span>
            )}
            {showArrival && listing.estimated_arrival_date && (
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <Clock className="w-3 h-3" />
                ETA{" "}
                {new Date(listing.estimated_arrival_date).toLocaleDateString("en-SA", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
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
            Compare ({compareIds.length}) selected
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={clearCompare} className="text-sm text-slate-500 hover:text-slate-800 font-medium">
            Clear
          </button>
          <button
            onClick={() => router.push(`/compare?ids=${compareIds.join(",")}`)}
            className="px-5 py-2 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Compare Now
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
                {isLoading ? "Loading..." : "Load More"}
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
              No cars found matching &ldquo;{searchTerm}&rdquo;
            </h3>
            <p className="text-slate-500 text-sm mb-1">
              Try different keywords or remove some filters.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No cars found</h3>
            <p className="text-slate-500 text-sm">
              Try adjusting your filters or check back for new imports.
            </p>
          </>
        )}
      </div>
      <CompareBar />
    </>
  );
}
