"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark, Trash2, ArrowRight, Loader2, Search, Play,
  ChevronDown, ChevronUp, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import type { SavedSearch, PaginatedResponse, Listing } from "@/lib/types";
import Image from "next/image";

function formatFilterSummary(filters: Record<string, string>): string {
  const parts: string[] = [];
  if (filters.make) parts.push(filters.make);
  if (filters.model) parts.push(filters.model);
  if (filters.condition) parts.push(filters.condition);
  if (filters.city) parts.push(`in ${filters.city}`);
  if (filters.bodyType) parts.push(filters.bodyType);
  if (filters.minPrice && filters.maxPrice)
    parts.push(`SAR ${Number(filters.minPrice).toLocaleString()}–${Number(filters.maxPrice).toLocaleString()}`);
  else if (filters.minPrice)
    parts.push(`from SAR ${Number(filters.minPrice).toLocaleString()}`);
  else if (filters.maxPrice)
    parts.push(`up to SAR ${Number(filters.maxPrice).toLocaleString()}`);
  if (filters.minYear && filters.maxYear) parts.push(`${filters.minYear}–${filters.maxYear}`);
  else if (filters.minYear) parts.push(`from ${filters.minYear}`);
  if (filters.fuelType) parts.push(filters.fuelType);
  if (filters.transmission) parts.push(filters.transmission);
  if (filters.negotiable === "true") parts.push("Negotiable");
  if (filters.noAccidents === "true") parts.push("No accidents");
  if (filters.search) parts.push(`"${filters.search}"`);
  return parts.join(" · ") || "All cars";
}

function filtersToQueryString(filters: Record<string, string>): string {
  const params = new URLSearchParams();
  if (filters.make) params.set("make", filters.make);
  if (filters.model) params.set("model", filters.model);
  if (filters.city) params.set("city", filters.city);
  if (filters.fuelType) params.set("fuelType", filters.fuelType);
  if (filters.transmission) params.set("transmission", filters.transmission);
  if (filters.condition) params.set("condition", filters.condition);
  if (filters.bodyType) params.set("bodyType", filters.bodyType);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.minYear) params.set("minYear", filters.minYear);
  if (filters.maxYear) params.set("maxYear", filters.maxYear);
  if (filters.minMileage) params.set("minMileage", filters.minMileage);
  if (filters.maxMileage) params.set("maxMileage", filters.maxMileage);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.negotiable) params.set("negotiable", filters.negotiable);
  if (filters.warrantyRemaining) params.set("warrantyRemaining", filters.warrantyRemaining);
  if (filters.noAccidents) params.set("noAccidents", filters.noAccidents);
  if (filters.search) params.set("search", filters.search);
  return params.toString();
}

// ---------------------------------------------------------------------------
// Results preview panel
// ---------------------------------------------------------------------------
function SavedSearchResults({
  searchId,
  onClose,
}: {
  searchId: number;
  onClose: () => void;
}) {
  const { data, isLoading } = useApiQuery<PaginatedResponse<Listing>>(
    `/api/saved-searches/${searchId}/results/?page_size=6`
  );
  const listings = data?.results ?? [];

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700">
          {isLoading ? "Loading..." : `${data?.count ?? 0} results`}
        </span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : listings.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">No listings found for this search.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {listings.map((listing) => {
            const primary = listing.images?.find((i) => i.is_primary) ?? listing.images?.[0];
            return (
              <Link key={listing.id} href={`/car/${listing.id}`} className="group">
                <div className="rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                  <div className="relative aspect-[16/10] bg-slate-100">
                    <Image
                      src={listing.primary_image || primary?.image_url || getImageUrl(primary?.image)}
                      alt={`${listing.year} ${listing.make} ${listing.model}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                      {listing.year} {listing.make} {listing.model}
                    </p>
                    <p className="text-xs text-accent font-bold mt-0.5">
                      {new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(listing.price)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single search card
// ---------------------------------------------------------------------------
function SavedSearchCard({
  search,
  onDelete,
}: {
  search: SavedSearch;
  onDelete: (id: number) => void;
}) {
  const router = useRouter();
  const [showResults, setShowResults] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this saved search?")) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/saved-searches/${search.id}/`);
      onDelete(search.id);
    } catch {
      setIsDeleting(false);
    }
  };

  const handleRunSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    const qs = filtersToQueryString(search.filters);
    router.push(`/browse?${qs}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bookmark className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{search.name}</h3>
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
              {formatFilterSummary(search.filters)}
            </p>
            {search.results_count !== undefined && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full">
                {search.results_count} {search.results_count === 1 ? "result" : "results"}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
          aria-label="Delete search"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={handleRunSearch}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          Run Search
        </button>
        <button
          onClick={() => setShowResults((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-accent text-slate-600 hover:text-accent rounded-lg text-sm font-medium transition-colors"
        >
          {showResults ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Preview
        </button>
      </div>

      {showResults && (
        <SavedSearchResults searchId={search.id} onClose={() => setShowResults(false)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SavedSearchesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data, isLoading } = useApiQuery<PaginatedResponse<SavedSearch>>(
    "/api/saved-searches/",
    { enabled: isAuthenticated }
  );

  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());

  const handleDelete = useCallback((id: number) => {
    setDeletedIds((prev) => new Set(prev).add(id));
  }, []);

  const searches = (data?.results ?? []).filter((s) => !deletedIds.has(s.id));

  if (authLoading || (isLoading && isAuthenticated)) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <Bookmark className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Sign in to see your saved searches</h2>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Saved Searches</h1>
            <p className="text-slate-500">
              {searches.length > 0
                ? `${searches.length} saved search${searches.length !== 1 ? "es" : ""}`
                : "Save searches to get notified of new matches"}
            </p>
          </div>
          <Link
            href="/browse"
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Browse Cars</span>
          </Link>
        </div>

        {/* List */}
        {searches.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <Bookmark className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">No saved searches yet</h2>
            <p className="text-slate-500 mb-6 max-w-xs mx-auto">
              Apply filters on the browse page, then click "Save Search" to save them here.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors"
            >
              Start Browsing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {searches.map((search) => (
              <SavedSearchCard key={search.id} search={search} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
