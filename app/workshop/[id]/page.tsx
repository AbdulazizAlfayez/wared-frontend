"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  WorkshopDetail, WorkshopService, WorkshopReview, PaginatedResponse,
} from "@/lib/types";
import {
  MapPin, Phone, Star, Clock, CheckCircle, Building2, Loader2,
  AlertCircle, Info, MessageSquare, Send, Wrench, Calendar,
  Instagram, Twitter, Globe, Mail, ExternalLink, X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WS_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatPrice(svc: WorkshopService): string {
  if (svc.price_type === "contact" || !svc.price) return "Contact for Price";
  const p = `SAR ${parseFloat(svc.price).toLocaleString()}`;
  if (svc.price_type === "starting_from") return `Starting from ${p}`;
  if ((svc.price_type as string) === "hourly") return `${p}/hr`;
  return p;
}

const CATEGORY_LABELS: Record<string, string> = {
  maintenance: "Maintenance",
  repair: "Repair",
  bodywork: "Bodywork",
  electrical: "Electrical",
  ac: "AC",
  tires: "Tires",
  engine: "Engine",
  transmission: "Transmission",
  diagnostics: "Diagnostics",
  inspection: "Inspection",
  detailing: "Detailing",
  ac_service: "AC Service",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Star Picker
// ---------------------------------------------------------------------------
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}>
          <Star className={`w-7 h-7 transition-colors ${s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Booking Modal
// ---------------------------------------------------------------------------
function BookingModal({
  workshop,
  preselectedService,
  onClose,
}: {
  workshop: WorkshopDetail;
  preselectedService: WorkshopService | null;
  onClose: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    service: preselectedService?.id ?? "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_year: new Date().getFullYear(),
    vehicle_plate: "",
    booking_date: "",
    booking_time: "10:00",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === "vehicle_year" ? parseInt(value) || p.vehicle_year : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/service-bookings/", {
        workshop: workshop.id,
        service: form.service || null,
        vehicle_make: form.vehicle_make,
        vehicle_model: form.vehicle_model,
        vehicle_year: form.vehicle_year,
        vehicle_plate: form.vehicle_plate,
        booking_date: form.booking_date,
        booking_time: form.booking_time,
        description: form.description,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as Error;
      try {
        const parsed = JSON.parse(e.message);
        const msg = Object.values(parsed).flat().join(" ");
        setError(msg || "Failed to submit booking.");
      } catch {
        setError(e.message || "Failed to submit booking.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-lg">Book a Service</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Booking Submitted!</h3>
            <p className="text-slate-600 text-sm mb-6">
              The workshop will confirm your booking soon. You can track it in your profile.
            </p>
            <button onClick={onClose}
              className="px-6 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}

            {/* Service selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Service</label>
              <select name="service" value={form.service} onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent bg-white">
                <option value="">— Select a service (optional) —</option>
                {workshop.services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_display || s.name}
                    {s.price ? ` — ${formatPrice(s)}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "vehicle_make", label: "Make *", placeholder: "e.g. Toyota", required: true },
                { name: "vehicle_model", label: "Model *", placeholder: "e.g. Camry", required: true },
              ].map(({ name, label, placeholder, required }) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input name={name} value={(form as Record<string, string | number>)[name] as string}
                    onChange={handleChange} required={required} placeholder={placeholder}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Year *</label>
                <input type="number" name="vehicle_year" value={form.vehicle_year}
                  onChange={handleChange} required min={1990} max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Plate Number</label>
                <input name="vehicle_plate" value={form.vehicle_plate} onChange={handleChange}
                  placeholder="e.g. ABC 1234"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent" />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Preferred Date *</label>
                <input type="date" name="booking_date" value={form.booking_date}
                  onChange={handleChange} required min={today}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Preferred Time *</label>
                <input type="time" name="booking_time" value={form.booking_time}
                  onChange={handleChange} required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Describe the issue (optional)</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                placeholder="Describe what needs to be done..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent resize-none" />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-medium transition-colors">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              {submitting ? "Submitting..." : "Submit Booking Request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Services
// ---------------------------------------------------------------------------
function ServicesTab({
  workshop,
  onBook,
}: {
  workshop: WorkshopDetail;
  onBook: (svc: WorkshopService) => void;
}) {
  const services = workshop.services ?? [];

  if (services.length === 0) {
    return (
      <div className="py-16 text-center">
        <Wrench className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500">No services listed yet.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {services.map((svc) => (
        <div key={svc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900">{svc.name_display || svc.name}</p>
              {svc.description && (
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{svc.description}</p>
              )}
            </div>
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full flex-shrink-0 capitalize">
              {CATEGORY_LABELS[svc.category] ?? svc.category}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto">
            <div>
              <p className={`text-sm font-bold ${svc.price_type === "contact" ? "text-slate-500 italic" : "text-slate-900"}`}>
                {formatPrice(svc)}
              </p>
              {svc.duration_minutes && (
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ~{svc.duration_minutes} min
                </p>
              )}
            </div>
            <button
              onClick={() => onBook(svc)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-600 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
            >
              <Calendar className="w-3.5 h-3.5" /> Book
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: About
// ---------------------------------------------------------------------------
function AboutTab({ workshop }: { workshop: WorkshopDetail }) {
  return (
    <div className="space-y-6">
      {workshop.description && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-2">About</h3>
          <p className="text-slate-600 text-sm leading-relaxed">{workshop.description}</p>
        </div>
      )}
      {workshop.specializations?.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {workshop.specializations.map((s) => (
              <span key={s} className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        {workshop.established_year && (
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Established</p>
            <p className="text-lg font-bold text-slate-900">{workshop.established_year}</p>
          </div>
        )}
        {workshop.total_bookings > 0 && (
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Total Bookings</p>
            <p className="text-lg font-bold text-slate-900">{workshop.total_bookings}</p>
          </div>
        )}
      </div>
      {workshop.address && (
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-slate-700">{workshop.address}</p>
            {workshop.latitude && workshop.longitude && (
              <a href={`https://maps.google.com/?q=${workshop.latitude},${workshop.longitude}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-accent hover:underline mt-0.5 inline-flex items-center gap-1">
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
function WorkingHoursTab({ workshop }: { workshop: WorkshopDetail }) {
  const todayInt = new Date().getDay(); // 0=Sunday
  const hours = [...(workshop.working_hours ?? [])].sort((a, b) => a.day - b.day);

  if (hours.length === 0) {
    return (
      <div className="py-16 text-center">
        <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No working hours set.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hours.map((h) => {
        const isToday = h.day === todayInt;
        const dayLabel = h.day_display ?? WS_DAYS[h.day] ?? String(h.day);
        return (
          <div key={h.day}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm ${
              isToday ? "bg-accent/10 border border-accent/20" : "bg-slate-50 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-24 font-medium ${isToday ? "text-accent" : "text-slate-700"}`}>
                {dayLabel}
                {isToday && (
                  <span className="ml-1.5 text-xs bg-accent text-white px-1.5 py-0.5 rounded-full">Today</span>
                )}
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
// Tab: Reviews
// ---------------------------------------------------------------------------
function ReviewsTab({ workshop }: { workshop: WorkshopDetail }) {
  const { isAuthenticated } = useAuth();
  const { data, isLoading, refetch } = useApiQuery<PaginatedResponse<WorkshopReview>>(
    `/api/workshops/${workshop.id}/reviews/`
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
    setSubmitting(true); setSubmitError("");
    try {
      await api.post(`/api/workshops/${workshop.id}/reviews/`, { rating, title, comment });
      setSubmitSuccess(true); setShowForm(false);
      setRating(0); setTitle(""); setComment("");
      refetch();
    } catch (err: unknown) {
      const e = err as Error & { detail?: unknown };
      const d = e.detail;
      setSubmitError(
        typeof d === "string" ? d :
        typeof d === "object" && d !== null && "detail" in (d as object)
          ? String((d as { detail: unknown }).detail) : e.message || "Failed to submit."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
        <div className="text-center">
          <p className="text-3xl font-bold text-slate-900">{workshop.average_rating ? Number(workshop.average_rating).toFixed(1) : "—"}</p>
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(workshop.average_rating || 0)) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">{workshop.total_reviews} reviews</p>
        </div>
        <div className="flex-1" />
        {isAuthenticated && !submitSuccess && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors">
            <MessageSquare className="w-4 h-4" /> Write a Review
          </button>
        )}
        {!isAuthenticated && (
          <Link href="/auth/signin" className="text-sm text-accent hover:underline">Sign in to review</Link>
        )}
      </div>

      {submitSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" /> Review submitted! It will appear after approval.
        </div>
      )}

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
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent"
              placeholder="Summarize your experience" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comment</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent resize-none"
              placeholder="Tell others about your experience..." />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl text-sm font-medium transition-colors">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
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
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {r.user_name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{r.user_name}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              {r.title && <p className="text-sm font-medium text-slate-800 mt-2">{r.title}</p>}
              {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
              {r.service_name && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> {r.service_name}
                </p>
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
  { key: "services", label: "Services", icon: Wrench },
  { key: "about", label: "About", icon: Info },
  { key: "hours", label: "Working Hours", icon: Clock },
  { key: "reviews", label: "Reviews", icon: Star },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function WorkshopDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("services");
  const [bookingService, setBookingService] = useState<WorkshopService | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  const { data: workshop, isLoading, error } = useApiQuery<WorkshopDetail>(
    `/api/workshops/${id}/`,
    { enabled: !!id }
  );

  const handleBookService = (svc: WorkshopService) => {
    if (!isAuthenticated) {
      window.location.href = "/auth/signin";
      return;
    }
    setBookingService(svc);
    setShowBooking(true);
  };

  const handleBookGeneral = () => {
    if (!isAuthenticated) {
      window.location.href = "/auth/signin";
      return;
    }
    setBookingService(null);
    setShowBooking(true);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  if (error || !workshop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-600">Workshop not found.</p>
        <Link href="/workshop" className="text-accent hover:underline text-sm">Browse all workshops</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Cover photo */}
      <div className="relative h-48 sm:h-64 bg-slate-200 overflow-hidden">
        {workshop.cover_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={workshop.cover_photo} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-slate-300" />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5">
          <div className="flex items-start gap-4 flex-wrap">
            {/* Logo */}
            <div className="flex-shrink-0 -mt-8">
              {workshop.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={workshop.logo} alt={workshop.name}
                  className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-orange-50 flex items-center justify-center border-4 border-white shadow-md">
                  <Wrench className="w-9 h-9 text-orange-500" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{workshop.name}</h1>
                {workshop.is_verified && (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${workshop.is_open_now ? "bg-accent/10 text-accent" : "bg-red-50 text-red-500"}`}>
                  {workshop.is_open_now ? "Open Now" : "Closed"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {workshop.city}</span>
                {Number(workshop.average_rating || 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {Number(workshop.average_rating || 0).toFixed(1)}
                    <span className="text-slate-400">({workshop.total_reviews})</span>
                  </span>
                )}
                {workshop.services?.length > 0 && (
                  <span className="text-slate-400">{workshop.services.length} service{workshop.services.length !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>

            {/* Contact + Book */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <button onClick={handleBookGeneral}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Calendar className="w-4 h-4" /> Book Now
              </button>
              {workshop.phone && (
                <a href={`tel:${workshop.phone}`}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors">
                  <Phone className="w-4 h-4" /> Call
                </a>
              )}
              {workshop.whatsapp && (
                <a href={`https://wa.me/${workshop.whatsapp.replace(/\D/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">
                  <Phone className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {workshop.instagram && (
                <a href={`https://instagram.com/${workshop.instagram.replace("@", "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-2 border border-slate-200 hover:bg-pink-50 hover:text-pink-600 text-slate-500 rounded-xl transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {workshop.twitter && (
                <a href={`https://x.com/${workshop.twitter.replace("@", "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === key ? "text-accent border-b-2 border-accent -mb-px" : "text-slate-500 hover:text-slate-800"
                }`}>
                <Icon className="w-4 h-4" />
                {label}
                {key === "services" && workshop.services?.length > 0 && (
                  <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                    {workshop.services.length}
                  </span>
                )}
                {key === "reviews" && workshop.total_reviews > 0 && (
                  <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                    {workshop.total_reviews}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="p-5">
            {activeTab === "services" && <ServicesTab workshop={workshop} onBook={handleBookService} />}
            {activeTab === "about" && <AboutTab workshop={workshop} />}
            {activeTab === "hours" && <WorkingHoursTab workshop={workshop} />}
            {activeTab === "reviews" && <ReviewsTab workshop={workshop} />}
          </div>
        </div>
      </div>

      {/* Booking modal */}
      {showBooking && (
        <BookingModal
          workshop={workshop}
          preselectedService={bookingService}
          onClose={() => { setShowBooking(false); setBookingService(null); }}
        />
      )}
    </div>
  );
}
