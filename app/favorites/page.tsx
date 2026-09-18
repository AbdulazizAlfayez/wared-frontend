"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { Listing, PaginatedResponse } from "@/lib/types";
import CarCard from "@/components/CarCard";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toggleFavorite } from "@/lib/favorites";
import { isReservedForOthers, RESERVATIONS_CHANGED_EVENT } from "@/lib/reservations";

export default function FavoritesPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const { data, isLoading, refetch } = useApiQuery<PaginatedResponse<Listing>>(
    "/api/favorites/",
    { enabled: isAuthenticated }
  );

  // The backend returns bare Listing objects (not wrapped in {id, listing})
  const favorites: Listing[] = data?.results ?? [];

  // Track removed IDs optimistically so the UI updates instantly
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());

  const handleUnfavorite = useCallback(
    (listingId: number) => {
      setRemovedIds((prev) => new Set(prev).add(listingId));
      toggleFavorite(String(listingId));
    },
    []
  );

  /*
   * Saved cars this page has already shown, by id.
   *
   * The favourites endpoint applies the same visibility rules as browse: the
   * moment another buyer reserves a saved car, it stops coming back at all
   * (verified against the API — the row disappears, it does not arrive with a
   * flag). Keeping the last copy means Saved can grey the row out instead of
   * losing it silently, which is what the mobile app does.
   */
  const [seenRows, setSeenRows] = useState<Record<number, Listing>>({});
  useEffect(() => {
    if (favorites.length === 0) return;
    setSeenRows((prev) => {
      const next = { ...prev };
      for (const listing of favorites) next[listing.id] = listing;
      return next;
    });
  }, [favorites]);

  const presentIds = new Set(favorites.map((listing) => listing.id));
  const vanished = Object.values(seenRows).filter(
    (listing) => !presentIds.has(listing.id) && !removedIds.has(listing.id)
  );

  const displayedFavorites = [...favorites, ...vanished].filter(
    (listing) => !removedIds.has(listing.id)
  );

  /** Gone for this viewer: dropped by the server, reserved elsewhere, or sold. */
  const isUnavailable = useCallback(
    (listing: Listing) =>
      !presentIds.has(listing.id) ||
      isReservedForOthers(listing, user) ||
      listing.import_status === "sold",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, favorites]
  );

  // A reservation made or cancelled in this tab can change these rows.
  useEffect(() => {
    const onChange = () => refetch();
    window.addEventListener(RESERVATIONS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(RESERVATIONS_CHANGED_EVENT, onChange);
  }, [refetch]);

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
              <Heart className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Sign in to see your favorites</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Create an account or sign in to save cars you like.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            My Favorites
          </h1>
          <p className="text-slate-500">
            {displayedFavorites.length > 0
              ? `${displayedFavorites.length} car${displayedFavorites.length === 1 ? "" : "s"} saved`
              : "Cars you've saved for later"}
          </p>
        </div>

        {/* Content */}
        {displayedFavorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">No favorites yet</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Browse our collection and tap the heart icon on cars you like to save them here.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors"
            >
              <span>Browse Cars</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedFavorites.map((listing) => (
              <CarCard
                key={listing.id}
                listing={listing}
                unavailable={isUnavailable(listing)}
                onFavoriteToggle={(_id, isFav) => { if (!isFav) handleUnfavorite(listing.id); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
