"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Gauge, MapPin, Car as CarIcon, ArrowUpRight } from "lucide-react";
import PromotionBadge from "@/components/PromotionBadge";
import VerificationBadge from "@/components/VerificationBadge";
import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import type { Listing } from "@/lib/types";

interface CarCardProps {
  listing: Listing;
  favoriteId?: number;
  onFavoriteToggle?: (listingId: number, isFav: boolean, favoriteId?: number) => void;
}

// Import status config
const importStatusConfig: Record<string, { label: string; cls: string }> = {
  available:  { label: "Available",   cls: "bg-white/90 text-slate-900 border border-slate-200" },
  arriving:   { label: "Arriving",    cls: "bg-white/90 text-slate-900 border border-slate-200" },
  in_transit: { label: "In Transit",  cls: "bg-violet-500/90 text-white" },
  customs:    { label: "At Customs",  cls: "bg-amber-500/90 text-white" },
  reserved:   { label: "Reserved",    cls: "bg-orange-500/90 text-white" },
  sourcing:   { label: "Sourcing",    cls: "bg-slate-500/90 text-white" },
  purchased:  { label: "Purchased",   cls: "bg-blue-500/90 text-white" },
  arrived:    { label: "Arrived",     cls: "bg-white/90 text-slate-900 border border-slate-200" },
};

// Fuel type to short label
const fuelShort: Record<string, string> = {
  petrol: "Petrol", gasoline: "Petrol", diesel: "Diesel",
  hybrid: "Hybrid", electric: "EV", "plug-in hybrid": "PHEV",
};

