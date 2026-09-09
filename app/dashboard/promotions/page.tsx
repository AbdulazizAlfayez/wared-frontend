"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import type { PaginatedResponse, ListingPromotion } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";
import {
  Zap, Loader2, Calendar, Clock, ExternalLink, XCircle, CheckCircle,
  TrendingUp, Star,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROMO_TYPE_LABELS: Record<string, string> = {
  featured: "Featured", highlighted: "Highlighted",
  top_search: "Top Search", homepage: "Homepage",
};

const PROMO_TYPE_COLORS: Record<string, string> = {
  featured:    "text-amber-600 bg-amber-50",
  highlighted: "text-orange-600 bg-orange-50",
  top_search:  "text-purple-600 bg-purple-50",
  homepage:    "text-green-600 bg-green-50",
};

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-SA", { year: "numeric", month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PromotionsPage() {
  const { isAuthenticated } = useAuth();
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState("");

  const { data: activeData, isLoading: activeLoading, refetch: refetchActive } =
    useApiQuery<PaginatedResponse<ListingPromotion> | ListingPromotion[]>(
      "/api/my-promotions/?status=active",
      { enabled: isAuthenticated }
    );

  const { data: pastData, isLoading: pastLoading } =
    useApiQuery<PaginatedResponse<ListingPromotion> | ListingPromotion[]>(
      "/api/my-promotions/?status=expired",
      { enabled: isAuthenticated }
    );

  const activePromos: ListingPromotion[] = Array.isArray(activeData)
    ? activeData
    : (activeData as PaginatedResponse<ListingPromotion>)?.results ?? [];

  const pastPromos: ListingPromotion[] = Array.isArray(pastData)
    ? pastData
    : (pastData as PaginatedResponse<ListingPromotion>)?.results ?? [];

  const handleCancel = async (promo: ListingPromotion) => {
    if (!confirm("Cancel this promotion?")) return;
    setCancelling(promo.id);
    setCancelError("");
    try {
      await api.post(`/api/listings/${promo.listing}/promote/cancel/`, {});
      refetchActive();
    } catch {
      setCancelError("Failed to cancel promotion. Please try again.");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-accent" />
            My Promotions
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your active and past listing promotions</p>
        </div>
        <Link
          href="/dashboard/listings"
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Zap className="w-4 h-4" />
          Boost a Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Active</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {activeLoading ? <Loader2 className="w-6 h-6 animate-spin text-accent" /> : activePromos.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-sm font-medium text-slate-600">Past</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {pastLoading ? <Loader2 className="w-6 h-6 animate-spin text-accent" /> : pastPromos.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Next Expiry</span>
          </div>
          <div className="text-sm font-semibold text-slate-800">
            {activePromos.length === 0 ? (
              <span className="text-slate-400 font-normal">—</span>
            ) : (
              formatDate(
                activePromos.reduce((min, p) => p.expires_at < min ? p.expires_at : min, activePromos[0].expires_at)
              )
            )}
          </div>
        </div>
      </div>

      {cancelError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {cancelError}
        </div>
      )}

      {/* Active Promotions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-slate-900">Active Promotions</h2>
        </div>

        {activeLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-accent" />
          </div>
        ) : activePromos.length === 0 ? (
          <div className="py-12 text-center">
            <Zap className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No active promotions.</p>
            <Link href="/dashboard/listings" className="mt-2 inline-block text-accent text-sm hover:underline">
              Boost a listing →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase">
                  <th className="px-5 py-3 text-left">Listing</th>
                  <th className="px-5 py-3 text-left">Package</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Expires</th>
                  <th className="px-5 py-3 text-right hidden sm:table-cell">Days Left</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activePromos.map(promo => (
                  <tr key={promo.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/car/${promo.listing}`}
                        className="flex items-center gap-1.5 text-accent hover:underline font-medium text-sm"
                      >
                        Listing #{promo.listing}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{promo.package.name}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PROMO_TYPE_COLORS[promo.package.promotion_type] ?? "bg-slate-100 text-slate-600"}`}>
                        {PROMO_TYPE_LABELS[promo.package.promotion_type] ?? promo.package.promotion_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(promo.expires_at)}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right hidden sm:table-cell">
                      <span className={`font-semibold ${promo.days_remaining <= 3 ? "text-red-600" : "text-green-600"}`}>
                        {promo.days_remaining}d
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleCancel(promo)}
                        disabled={cancelling === promo.id}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors disabled:opacity-50 ml-auto"
                      >
                        {cancelling === promo.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <XCircle className="w-3.5 h-3.5" />
                        }
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Past Promotions */}
      {(pastPromos.length > 0 || pastLoading) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Past Promotions</h2>
          </div>

          {pastLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase">
                    <th className="px-5 py-3 text-left">Listing</th>
                    <th className="px-5 py-3 text-left">Package</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left hidden sm:table-cell">Started</th>
                    <th className="px-5 py-3 text-left hidden sm:table-cell">Expired</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pastPromos.map(promo => (
                    <tr key={promo.id} className="hover:bg-slate-50/50 transition-colors opacity-75">
                      <td className="px-5 py-3">
                        <Link
                          href={`/car/${promo.listing}`}
                          className="flex items-center gap-1.5 text-accent hover:underline font-medium text-sm"
                        >
                          Listing #{promo.listing}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{promo.package.name}</td>
                      <td className="px-5 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          {PROMO_TYPE_LABELS[promo.package.promotion_type] ?? promo.package.promotion_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 hidden sm:table-cell">{formatDate(promo.starts_at)}</td>
                      <td className="px-5 py-3 text-slate-400 hidden sm:table-cell">{formatDate(promo.expires_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
