"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, ChevronRight, Gauge, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import type { RecentlyViewedItem, PaginatedResponse } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function RecentlyViewedSection() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get<PaginatedResponse<RecentlyViewedItem>>("/api/recently-viewed/?page_size=6")
      .then((data) => {
        setItems(data.results ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [isAuthenticated]);

  if (!isAuthenticated || !loaded || items.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-slate-900">Recently Viewed</h2>
          </div>
          <Link
            href="/browse"
            className="flex items-center gap-1 text-sm text-accent hover:text-accent-600 font-medium"
          >
            Browse all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {items.map(({ id, listing, viewed_at }) => {
            const primary = listing.images?.find((i) => i.is_primary) ?? listing.images?.[0];
            const imageUrl = listing.primary_image || primary?.image_url || getImageUrl(primary?.image);
            return (
              <Link
                key={id}
                href={`/car/${listing.id}`}
                className="flex-none w-56 snap-start group"
              >
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-all hover:border-accent/30">
                  <div className="relative aspect-[16/10] bg-slate-100">
                    <Image
                      src={imageUrl}
                      alt={`${listing.year} ${listing.make} ${listing.model}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        listing.condition === "new" ? "bg-green-500 text-white" : "bg-slate-700 text-white"
                      }`}>
                        {listing.condition === "new" ? "New" : "Used"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-slate-900 text-sm line-clamp-1">
                      {listing.year} {listing.make} {listing.model}
                    </p>
                    <p className="text-accent font-bold text-sm mt-0.5">
                      {new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(listing.price)}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {listing.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        {new Intl.NumberFormat("en-SA").format(listing.mileage)} km
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{timeAgo(viewed_at)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
