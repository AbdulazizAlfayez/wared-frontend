"use client";

export const dynamic = "force-dynamic";

/**
 * The buyer behind a deal, for the importer selling to them.
 *
 * Not a public profile: `GET /api/users/{id}/public/` answers only to an
 * importer who shares a reservation, an order or a conversation with this
 * buyer, and to staff. Everyone else gets 403, which this page shows as
 * "not yours to see" rather than as an error, because it is a rule and not a
 * failure.
 *
 * There are deliberately no contact details on it. The server does not send
 * any, and the platform's contact rule is the balance payment — chat until
 * then.
 */

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  ShoppingBag,
  Star,
} from "lucide-react";

import { useApiQuery } from "@/lib/hooks/use-api";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import type { BuyerPublicProfile } from "@/lib/types";

function initialsOf(name: string | null): string {
  const parts = (name ?? "").split(" ").filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function BuyerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { dir } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data, error, isLoading } = useApiQuery<BuyerPublicProfile>(
    `/api/users/${id}/public/`,
    { enabled: Boolean(id) && isAuthenticated }
  );

  if (authLoading || (isLoading && isAuthenticated)) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated || error) {
    // 403 is the expected answer for anyone not dealing with this buyer, so it
    // is phrased as a boundary rather than as something having gone wrong.
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12" dir={dir}>
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-slate-100 flex items-center justify-center">
            <Lock className="w-7 h-7 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            This profile is private
          </h1>
          <p className="text-slate-500 mb-8 text-sm">
            You can see a buyer&apos;s profile once you share a reservation, an order
            or a conversation with them.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-block px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const memberSince = data.member_since
    ? new Date(data.member_since).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12" dir={dir}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-accent mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
          <div className="flex items-start gap-4">
            {data.avatar_url ? (
              <Image
                src={data.avatar_url}
                alt=""
                width={72}
                height={72}
                className="rounded-full object-cover bg-slate-100"
                unoptimized
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-500">
                {initialsOf(data.full_name)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 break-words">
                {data.full_name ?? data.first_name ?? "Buyer"}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
                {data.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {data.city}
                  </span>
                )}
                {memberSince && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Member since {memberSince}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Completed orders
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {data.completed_orders_count}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Deals this buyer saw all the way through.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Reviews received
              </p>
            </div>
            {data.reviews_received ? (
              <>
                <p className="text-2xl font-bold text-slate-900">
                  {data.reviews_received.avg?.toFixed(1) ?? "—"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {data.reviews_received.count} review
                  {data.reviews_received.count === 1 ? "" : "s"}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-300">—</p>
                <p className="text-xs text-slate-500 mt-1">
                  WARED does not rate buyers.
                </p>
              </>
            )}
          </div>
        </div>

        {data.reviews_received?.items?.length ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              What importers said
            </h2>
            <ul className="space-y-4">
              {data.reviews_received.items.map((review) => (
                <li key={review.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{review.rating}/5</span>
                    <span className="text-slate-700">{review.title}</span>
                  </div>
                  <p className="text-slate-500 mt-0.5">{review.comment}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Link
          href="/messages"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold"
        >
          <MessageSquare className="w-4 h-4" />
          Message
        </Link>
        <p className="text-xs text-slate-400 mt-3">
          Phone and email stay hidden until the balance is paid — the deal runs
          through WARED until then.
        </p>
      </div>
    </div>
  );
}
