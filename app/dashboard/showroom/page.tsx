"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import type {
  ShowroomDetail, ShowroomBranch, ShowroomReview, ShowroomWorkingHours, PaginatedResponse,
} from "@/lib/types";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  Store, MapPin, Clock, Star, GitBranch,
  Loader2, Plus, Trash2, Save, CheckCircle, AlertCircle,
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// ---------------------------------------------------------------------------
// The /api/showrooms/ list item — includes owner info for ownership check
// ---------------------------------------------------------------------------
interface ShowroomListItem {
  id: number;
  name: string;
  owner?: { id: number };
}

// ---------------------------------------------------------------------------
// File upload helper (multipart FormData — api.ts only handles JSON)
// ---------------------------------------------------------------------------
async function uploadShowroomFile(
  showroomId: number,
  field: "logo" | "cover_photo",
  file: File
): Promise<ShowroomDetail> {
  const csrf = document.cookie.match(/csrftoken=([^;]+)/)?.[1] ?? "";
  const fd = new FormData();
  fd.append(field, file);
  const res = await fetch(`${BASE_URL}/api/showrooms/${showroomId}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "X-CSRFToken": csrf },
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---------------------------------------------------------------------------
// Tab: Profile
// ---------------------------------------------------------------------------
function ProfileTab({
  showroom,
  onSaved,
}: {
  showroom: ShowroomDetail;
  onSaved: (updated: ShowroomDetail) => void;
}) {
  const [form, setForm] = useState({
    name:         showroom.name ?? "",
    name_ar:      showroom.name_ar ?? "",
    description:  showroom.description ?? "",
    description_ar: (showroom as unknown as Record<string, string>).description_ar ?? "",
    address:      showroom.address ?? "",
    address_ar:   showroom.address_ar ?? "",
    city:         showroom.city ?? "",
    phone:        showroom.phone ?? "",
    whatsapp:     showroom.whatsapp ?? "",
    email:        showroom.email ?? "",
    website:      showroom.website ?? "",
    instagram:    showroom.instagram ?? "",
    twitter:      showroom.twitter ?? "",
    snapchat:     showroom.snapchat ?? "",
    tiktok:       showroom.tiktok ?? "",
    commercial_registration: showroom.commercial_registration ?? "",
    established_year: showroom.established_year ? String(showroom.established_year) : "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const payload = {
        ...form,
        established_year: form.established_year ? parseInt(form.established_year) : null,
      };
      const updated = await api.patch<ShowroomDetail>(`/api/showrooms/${showroom.id}/`, payload);
      onSaved(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: "logo" | "cover_photo") => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const updated = await uploadShowroomFile(showroom.id, field, file);
      onSaved(updated);
    } catch {
      alert("Failed to upload image.");
    }
  };

  const FIELDS: Array<{ name: string; label: string; required?: boolean }> = [
    { name: "name",                    label: "Name (English)",             required: true },
    { name: "name_ar",                 label: "Name (Arabic)" },
    { name: "city",                    label: "City",                       required: true },
    { name: "phone",                   label: "Phone",                      required: true },
    { name: "address",                 label: "Address" },
    { name: "address_ar",              label: "Address (Arabic)" },
    { name: "whatsapp",                label: "WhatsApp" },
    { name: "email",                   label: "Email" },
    { name: "website",                 label: "Website" },
    { name: "instagram",               label: "Instagram" },
    { name: "twitter",                 label: "Twitter / X" },
    { name: "snapchat",                label: "Snapchat" },
    { name: "tiktok",                  label: "TikTok" },
    { name: "commercial_registration", label: "Commercial Registration" },
    { name: "established_year",        label: "Established Year" },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" /> Saved successfully.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Photos */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Logo</label>
          {showroom.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={showroom.logo} alt="Logo" className="w-20 h-20 rounded-xl object-cover mb-2 border border-slate-100" />
          )}
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "logo")}
            className="text-sm text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Cover Photo</label>
          {showroom.cover_photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={showroom.cover_photo} alt="Cover" className="w-full h-20 rounded-xl object-cover mb-2 border border-slate-100" />
          )}
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "cover_photo")}
            className="text-sm text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
        </div>
      </div>

      {/* Fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        {FIELDS.map(({ name, label, required }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}{required && " *"}</label>
            <input
              name={name}
              value={(form as Record<string, string>)[name] ?? ""}
              onChange={handleChange}
              required={required}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent"
            />
          </div>
        ))}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description (Arabic)</label>
        <textarea
          name="description_ar"
          value={form.description_ar}
          onChange={handleChange}
          rows={3}
          dir="rtl"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-medium text-sm transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Tab: Working Hours
// ---------------------------------------------------------------------------
function HoursTab({ showroom, onSaved }: { showroom: ShowroomDetail; onSaved: (u: ShowroomDetail) => void }) {
  const initialHours = DAYS.map((day) => {
    const existing = showroom.working_hours?.find((h) => String(h.day) === String(day));
    return existing ?? { day, opening_time: "09:00", closing_time: "18:00", is_closed: false };
  });

  const [hours, setHours] = useState<ShowroomWorkingHours[]>(initialHours as ShowroomWorkingHours[]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const update = (index: number, field: keyof ShowroomWorkingHours, value: string | boolean) => {
    setHours((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await api.put<ShowroomDetail>(
        `/api/showrooms/${showroom.id}/working-hours/`,
        hours
      );
      onSaved(updated as unknown as ShowroomDetail);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to save working hours.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" /> Hours saved.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="space-y-2">
        {hours.map((h, i) => (
          <div
            key={h.day}
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              h.is_closed ? "border-slate-100 bg-slate-50 opacity-60" : "border-slate-200 bg-white"
            }`}
          >
            <div className="w-24 flex-shrink-0">
              <p className="text-sm font-medium text-slate-700 capitalize">{h.day}</p>
            </div>
            <label className="flex items-center gap-1.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={h.is_closed}
                onChange={(e) => update(i, "is_closed", e.target.checked)}
                className="accent-accent"
              />
              <span className="text-xs text-slate-500">Closed</span>
            </label>
            {!h.is_closed && (
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <input
                  type="time"
                  value={h.opening_time}
                  onChange={(e) => update(i, "opening_time", e.target.value)}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent"
                />
                <span className="text-slate-400 text-sm">—</span>
                <input
                  type="time"
                  value={h.closing_time}
                  onChange={(e) => update(i, "closing_time", e.target.value)}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-medium text-sm transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Hours
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Branches
// ---------------------------------------------------------------------------
function BranchesTab({ showroom }: { showroom: ShowroomDetail }) {
  const [branches, setBranches] = useState<ShowroomBranch[]>(showroom.branches ?? []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city_obj: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const branch = await api.post<ShowroomBranch>(
        `/api/showrooms/${showroom.id}/branches/`,
        { ...form, city_obj: form.city_obj ? parseInt(form.city_obj) : undefined }
      );
      setBranches((prev) => [...prev, branch]);
      setForm({ name: "", address: "", city_obj: "", phone: "" });
      setAdding(false);
    } catch {
      alert("Failed to add branch.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branchId: number) => {
    if (!confirm("Delete this branch?")) return;
    setDeletingId(branchId);
    try {
      await api.delete(`/api/showrooms/${showroom.id}/branches/${branchId}/`);
      setBranches((prev) => prev.filter((b) => b.id !== branchId));
    } catch {
      alert("Failed to delete branch.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {branches.length === 0 && !adding ? (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <GitBranch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No branches yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {branches.map((b) => (
            <div key={b.id} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{b.name_display || b.name}</p>
                <p className="text-sm text-slate-500 flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {b.address_display || b.address}
                </p>
                {b.phone && <p className="text-xs text-slate-400 mt-0.5">{b.phone}</p>}
                {b.is_main && (
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full mt-1 inline-block">
                    Main Branch
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(b.id)}
                disabled={deletingId === b.id}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors flex-shrink-0"
              >
                {deletingId === b.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <form onSubmit={handleAdd} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
          <p className="font-medium text-slate-900 text-sm">New Branch</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: "name",     label: "Branch Name", required: true },
              { name: "address",  label: "Address" },
              { name: "phone",    label: "Phone" },
              { name: "city_obj", label: "City ID (optional)" },
            ].map(({ name, label, required }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input
                  name={name}
                  value={(form as Record<string, string>)[name]}
                  onChange={(e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))}
                  required={required}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add Branch
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        branches.length < 10 && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 hover:border-accent hover:text-accent text-slate-500 rounded-xl text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Branch
          </button>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Reviews (read-only for dealer)
// ---------------------------------------------------------------------------
function ReviewsTab({ showroom }: { showroom: ShowroomDetail }) {
  const { data, isLoading } = useApiQuery<{ results: ShowroomReview[] }>(
    `/api/showrooms/${showroom.id}/reviews/`
  );
  const reviews = data?.results ?? [];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-5 h-5 ${
                s <= Math.round(Number(showroom.average_rating || 0))
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-slate-200"
              }`}
            />
          ))}
        </div>
        <span className="text-2xl font-bold text-slate-900">
          {Number(showroom.average_rating || 0) > 0
            ? Number(showroom.average_rating).toFixed(1)
            : "—"}
        </span>
        <span className="text-sm text-slate-500">({showroom.total_reviews} reviews)</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900 text-sm">{r.user_name}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
                    ))}
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
// Main page
// ---------------------------------------------------------------------------

const TABS = ["Profile", "Hours", "Branches", "Reviews"] as const;
type Tab = typeof TABS[number];

const TAB_ICONS: Record<Tab, React.ElementType> = {
  Profile: Store,
  Hours: Clock,
  Branches: GitBranch,
  Reviews: Star,
};

export default function DealerShowroomPage() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Profile");
  const [showroom, setShowroom] = useState<ShowroomDetail | null>(null);

  // ---------------------------------------------------------------------------
  // Step 1 — fetch the showrooms list and find the one owned by this dealer.
  // The list endpoint is public (/api/showrooms/), but when a dealer is
  // authenticated the backend may scope results, OR include owner info.
  // We check owner.id === user.id; if owner is absent we fall back to
  // results[0] when only one showroom is returned (safe for single-owner accounts).
  // ---------------------------------------------------------------------------
  const { data: listData, isLoading: listLoading } = useApiQuery<
    PaginatedResponse<ShowroomListItem> | ShowroomListItem[]
  >("/api/showrooms/?page_size=200", { enabled: isAuthenticated });

  const ownedId = useMemo(() => {
    if (!listData) return null;
    const results: ShowroomListItem[] = Array.isArray(listData)
      ? listData
      : (listData as PaginatedResponse<ShowroomListItem>).results ?? [];

    // Prefer exact owner match
    const byOwner = results.find((s) => s.owner?.id === user?.id);
    if (byOwner) return byOwner.id;

    // Fallback: if exactly one result and no owner field exposed, assume it's theirs
    if (results.length === 1 && !results[0].owner) return results[0].id;

    return null;
  }, [listData, user]);

  // ---------------------------------------------------------------------------
  // Step 2 — fetch the full ShowroomDetail using the ID found above
  // ---------------------------------------------------------------------------
  const { data: detailData, isLoading: detailLoading, refetch: refetchDetail } = useApiQuery<ShowroomDetail>(
    `/api/showrooms/${ownedId}/`,
    { enabled: ownedId !== null }
  );

  // Sync detail into local state (so tabs can update it optimistically)
  useEffect(() => {
    if (detailData) setShowroom(detailData);
  }, [detailData]);

  // ---------------------------------------------------------------------------
  // Create showroom form
  // ---------------------------------------------------------------------------
  const [createForm, setCreateForm] = useState({ name: "", city: "", address: "", phone: "" });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSaving(true);
    setCreateError("");
    try {
      const created = await api.post<ShowroomDetail>("/api/showrooms/", createForm);
      setShowroom(created);
    } catch (err: unknown) {
      let msg = "Failed to create showroom.";
      try {
        const parsed = JSON.parse((err as Error).message);
        msg = parsed.detail || parsed.error || Object.values(parsed)[0] as string || msg;
      } catch { /* ignore */ }
      setCreateError(msg);
    } finally {
      setCreateSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------
  const isLoading = listLoading || (ownedId !== null && detailLoading && !showroom);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // No showroom yet → show create form
  // ---------------------------------------------------------------------------
  if (!showroom) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Showroom</h1>
          <p className="text-sm text-slate-500 mt-1">You don&apos;t have a showroom yet. Create one to get started.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm max-w-md">
          <p className="text-slate-700 font-semibold mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-accent" /> Create Your Showroom
          </p>
          {createError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {createError}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            {[
              { name: "name",    label: "Showroom Name", required: true },
              { name: "city",    label: "City",          required: true },
              { name: "phone",   label: "Phone",         required: true },
              { name: "address", label: "Address" },
            ].map(({ name, label, required }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {label}{required && " *"}
                </label>
                <input
                  name={name}
                  value={(createForm as Record<string, string>)[name]}
                  onChange={(e) => setCreateForm((p) => ({ ...p, [e.target.name]: e.target.value }))}
                  required={required}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={createSaving}
              className="w-full py-2.5 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {createSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Showroom
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Has showroom → management UI
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        {showroom.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={showroom.logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-slate-100" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Store className="w-7 h-7 text-accent" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{showroom.name}</h1>
            {showroom.is_verified && (
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {showroom.city}{showroom.phone ? ` · ${showroom.phone}` : ""}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span>{showroom.active_listings} active listings</span>
            <span>·</span>
            <span>{showroom.total_reviews} reviews</span>
            <Link
              href={`/showrooms/${showroom.id}`}
              className="text-accent hover:underline font-medium"
            >
              View public page →
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "text-accent border-b-2 border-accent -mb-px"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab}
              </button>
            );
          })}
        </div>
        <div className="p-5">
          {activeTab === "Profile" && (
            <ProfileTab showroom={showroom} onSaved={setShowroom} />
          )}
          {activeTab === "Hours" && (
            <HoursTab showroom={showroom} onSaved={setShowroom} />
          )}
          {activeTab === "Branches" && (
            <BranchesTab showroom={showroom} />
          )}
          {activeTab === "Reviews" && (
            <ReviewsTab showroom={showroom} />
          )}
        </div>
      </div>
    </div>
  );
}
