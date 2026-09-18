"use client";

import Link from "next/link";
import { ShieldCheck, Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { browseSimilarHref } from "@/lib/reservations";

/**
 * The car someone else reserved or bought.
 *
 * Deliberately not an error page: nothing failed, and a red retry would invite
 * the buyer to keep hammering a car they cannot have. It says what happened in
 * one line and offers the next useful thing — the same state the mobile app
 * shows (`ListingUnavailableState`).
 */
export function ListingUnavailable({
  make,
  compact = false,
}: {
  /** Pre-filters "Browse similar cars" when the make is known. */
  make?: string | null;
  /** Inside a card or a panel rather than as a whole page. */
  compact?: boolean;
}) {
  const { t } = useTranslation();

  const body = (
    <div
      className={`text-center ${compact ? "py-8" : "py-20"}`}
      data-testid="listing-unavailable"
    >
      <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-slate-100 flex items-center justify-center">
        <ShieldCheck className="w-7 h-7 text-slate-400" />
      </div>
      <h1
        className={`font-bold text-slate-900 mb-2 ${compact ? "text-lg" : "text-2xl"}`}
      >
        {t("availability.title")}
      </h1>
      <p className="text-slate-500 mb-8">{t("availability.body")}</p>
      <Link
        href={browseSimilarHref(make)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl font-medium transition-colors"
      >
        <Search className="w-4 h-4" />
        {t("availability.browseSimilar")}
      </Link>
    </div>
  );

  if (compact) return body;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{body}</div>
    </div>
  );
}

/** The quiet "Reserved" badge an importer or staff sees on their own locked car. */
export function ReservedBadge({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      data-testid="reserved-badge"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      {t("availability.reserved")}
    </span>
  );
}
