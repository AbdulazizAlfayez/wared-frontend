"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Globe, Loader2, MapPin, RefreshCw } from "lucide-react";
import { useApiQuery } from "@/lib/hooks/use-api";
import { useTranslation } from "@/lib/i18n";
import CarGrid from "@/components/CarGrid";
import CountryCardGrid from "@/components/CountryCardGrid";
import type { ByCountryResponse } from "@/types/source-country";

// Lazy load the map (it's heavy + SSR-incompatible)
const WorldMap = dynamic(() => import("@/components/WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[2/1] max-w-5xl mx-auto bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center">
      <Globe className="w-10 h-10 text-slate-300" />
    </div>
  ),
});

function MapPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();

  const selectedCode = searchParams.get("country");

  const { data, isLoading, error, refetch } = useApiQuery<ByCountryResponse>(
    "/api/imported-cars/by-country/"
  );

  const selectedCountry = data?.countries.find((c) => c.code === selectedCode);

  function handleCountrySelect(code: string) {
    router.push(`/browse/map?country=${code}`, { scroll: false });
    setTimeout(() => {
      document
        .getElementById("country-cars")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-8 bg-slate-100 rounded w-80 mx-auto mb-3 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-60 mx-auto animate-pulse" />
          </div>
          <div className="hidden md:block mb-12">
            <div className="aspect-[2/1] max-w-5xl mx-auto bg-slate-100 rounded-2xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded w-full mt-3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-16">
        <div className="max-w-md mx-auto text-center py-20">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            {error?.message ?? "Failed to load map data"}
          </h2>
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A0A0A] text-white rounded-xl font-medium text-sm mt-4"
          >
            <RefreshCw className="w-4 h-4" /> {t("common.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {t("map.title")}
          </h1>
          <p className="text-slate-500 mt-2">{t("map.subtitle")}</p>
          <p className="text-sm text-slate-400 mt-1">
            {t("map.totalStats")
              .replace("{count}", String(data.total_cars_globally))
              .replace("{countries}", String(data.total_countries))}
          </p>
        </div>

        {/* World map — desktop only */}
        <div className="hidden md:block mb-12">
          <WorldMap
            countries={data.countries}
            selectedCode={selectedCode}
            onCountryClick={handleCountrySelect}
          />
        </div>

        {/* Country card grid — always visible */}
        <div className="mb-12">
          <CountryCardGrid
            countries={data.countries}
            selectedCode={selectedCode}
            onCountryClick={handleCountrySelect}
          />
        </div>

        {/* Selected country car grid */}
        {selectedCode && selectedCountry && (
          <section id="country-cars" className="scroll-mt-24">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  <span className="mr-2">{selectedCountry.flag_emoji}</span>
                  {t("map.carsFromCountry").replace(
                    "{country}",
                    locale === "ar"
                      ? selectedCountry.name_ar
                      : selectedCountry.name_en
                  )}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedCountry.available_cars} {t("map.available")}
                </p>
              </div>
              <Link
                href={`/browse?source_country=${selectedCode}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A0A0A] text-white rounded-xl font-medium text-sm hover:bg-black transition-colors"
              >
                {t("map.viewAllFrom").replace(
                  "{country}",
                  locale === "ar"
                    ? selectedCountry.name_ar
                    : selectedCountry.name_en
                )}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <CarGrid
              filters={{ sourceCountry: selectedCode }}
              limit={6}
            />
          </section>
        )}
      </div>
    </div>
  );
}

export function MapPageClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAF8] pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <MapPageInner />
    </Suspense>
  );
}
