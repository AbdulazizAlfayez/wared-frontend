"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Review, PaginatedResponse } from "@/lib/types";
import StarRating from "@/components/StarRating";
import ReviewCard from "@/components/ReviewCard";

interface ReviewsSectionProps {
  endpoint: string;
  averageRating?: number | string;
  totalReviews?: number;
  title?: string;
  emptyMessage?: string;
}

function ReviewSkeleton() {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-100 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-slate-200" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-slate-200 rounded" />
          <div className="h-2 w-20 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-slate-100 rounded" />
        <div className="h-3 w-3/4 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

export default function ReviewsSection({
  endpoint,
  averageRating,
  totalReviews,
  title = "Reviews",
  emptyMessage = "No reviews yet.",
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avg, setAvg] = useState<number>(Number(averageRating ?? 0));
  const [total, setTotal] = useState<number>(totalReviews ?? 0);

  useEffect(() => {
    setLoading(true);
    api
      .get<Review[] | PaginatedResponse<Review>>(endpoint)
      .then((res) => {
        const items = Array.isArray(res) ? res : (res as PaginatedResponse<Review>).results ?? [];
        setReviews(items);
        if (items.length > 0 && !averageRating) {
          const computed = items.reduce((sum, r) => sum + r.rating, 0) / items.length;
          setAvg(Math.round(computed * 10) / 10);
          setTotal(items.length);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  // Keep props in sync if they change (e.g., parent data updates)
  useEffect(() => {
    if (averageRating !== undefined) setAvg(Number(averageRating));
  }, [averageRating]);

  useEffect(() => {
    if (totalReviews !== undefined) setTotal(totalReviews);
  }, [totalReviews]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {(avg > 0 || total > 0) && (
          <div className="flex items-center gap-2">
            <StarRating rating={avg} size="sm" />
            <span className="text-sm font-semibold text-slate-700">
              {avg > 0 ? avg.toFixed(1) : "—"}
            </span>
            {total > 0 && (
              <span className="text-xs text-slate-400">({total})</span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          <ReviewSkeleton />
          <ReviewSkeleton />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