export default function CarCard({ listing, favoriteId, onFavoriteToggle }: CarCardProps) {
  const { isAuthenticated } = useAuth();
  const [isFav, setIsFav] = useState(favoriteId !== undefined);
  const [currentFavoriteId, setCurrentFavoriteId] = useState<number | undefined>(favoriteId);
  const [isToggling, setIsToggling] = useState(false);

  // Guard: if listing is somehow undefined/null, render nothing
  if (!listing) return null;

  const primaryImage = listing.images?.find((img) => img.is_primary) ?? listing.images?.[0];
  const imageUrl =
    listing.primary_image ||
    primaryImage?.image_url ||
    (primaryImage?.image ? getImageUrl(primaryImage.image) : null);

  // Import-specific fields (typed as any since they're extended fields)
  const ls = listing as any;
  const importStatus = ls.import_status as string | undefined;
  const sourceCountry = ls.source_country as string | undefined;
  const finalPriceSar = ls.final_price_sar ? Number(ls.final_price_sar) : null;
  const displayPrice = finalPriceSar ?? listing.price;

  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated || isToggling) return;
      setIsToggling(true);
      try {
        if (isFav && currentFavoriteId !== undefined) {
          await api.delete(`/api/favorites/${currentFavoriteId}/`);
          setIsFav(false);
          setCurrentFavoriteId(undefined);
          onFavoriteToggle?.(listing.id, false, currentFavoriteId);
        } else {
          const result = await api.post<{ id: number }>("/api/favorites/", { listing: listing.id });
          setIsFav(true);
          setCurrentFavoriteId(result.id);
          onFavoriteToggle?.(listing.id, true, result.id);
        }
      } catch { /* non-critical */ }
      finally { setIsToggling(false); }
    },
    [isAuthenticated, isToggling, isFav, currentFavoriteId, listing.id, onFavoriteToggle]
  );

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(price);

  const formatMileage = (mileage: number) =>
    new Intl.NumberFormat("en-SA").format(mileage) + " km";

  const statusInfo = importStatus ? importStatusConfig[importStatus] : null;

  return (
    <Link href={`/car/${listing.id}`} className="group block h-full">
      <article
        className={`relative h-full flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ease-spring
          bg-white border
          ${listing.is_highlighted
            ? "border-gold/40 shadow-gold"
            : "border-slate-100 shadow-card hover:shadow-card-hover"
          }
          hover:-translate-y-1.5
        `}
      >
        {/* ── Image area ── */}
        <div className="relative aspect-[16/10] overflow-hidden flex-shrink-0 bg-slate-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${listing.year} ${listing.make} ${listing.model}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 gap-2">
              <CarIcon className="w-10 h-10 text-slate-300" />
              <span className="text-xs text-slate-400 font-medium tracking-wide">No Photo</span>
            </div>
          )}

          {/* Bottom gradient for text legibility */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          {/* Top-left: condition */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide backdrop-blur-sm shadow-sm
              ${listing.condition === "new"
                ? "bg-emerald-500 text-white"
                : "bg-ink-900/75 text-white border border-white/10"
              }`}>
              {listing.condition === "new" ? "NEW" : "USED"}
            </span>
            {listing.is_promoted && (
              <div className="rounded-lg overflow-hidden shadow-sm">
                <PromotionBadge listing={listing} />
              </div>
            )}
          </div>

          {/* Top-right: source country */}
          {sourceCountry && (
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold backdrop-blur-sm bg-ink-900/75 text-white border border-white/10 shadow-sm">
                {sourceCountry}
              </span>
            </div>
          )}

          {/* Bottom-left: import status */}
          {statusInfo && (
            <div className="absolute bottom-3 left-3 z-10">
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider backdrop-blur-sm shadow-sm uppercase ${statusInfo.cls}`}>
                {statusInfo.label}
              </span>
            </div>
          )}

          {/* Bottom-right: favorite */}
          {isAuthenticated && (
            <button
              onClick={handleToggleFavorite}
              aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
              disabled={isToggling}
              className={`absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center
                transition-all duration-200 shadow-sm
                ${isFav
                  ? "bg-red-500 text-white hover:bg-red-600 scale-100"
                  : "bg-white/85 text-slate-500 hover:bg-white hover:text-red-500 hover:scale-110 backdrop-blur-sm"
                }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
            </button>
          )}
        </div>

        {/* ── Content area ── */}
        <div className="flex flex-col flex-grow p-4 gap-3">

          {/* Car name + verification */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-ink-900 text-[15px] leading-snug tracking-tight flex items-center gap-1.5 min-w-0">
              <span className="truncate">{listing.year} {listing.make} {listing.model}</span>
              {listing.owner_verification_level &&
                ['identity', 'business', 'full'].includes(listing.owner_verification_level) && (
                <VerificationBadge level={listing.owner_verification_level} size="sm" />
              )}
            </h3>
            {/* Arrow icon — appears on hover */}
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 flex-shrink-0 mt-0.5" />
          </div>

          {/* Price — hero element */}
          <div className="flex items-baseline gap-2">
            <span className="price-display text-[22px] text-[#0a0a0a] leading-none">
              {formatPrice(displayPrice)}
            </span>
            {finalPriceSar && listing.price && finalPriceSar !== listing.price && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(listing.price)}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="section-divider" />

          {/* Specs chips */}
          <div className="flex flex-wrap gap-2">
            {listing.mileage != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-[12px] font-medium border border-slate-100">
                <Gauge className="w-3 h-3 text-slate-400" />
                {formatMileage(listing.mileage)}
              </span>
            )}
            {listing.fuel_type && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-[12px] font-medium border border-slate-100">
                {fuelShort[listing.fuel_type.toLowerCase()] ?? listing.fuel_type}
              </span>
            )}
            {listing.transmission && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-[12px] font-medium border border-slate-100">
                {listing.transmission === "Automatic" ? "Auto" : listing.transmission}
              </span>
            )}
            {listing.city && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-[12px] font-medium border border-slate-100">
                <MapPin className="w-3 h-3 text-slate-400" />
                {listing.city}
              </span>
            )}
          </div>
        </div>

        {/* Gold shimmer for highlighted listings */}
        {listing.is_highlighted && (
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300" />
        )}
      </article>
    </Link>
  );
}
