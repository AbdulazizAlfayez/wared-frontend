"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ShowroomDetail, ShowroomReview, Listing, PaginatedResponse } from "@/lib/types";
import CarCard from "@/components/CarCard";
import {
  MapPin, Phone, Mail, Globe, Star, Clock, CheckCircle,
  Building2, Instagram, Twitter, Loader2, ChevronRight, ExternalLink,
  AlertCircle, Calendar, Info, GitBranch, MessageSquare, Send,
} from "lucide-react";

const DAY_DISPLAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

// ---------------------------------------------------------------------------
// Star Rating Selector
// ---------------------------------------------------------------------------
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-colors"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Listings
// ---------------------------------------------------------------------------
function ListingsTab({ showroomId, total }: { showroomId: string; total: number }) {
  const { data, isLoading } = useApiQuery<PaginatedResponse<Listing>>(
    `/api/showrooms/${showroomId}/listings/?page_size=12`
  );
  const listings = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="py-16 text-center">
        <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500">No listings currently available.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <CarCard key={listing.id} listing={listing} />
        ))}
      </div>
      {data?.next && (
        <div className="mt-6 text-center">
          <Link
            href={`/browse?showroom=${showroomId}`}
            className="inline-flex items-center gap-1 text-accent hover:underline text-sm font-medium"
          >
            View all {total} listings <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: About
// ---------------------------------------------------------------------------
function AboutTab({ showroom }: { showroom: ShowroomDetail }) {
  return (
    <div className="space-y-6">
      {showroom.description && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-2">About</h3>
          <p className="text-slate-600 text-sm leading-relaxed">{showroom.description}</p>
        </div>
      )}

      {showroom.specializations?.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {showroom.specializations.map((s) => (
              <span key={s} className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {showroom.established_year && (
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Established</p>
            <p className="text-lg font-bold text-slate-900">{showroom.established_year}</p>
          </div>
        )}
        {showroom.commercial_registration && (
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Commercial Registration</p>
            <p className="text-sm font-medium text-slate-900">{showroom.commercial_registration}</p>
          </div>
        )}
      </div>

      {showroom.address && (
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-slate-700">{showroom.address}</p>
            {showroom.latitude && showroom.longitude && (
              <a
                href={`https://maps.google.com/?q=${showroom.latitude},${showroom.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline mt-0.5 inline-flex items-center gap-1"
              >
                View on Map <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Working Hours
// ---------------------------------------------------------------------------
function WorkingHoursTab({ showroom }: { showroom: ShowroomDetail }) {
  const todayInt = new Date().getDay(); // 0=Sunday … 6=Saturday, matches backend
  const hours = showroom.working_hours ?? [];

  if (hours.length === 0) {
    return (
      <div className="py-16 text-center">
        <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No working hours set.</p>
      </div>
    );
  }

  const sorted = [...hours].sort((a, b) => a.day - b.day);

  return (
    <div className="space-y-2">
      {sorted.map((h) => {
        const isToday = h.day === todayInt;
        const dayLabel = h.day_display ?? DAY_DISPLAY[h.day] ?? String(h.day);
        return (
          <div
            key={h.day}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${
              isToday
                ? "bg-accent/10 border border-accent/20"
                : "bg-slate-50 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-24 font-medium ${isToday ? "text-accent" : "text-slate-700"}`}>
                {dayLabel}
                {isToday && <span className="ml-1.5 text-xs bg-accent text-white px-1.5 py-0.5 rounded-full">Today</span>}
              </span>
            </div>
            {h.is_closed ? (
              <span className="text-red-500 font-medium">Closed</span>
            ) : (
              <span className={isToday ? "text-accent font-semibold" : "text-slate-700"}>
                {formatTime(h.opening_time)} – {formatTime(h.closing_time)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Branches
// ---------------------------------------------------------------------------
function BranchesTab({ showroom }: { showroom: ShowroomDetail }) {
  const branches = showroom.branches ?? [];

  if (branches.length === 0) {
    return (
      <div className="py-16 text-center">
        <GitBranch className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No branches listed.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {branches.map((b) => (
        <div key={b.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-semibold text-slate-900">{b.name_display || b.name}</p>
            {b.is_main && (
              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full flex-shrink-0">
                Main Branch
              </span>
            )}
          </div>
          {b.address_display || b.address ? (
            <p className="text-sm text-slate-600 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
              {b.address_display || b.address}
            </p>
          ) : null}
          {b.phone && (
            <a href={`tel:${b.phone}`} className="text-sm text-accent hover:underline flex items-center gap-1.5 mt-1">
              <Phone className="w-3.5 h-3.5" /> {b.phone}
            </a>
          )}
          {b.latitude && b.longitude && (
            <a
              href={`https://maps.google.com/?q=${b.latitude},${b.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline mt-2 inline-flex items-center gap-1"
            >
              View on Map <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Reviews
// ---------------------------------------------------------------------------
function ReviewsTab({ showroom }: { showroom: ShowroomDetail }) {
  const { isAuthenticated, user } = useAuth();
  const { data, isLoading, refetch } = useApiQuery<{ results: ShowroomReview[] }>(
    `/api/showrooms/${showroom.id}/reviews/`
  );
  const reviews = data?.results ?? [];

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setSubmitError("Please select a rating."); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      await api.post(`/api/showrooms/${showroom.id}/reviews/`, { rating, title, comment });
      setSubmitSuccess(true);
      setShowForm(false);
      setRating(0); setTitle(""); setComment("");
      refetch();
    } catch (err: unknown) {
      const e = err as Error & { detail?: unknown };
      const detail = e.detail;
      setSubmitError(
        typeof detail === "string" ? detail :
        typeof detail === "object" && detail !== null && "detail" in (detail as object)
          ? String((detail as { detail: unknown }).detail)
          : "Failed to submit review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Average rating summary */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
        <div className="text-center">
          <p className="text-3xl font-bold text-slate-900">{Number(showroom.average_rating || 0) > 0 ? Number(showroom.average_rating).toFixed(1) : "—"}</p>
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(showroom.average_rating || 0)) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">{showroom.total_reviews} reviews</p>
        </div>
        <div className="flex-1" />
        {isAuthenticated && !submitSuccess && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <MessageSquare className="w-4 h-4" /> Write a Review
          </button>
        )}
        {!isAuthenticated && (
          <Link href="/auth/signin" className="text-sm text-accent hover:underline">
            Sign in to review
          </Link>
        )}
      </div>

      {/* Success message */}
      {submitSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" /> Review submitted! It will appear after approval.
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4">
          <p className="font-semibold text-slate-900">Your Review</p>
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {submitError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rating *</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent"
              placeholder="Summarize your experience"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comment</label>
            <textarea
              value={comment} onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent resize-none"
              placeholder="Tell others about your experience..."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit" disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Review
            </button>
            <button
              type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {r.user_name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{r.user_name}</p>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              {r.title && <p className="text-sm font-medium text-slate-800 mt-2">{r.title}</p>}
              {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
              {!r.is_approved && (
                <span className="mt-2 inline-block text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  Pending approval
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const TABS = [
  { key: "listings", label: "Listings", icon: Building2 },
  { key: "about", label: "About", icon: Info },
  { key: "hours", label: "Working Hours", icon: Clock },
  { key: "branches", label: "Branches", icon: GitBranch },
  { key: "reviews", label: "Reviews", icon: Star },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function ShowroomDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState<TabKey>("listings");

  const { data: showroom, isLoading, error } = useApiQuery<ShowroomDetail>(
    `/api/showrooms/${id}/`,
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !showroom) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-600">Showroom not found.</p>
        <Link href="/showrooms" className="text-accent hover:underline text-sm">
          Browse all showrooms
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Cover photo */}
      <div className="relative h-48 sm:h-64 bg-slate-200 overflow-hidden">
        {showroom.cover_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={showroom.cover_photo} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-slate-300" />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5">
          <div className="flex items-start gap-4 flex-wrap">
            {/* Logo */}
            <div className="flex-shrink-0 -mt-8">
              {showroom.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={showroom.logo} alt={showroom.name}
                  className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-accent/10 flex items-center justify-center border-4 border-white shadow-md">
                  <Building2 className="w-9 h-9 text-accent" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{showroom.name}</h1>
                {showroom.is_verified && (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${showroom.is_open_now ? "bg-accent/10 text-accent" : "bg-red-50 text-red-500"}`}>
                  {showroom.is_open_now ? "Open Now" : "Closed"}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {showroom.city}</span>
                {Number(showroom.average_rating || 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {Number(showroom.average_rating).toFixed(1)}
                    <span className="text-slate-400">({showroom.total_reviews})</span>
                  </span>
                )}
                <span>{showroom.active_listings} active · {showroom.total_sold} sold</span>
              </div>
            </div>

            {/* Contact */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {showroom.phone && (
                <a href={`tel:${showroom.phone}`}
                  className="flex items-center gap-2 px-3 py-2 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors">
                  <Phone className="w-4 h-4" /> Call
                </a>
              )}
              {showroom.whatsapp && (
                <a href={`https://wa.me/${showroom.whatsapp.replace(/\D/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">
                  <Phone className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {showroom.email && (
                <a href={`mailto:${showroom.email}`}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors">
                  <Mail className="w-4 h-4" /> Email
                </a>
              )}
              {showroom.website && (
                <a href={showroom.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors">
                  <Globe className="w-4 h-4" /> Website
                </a>
              )}
              {/* Social links */}
              {showroom.instagram && (
                <a href={`https://instagram.com/${showroom.instagram.replace("@", "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-2 border border-slate-200 hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600 text-slate-500 rounded-xl transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {showroom.twitter && (
                <a href={`https://x.com/${showroom.twitter.replace("@", "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {showroom.snapchat && (
                <a href={`https://snapchat.com/add/${showroom.snapchat.replace("@", "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-2 border border-slate-200 hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600 text-slate-500 rounded-xl transition-colors">
                  <span className="text-xs font-bold">SC</span>
                </a>
              )}
              {showroom.tiktok && (
                <a href={`https://tiktok.com/@${showroom.tiktok.replace("@", "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors">
                  <span className="text-xs font-bold">TT</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === key
                    ? "text-accent border-b-2 border-accent -mb-px"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {key === "reviews" && showroom.total_reviews > 0 && (
                  <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                    {showroom.total_reviews}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === "listings" && (
              <ListingsTab showroomId={id} total={showroom.total_listings} />
            )}
            {activeTab === "about" && <AboutTab showroom={showroom} />}
            {activeTab === "hours" && <WorkingHoursTab showroom={showroom} />}
            {activeTab === "branches" && <BranchesTab showroom={showroom} />}
            {activeTab === "reviews" && <ReviewsTab showroom={showroom} />}
          </div>
        </div>
      </div>
    </div>
  );
}
