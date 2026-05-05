"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import CarFilters from "@/components/CarFilters";
import CarGrid from "@/components/CarGrid";
import { Loader2, Search, X, BookmarkPlus, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { AutocompleteResult } from "@/lib/types";

// ---------------------------------------------------------------------------
// Live Search Bar
// ---------------------------------------------------------------------------
function LiveSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query,       setQuery]       = useState(searchParams.get("search") || "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const lastPushedRef  = useRef<string>(searchParams.get("search") || "");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pushSearch = useCallback(
    (value: string) => {
      if (value === lastPushedRef.current) return;
      lastPushedRef.current = value;
      const current = new URLSearchParams(searchParams.toString());
      if (value) current.set("search", value);
      else current.delete("search");
      router.replace(`/browse?${current.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length === 0) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsSearching(false);
      pushSearch("");
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      pushSearch(value);

      if (value.length >= 2) {
        try {
          const results = await api.get<AutocompleteResult[]>(
            `/api/listings/autocomplete/?q=${encodeURIComponent(value)}`
          );
          const seen = new Set<string>();
          const sugs: string[] = [];
          for (const r of results ?? []) {
            if (r.make && !seen.has(r.make)) { seen.add(r.make); sugs.push(r.make); }
            const combo = `${r.make} ${r.model}`;
            if (!seen.has(combo)) { seen.add(combo); sugs.push(combo); }
          }
          setSuggestions(sugs.slice(0, 8));
          setShowDropdown(sugs.length > 0);
        } catch {
          setSuggestions([]);
          setShowDropdown(false);
        }
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }

      setIsSearching(false);
    }, 300);
  };

  const handleSelectSuggestion = (sug: string) => {
    setQuery(sug);
    setSuggestions([]);
    setShowDropdown(false);
    setIsSearching(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushSearch(sug);
  };

  const clearSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    setIsSearching(false);
    pushSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") setShowDropdown(false);
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setIsSearching(false);
      setShowDropdown(false);
      pushSearch(query);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        <Search
          className={`absolute left-3.5 w-4 h-4 transition-colors ${isSearching ? "text-accent" : "text-slate-400"}`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search make, model, keyword…"
          autoComplete="off"
          className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-white text-slate-800 placeholder-slate-400 text-sm transition-colors ${
            isSearching
              ? "border-accent ring-1 ring-accent/20"
              : "border-slate-200 focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
          }`}
        />
        <div className="absolute right-3 flex items-center">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
          ) : query ? (
            <button type="button" onClick={clearSearch} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-xl z-30 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggestions</p>
          </div>
          {suggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => handleSelectSuggestion(sug)}
              className="w-full px-4 py-2.5 text-left hover:bg-accent/5 border-b border-slate-50 last:border-0 flex items-center gap-2.5 group"
            >
              <Search className="w-3.5 h-3.5 text-slate-300 group-hover:text-accent transition-colors" />
              <span className="text-sm text-slate-700 group-hover:text-accent transition-colors">{sug}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Save Search button
// ---------------------------------------------------------------------------
function SaveSearchButton({
  filters,
  searchTerm,
}: {
  filters: Record<string, string | undefined>;
  searchTerm: string;
}) {
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [name,      setName]      = useState("");
  const [isSaving,  setIsSaving]  = useState(false);
  const [saved,     setSaved]     = useState(false);

  const hasFilters = Object.values(filters).some(Boolean) || !!searchTerm;
  if (!isAuthenticated || !hasFilters) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const filterPayload: Record<string, string> = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) filterPayload[k] = v; });
      if (searchTerm) filterPayload.search = searchTerm;
      await api.post("/api/saved-searches/", { name: name.trim(), filters: filterPayload });
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowModal(false); setName(""); }, 2000);
    } catch { /* ignore */ }
    finally { setIsSaving(false); }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:border-accent hover:text-accent text-slate-600 rounded-xl text-sm font-medium transition-colors"
      >
        <BookmarkPlus className="w-4 h-4" />
        <span className="hidden sm:inline">Save Search</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            {saved ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-bold text-slate-900">Search saved!</p>
                <p className="text-sm text-slate-500 mt-1">View it in your saved searches.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Save This Search</h3>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                    <input
                      type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Toyota from Japan under 100k"
                      required autoFocus
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSaving || !name.trim()}
                      className="flex-1 py-2.5 bg-accent hover:bg-accent-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main browse content
// ---------------------------------------------------------------------------
function BrowseContent() {
  const searchParams = useSearchParams();
  const [resultCount, setResultCount] = useState<number | null>(null);

  const search = searchParams.get("search") || undefined;

  const filters = {
    make:             searchParams.get("make")             || undefined,
    model:            searchParams.get("model")            || undefined,
    city:             searchParams.get("city")             || undefined,
    fuelType:         searchParams.get("fuelType")         || undefined,
    transmission:     searchParams.get("transmission")     || undefined,
    condition:        searchParams.get("condition")        || undefined,
    bodyType:         searchParams.get("bodyType")         || undefined,
    minPrice:         searchParams.get("minPrice")         || undefined,
    maxPrice:         searchParams.get("maxPrice")         || undefined,
    minYear:          searchParams.get("minYear")          || undefined,
    maxYear:          searchParams.get("maxYear")          || undefined,
    minMileage:       searchParams.get("minMileage")       || undefined,
    maxMileage:       searchParams.get("maxMileage")       || undefined,
    sort:             searchParams.get("sort")             || undefined,
    negotiable:       searchParams.get("negotiable")       || undefined,
    warrantyRemaining:searchParams.get("warrantyRemaining")|| undefined,
    noAccidents:      searchParams.get("noAccidents")      || undefined,
    // Import-specific
    sourceCountry:    searchParams.get("source_country")   || undefined,
    specOrigin:       searchParams.get("specOrigin")       || undefined,
    importStatus:     searchParams.get("importStatus")     || undefined,
    hasSalvageTitle:  searchParams.get("hasSalvageTitle")  || undefined,
    gccSpecs:         searchParams.get("gccSpecs")         || undefined,
    search,
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">
            Browse Imported Cars
          </h1>
          <p className="text-slate-500 text-sm">
            Verified imports from USA, Japan, UAE, Korea, and Europe — full cost transparency.
          </p>
        </div>

        {/* Search Bar + Save Search */}
        <div className="flex items-center gap-3 mb-4 flex-wrap sm:flex-nowrap">
          <LiveSearchBar />
          <SaveSearchButton filters={filters} searchTerm={search || ""} />
        </div>

        {/* Result summary */}
        <div className="mb-4 min-h-[1.25rem]">
          {resultCount !== null && (
            <p className="text-sm text-slate-500">
              {search ? (
                <>
                  <span className="font-semibold text-slate-700">{resultCount}</span>
                  {` ${resultCount === 1 ? "car" : "cars"} matching `}
                  <span className="font-semibold text-accent">&ldquo;{search}&rdquo;</span>
                  {activeFilterCount > 1 && (
                    <span className="text-slate-400"> · {activeFilterCount - 1} filter{activeFilterCount - 1 !== 1 ? "s" : ""} active</span>
                  )}
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-700">{resultCount}</span>
                  {` imported ${resultCount === 1 ? "car" : "cars"} available`}
                  {activeFilterCount > 0 && (
                    <span className="text-slate-400"> · {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active</span>
                  )}
                </>
              )}
            </p>
          )}
        </div>

        {/* Filters sidebar + Grid */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <CarFilters />
          <div className="flex-1 min-w-0">
            <CarGrid
              filters={filters}
              onResultCount={setResultCount}
              searchTerm={search}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
