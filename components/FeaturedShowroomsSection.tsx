"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Star, BadgeCheck, Loader2 } from "lucide-react";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { PaginatedResponse } from "@/lib/types";

interface ShowroomPreview {
  id: number;
  name: string;
  city: string;
  logo: string | null;
  cover_photo: string | null;
  is_verified: boolean;
  average_rating: number;
  total_reviews: number;
  active_listings: number;
  specializations: string[];
}

export default function FeaturedShowroomsSection() {
  const { data, isLoading } = useApiQuery<PaginatedResponse<ShowroomPreview>>(
    "/api/showrooms/?is_verified=true&page_size=4"
  );

  const showrooms = data?.results ?? [];

  if (isLoading) {
    return (
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </section>
    );
  }

  if (!showrooms.length) return null;

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-accent font-semibold text-sm mb-1 uppercase tracking-wide">
              Verified Dealers
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Featured Showrooms
            </h2>
            <p className="text-slate-500 mt-2">
              Explore top-rated dealerships across Saudi Arabia
            </p>
          </div>
          <Link
            href="/showrooms"
            className="hidden sm:inline-flex items-center gap-2 text-accent hover:text-accent-600 font-medium transition-colors"
          >
            View all showrooms
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {showrooms.map((showroom) => (
            <Link
              key={showroom.id}
              href={`/showrooms/${showroom.id}`}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Cover */}
              <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                {showroom.cover_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={showroom.cover_photo}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-slate-300 select-none">
                      {showroom.name.charAt(0)}
                    </span>
                  </div>
                )}
                {showroom.is_verified && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[10px] font-semibold text-accent">Verified</span>
                  </div>
                )}
              </div>

              {/* Logo + Info */}
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {showroom.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={showroom.logo}
                      alt={showroom.name}
                      className="w-10 h-10 rounded-xl object-contain border border-slate-100 bg-white flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-accent">
                        {showroom.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate text-sm">
                      {showroom.name}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {showroom.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-semibold text-slate-700">
                      {Number(showroom.average_rating) > 0
                        ? Number(showroom.average_rating).toFixed(1)
                        : "New"}
                    </span>
                    {showroom.total_reviews > 0 && (
                      <span className="text-slate-400">({showroom.total_reviews})</span>
                    )}
                  </div>
                  <span className="text-slate-500">
                    {showroom.active_listings} listings
                  </span>
                </div>

                {showroom.specializations?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {showroom.specializations.slice(0, 2).map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded text-[10px] font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/showrooms"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors text-sm"
          >
            View all showrooms
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
