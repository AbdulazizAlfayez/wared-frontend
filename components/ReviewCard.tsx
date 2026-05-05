"use client";

import { useState } from "react";
import { CheckCircle, Loader2, AlertCircle, Edit, Trash2, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import type { Review } from "@/lib/types";
import StarRating from "@/components/StarRating";

const REVIEW_TYPE_LABELS: Record<string, string> = {
  buyer_to_seller: "Buyer Review",
  seller_to_buyer: "Seller Review",
  showroom:        "Showroom Review",
  workshop:        "Workshop Review",
};

interface ReviewCardProps {
  review: Review;
  showReply?: boolean;
  onReplySuccess?: (review: Review) => void;
  currentUserId?: number;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
}

export default function ReviewCard({
  review,
  showReply = false,
  onReplySuccess,
  currentUserId,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);

  const canReply =
    showReply &&
    currentUserId === review.reviewed_user &&
    !review.reply;

  const isReviewer = currentUserId !== undefined && review.can_edit;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    setReplyError("");
    try {
      const updated = await api.post<Review>(`/api/reviews/${review.id}/reply/`, {
        comment: replyText.trim(),
      });
      setReplyText("");
      setShowReplyForm(false);
      onReplySuccess?.(updated);
    } catch (err: unknown) {
      const e = err as Error & { detail?: unknown };
      const detail = e.detail;
      setReplyError(
        typeof detail === "string"
          ? detail
          : e.message || "Failed to submit reply."
      );
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <span className="w-9 h-9 rounded-full bg-accent/10 text-accent text-sm font-bold flex items-center justify-center flex-shrink-0">
            {review.reviewer_name?.[0]?.toUpperCase() ?? "?"}
          </span>
          <div>
            <p className="font-medium text-slate-900 text-sm leading-tight">
              {review.reviewer_name}
            </p>
            <StarRating rating={review.rating} size="sm" />
          </div>
        </div>

        {/* Top-right: badges + edit/delete */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Review type badge */}
          <span className="hidden sm:inline-block text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            {REVIEW_TYPE_LABELS[review.review_type] ?? review.review_type}
          </span>

          {/* Verified purchase badge */}
          {review.is_verified_purchase && (
            <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          )}

          {/* Status badge (non-approved) */}
          {review.status !== "approved" && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              {review.status === "pending" ? "Pending" : review.status}
            </span>
          )}

          {/* Edit/Delete — only if can_edit and current user is reviewer */}
          {isReviewer && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(review)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-accent transition-colors"
                  title="Edit review"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(review)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete review"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-slate-400 whitespace-nowrap">
            {new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mt-2.5">
        {review.title && (
          <p className="text-sm font-semibold text-slate-800 mb-1">
            {review.title}
          </p>
        )}
        {review.comment && (
          <p className="text-sm text-slate-600 leading-relaxed">
            {review.comment}
          </p>
        )}
        {review.listing_title && (
          <p className="text-xs text-slate-400 mt-1.5">
            Re: {review.listing_title}
          </p>
        )}
      </div>

      {/* Reply section */}
      {review.reply && (
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">
              {review.reply.author_name} replied
            </span>
            <span className="text-xs text-slate-400 ml-auto">
              {new Date(review.reply.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-slate-600">{review.reply.comment}</p>
        </div>
      )}

      {/* Inline reply form */}
      {canReply && (
        <div className="mt-3">
          {!showReplyForm ? (
            <button
              onClick={() => setShowReplyForm(true)}
              className="text-xs text-accent hover:underline font-medium"
            >
              + Reply to this review
            </button>
          ) : (
            <form onSubmit={handleReply} className="space-y-2">
              {replyError && (
                <div className="flex items-start gap-1.5 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {replyError}
                </div>
              )}
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                placeholder="Write your reply..."
                required
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {submittingReply && <Loader2 className="w-3 h-3 animate-spin" />}
                  Submit Reply
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReplyForm(false); setReplyText(""); setReplyError(""); }}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
