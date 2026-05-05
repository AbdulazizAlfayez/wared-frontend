"use client";

import { useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Review } from "@/lib/types";
import StarRating from "@/components/StarRating";

interface ReviewModalProps {
  reviewedUserId: number;
  reviewedUserName: string;
  listingId?: number;
  listingTitle?: string;
  reviewType: "buyer_to_seller" | "seller_to_buyer" | "showroom" | "workshop";
  showroomId?: number;
  workshopId?: number;
  onClose: () => void;
  onSuccess: (review: Review) => void;
}

export default function ReviewModal({
  reviewedUserId,
  reviewedUserName,
  listingId,
  listingTitle,
  reviewType,
  showroomId,
  workshopId,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title for your review.");
      return;
    }
    if (!comment.trim()) {
      setError("Please enter a comment for your review.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        reviewed_user: reviewedUserId,
        review_type: reviewType,
        rating,
        title: title.trim(),
        comment: comment.trim(),
      };
      if (listingId) body.listing = listingId;
      if (showroomId) body.showroom = showroomId;
      if (workshopId) body.workshop = workshopId;

      const review = await api.post<Review>("/api/reviews/", body);
      onSuccess(review);
    } catch (err: unknown) {
      const e = err as Error & { detail?: unknown };
      const detail = e.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (detail && typeof detail === "object") {
        const msgs = Object.values(detail as Record<string, string[]>)
          .flat()
          .join(" ");
        setError(msgs || "Failed to submit review.");
      } else {
        setError(e.message || "Failed to submit review.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Write a Review</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Reviewing <span className="font-medium text-slate-700">{reviewedUserName}</span>
              {listingTitle && (
                <span> &mdash; {listingTitle}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <StarRating rating={rating} size="lg" interactive onChange={setRating} />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              maxLength={100}
              required
              placeholder="Summarize your experience"
              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{title.length}/100</p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 1000))}
              maxLength={1000}
              required
              rows={4}
              placeholder="Share the details of your experience..."
              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{comment.length}/1000</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-medium text-sm transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
