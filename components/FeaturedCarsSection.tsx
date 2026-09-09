"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { Listing, PaginatedResponse } from "@/lib/types";
import CarCard from "@/components/CarCard";
import { useTranslation } from "@/lib/i18n";

export default function FeaturedCarsSection() {
  const { t, dir } = useTranslation();

  const { data, isLoading } = useApiQuery<PaginatedResponse<Listing>>(
    "/api/listings/?status=approved&ordering=-views_count&page_size=6"
  );

  const featuredListings: Listing[] = data?.results ?? [];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            {t("featured.title")}
          </h2>
          <p className="text-slate-500 text-lg">
            {t("featured.subtitle")}
          </p>
        </div>

        {/* Car Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : featuredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featuredListings.map((listing) => (
              <CarCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 mb-12">
            No featured listings available right now.
          </div>
        )}

        {/* CTA Button */}
        <div className="text-center">
          <Link
            href="/browse"
            className={`inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors ${dir === "rtl" ? "flex-row-reverse" : ""}`}
          >
            <span>{t("featured.browseAll")}</span>
            <ArrowRight className={`w-5 h-5 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </Link>
        </div>
      </div>
    </section>
  );
}
