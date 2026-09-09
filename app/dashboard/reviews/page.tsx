"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, Trash2, Edit, MessageSquare, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Review, PaginatedResponse } from "@/lib/types";
import ReviewCard from "@/components/ReviewCard";
import StarRating from "@/components/StarRating";

// ---------------------------------------------------------------------------
// Inline Edit Modal
// ---------------------------------------------------------------------------
function EditReviewModal({
  review,
  onClose,
  onSuccess,
}: {
  review: Review;
  onClose: () => void;
  onSuccess: (updated: Review) => void;
}) {
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title);
  const [comment, setComment] = useState(review.comment);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating."); return; }
    setSubmitting(true);
    setError("");
    try {
      const updated = await api.put<Review>(`/api/reviews/${review.id}/`, {
        rating,
        title: title.trim(),
        comment: comment.trim(),
        reviewed_user: review.reviewed_user,
        review_type: review.review_type,
      });
      onSuccess(updated);
    } catch (err: unknown) {
      const e = err as Error & { detail?: unknown };
      const detail = e.detail;
      if (typeof detail === "string") setError(detail);
      else if (detail && typeof detail === "object") {
        setError(Object.values(detail as Record<string, string[]>).flat().join(" ") || "Failed to update.");
      } else setError(e.message || "Failed to update review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-lg">Edit Review</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rating *</label>
            <StarRating rating={rating} size="lg" interactive onChange={setRating} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              maxLength={100}
              required
              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm text-slate-900 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comment *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 1000))}
              maxLength={1000}
              required
              rows={4}
              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm text-slate-900 focus:outline-none focus:border-accent resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{comment.length}/1000</p>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-medium text-sm transition-colors">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirm Dialog
// ---------------------------------------------------------------------------
function DeleteConfirmDialog({
  review,
  onClose,
  onConfirm,
  deleting,
}: {
  review: Review;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 text-lg mb-1">Delete Review?</h3>
        <p className="text-sm text-slate-500 mb-5">
          Are you sure you want to delete your review <span className="font-medium">&ldquo;{review.title}&rdquo;</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl font-medium text-sm transition-colors">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
type ActiveTab = "mine" | "about_me";

export default function DashboardReviewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("mine");

  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [aboutMeReviews, setAboutMeReviews] = useState<Review[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [loadingAbout, setLoadingAbout] = useState(false);
  const [errorMine, setErrorMine] = useState("");
  const [errorAbout, setErrorAbout] = useState("");

  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch "Reviews I Wrote"
  useEffect(() => {
    if (activeTab !== "mine") return;
    setLoadingMine(true);
    setErrorMine("");
    api.get<Review[] | PaginatedResponse<Review>>("/api/reviews/mine/")
      .then((res) => {
        const items = Array.isArray(res) ? res : (res as PaginatedResponse<Review>).results ?? [];
        setMyReviews(items);
      })
      .catch(() => setErrorMine("Failed to load your reviews."))
      .finally(() => setLoadingMine(false));
  }, [activeTab]);

  // Fetch "Reviews About Me"
  useEffect(() => {
    if (activeTab !== "about_me") return;
    setLoadingAbout(true);
    setErrorAbout("");
    api.get<Review[] | PaginatedResponse<Review>>("/api/reviews/about-me/")
      .then((res) => {
        const items = Array.isArray(res) ? res : (res as PaginatedResponse<Review>).results ?? [];
        setAboutMeReviews(items);
      })
      .catch(() => setErrorAbout("Failed to load reviews about you."))
      .finally(() => setLoadingAbout(false));
  }, [activeTab]);

  const handleEditSuccess = (updated: Review) => {
    setMyReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setEditingReview(null);
    setSuccessMsg("Review updated successfully.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleDelete = async () => {
    if (!deletingReview) return;
    setDeletingId(deletingReview.id);
    try {
      await api.delete(`/api/reviews/${deletingReview.id}/`);
      setMyReviews((prev) => prev.filter((r) => r.id !== deletingReview.id));
      setDeletingReview(null);
      setSuccessMsg("Review deleted.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {
      // keep modal open so user can retry
    } finally {
      setDeletingId(null);
    }
  };

  const handleReplySuccess = (updated: Review) => {
    setAboutMeReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSuccessMsg("Reply submitted.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-yellow-100 rounded-xl">
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">My Reviews</h1>
        </div>
        <p className="text-sm text-slate-500 ml-11">
          Manage reviews you've written and see feedback about you.
        </p>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab("mine")}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
              activeTab === "mine"
                ? "text-accent border-b-2 border-accent -mb-px"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Edit className="w-4 h-4" />
            Reviews I Wrote
            {myReviews.length > 0 && (
              <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                {myReviews.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("about_me")}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
              activeTab === "about_me"
                ? "text-accent border-b-2 border-accent -mb-px"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Reviews About Me
            {aboutMeReviews.length > 0 && (
              <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                {aboutMeReviews.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-5">
          {/* ── Reviews I Wrote ─────────────────────────────────────── */}
          {activeTab === "mine" && (
            <>
              {loadingMine ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              ) : errorMine ? (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMine}
                </div>
              ) : myReviews.length === 0 ? (
                <div className="py-14 text-center">
                  <Star className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">No reviews written yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Your reviews of sellers, buyers, showrooms, and workshops will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      currentUserId={user?.id}
                      onEdit={review.can_edit ? (r) => setEditingReview(r) : undefined}
                      onDelete={review.can_edit ? (r) => setDeletingReview(r) : undefined}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Reviews About Me ────────────────────────────────────── */}
          {activeTab === "about_me" && (
            <>
              {loadingAbout ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              ) : errorAbout ? (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorAbout}
                </div>
              ) : aboutMeReviews.length === 0 ? (
                <div className="py-14 text-center">
                  <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">No reviews about you yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Reviews from buyers and sellers will appear here once you complete transactions.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aboutMeReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      showReply
                      currentUserId={user?.id}
                      onReplySuccess={handleReplySuccess}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editingReview && (
        <EditReviewModal
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete confirm */}
      {deletingReview && (
        <DeleteConfirmDialog
          review={deletingReview}
          onClose={() => setDeletingReview(null)}
          onConfirm={handleDelete}
          deleting={deletingId === deletingReview.id}
        />
      )}
    </div>
  );
}
