"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import type {
  WorkshopDetail, WorkshopService, WorkshopWorkingHours,
  WorkshopReview, ServiceBooking, PaginatedResponse,
} from "@/lib/types";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Wrench, Loader2, Plus, Trash2, Save, CheckCircle, AlertCircle,
  Star, Calendar, Clock, Edit2, X, ExternalLink,
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function uploadWorkshopFile(
  workshopId: number,
  field: "logo" | "cover_photo",
  file: File
): Promise<WorkshopDetail> {
  const csrf = document.cookie.match(/csrftoken=([^;]+)/)?.[1] ?? "";
  const fd = new FormData();
  fd.append(field, file);
  const res = await fetch(`${BASE_URL}/api/workshops/${workshopId}/`, {
    method: "PATCH", credentials: "include",
    headers: { "X-CSRFToken": csrf }, body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const WS_DAYS = [
  { day: 0, label: "Sunday" }, { day: 1, label: "Monday" }, { day: 2, label: "Tuesday" },
  { day: 3, label: "Wednesday" }, { day: 4, label: "Thursday" }, { day: 5, label: "Friday" },
  { day: 6, label: "Saturday" },
];

const SERVICE_CATEGORIES = [
  "maintenance", "repair", "bodywork", "electrical",
  "ac", "tires", "engine", "transmission", "diagnostics",
  "detailing", "other",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-500",
};

const BOOKING_ACTIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// ---------------------------------------------------------------------------
// Tab: Profile
// ---------------------------------------------------------------------------
function ProfileTab({ workshop, onSaved }: { workshop: WorkshopDetail; onSaved: (u: WorkshopDetail) => void }) {
  const [form, setForm] = useState({
    name: workshop.name ?? "",
    name_ar: workshop.name_ar ?? "",
    description: workshop.description ?? "",
    address: workshop.address ?? "",
    city: workshop.city ?? "",
    phone: workshop.phone ?? "",
    whatsapp: workshop.whatsapp ?? "",
    email: workshop.email ?? "",
    website: workshop.website ?? "",
    instagram: workshop.instagram ?? "",
    twitter: workshop.twitter ?? "",
    snapchat: workshop.snapchat ?? "",
    specializations: (workshop.specializations ?? []).join(", "),
    established_year: workshop.established_year ? String(workshop.established_year) : "",
    commercial_registration: workshop.commercial_registration ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess(false);
    try {
      const payload = {
        ...form,
        specializations: form.specializations
          ? form.specializations.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        established_year: form.established_year ? parseInt(form.established_year) : null,
      };
      const updated = await api.patch<WorkshopDetail>(`/api/workshops/${workshop.id}/`, payload);
      onSaved(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: "logo" | "cover_photo") => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const updated = await uploadWorkshopFile(workshop.id, field, file);
      onSaved(updated);
    } catch {
      alert("Failed to upload image.");
    }
  };

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
          {workshop.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={workshop.logo} alt="Logo" className="w-20 h-20 rounded-xl object-cover mb-2" />
          )}
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "logo")}
            className="text-sm text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Cover Photo</label>
          {workshop.cover_photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={workshop.cover_photo} alt="Cover" className="w-full h-20 rounded-xl object-cover mb-2" />
          )}
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "cover_photo")}
            className="text-sm text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { name: "name", label: "Name (English)", required: true },
          { name: "name_ar", label: "Name (Arabic)" },
          { name: "city", label: "City", required: true },
          { name: "address", label: "Address" },
          { name: "phone", label: "Phone" },
          { name: "whatsapp", label: "WhatsApp" },
          { name: "email", label: "Email" },
          { name: "website", label: "Website" },
          { name: "instagram", label: "Instagram" },
          { name: "twitter", label: "Twitter / X" },
          { name: "snapchat", label: "Snapchat" },
          { name: "established_year", label: "Established Year" },
          { name: "commercial_registration", label: "Commercial Registration" },
        ].map(({ name, label, required }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input name={name} value={(form as Record<string, string>)[name]} onChange={handleChange}
              required={required}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent" />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent resize-none" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Specializations <span className="text-xs font-normal text-slate-400">(comma-separated)</span>
        </label>
        <input name="specializations" value={form.specializations} onChange={handleChange}
          placeholder="e.g. Toyota, BMW, AC Repair"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent" />
      </div>

      <button type="submit" disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-medium text-sm transition-colors">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Tab: Services
// ---------------------------------------------------------------------------
function ServicesTab({ workshop }: { workshop: WorkshopDetail }) {
  const { data, isLoading, refetch } = useApiQuery<WorkshopService[]>(
    `/api/workshops/${workshop.id}/services/`
  );
  const services = data ?? [];
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", name_ar: "", category: "maintenance", price: "",
    price_type: "fixed", duration_minutes: "", description: "", order: "0",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const resetForm = () => {
    setForm({ name: "", name_ar: "", category: "maintenance", price: "", price_type: "fixed", duration_minutes: "", description: "", order: "0" });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/api/workshops/${workshop.id}/services/`, {
        ...form,
        price: form.price || null,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        order: parseInt(form.order) || 0,
      });
      resetForm(); setAdding(false); refetch();
    } catch (err) {
      alert((err as Error).message || "Failed to add service.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent, svcId: number) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/api/workshops/${workshop.id}/services/${svcId}/`, {
        ...form,
        price: form.price || null,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        order: parseInt(form.order) || 0,
      });
      setEditingId(null); resetForm(); refetch();
    } catch (err) {
      alert((err as Error).message || "Failed to update service.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (svcId: number) => {
    if (!confirm("Delete this service?")) return;
    setDeletingId(svcId);
    try {
      await api.delete(`/api/workshops/${workshop.id}/services/${svcId}/`);
      refetch();
    } catch {
      alert("Failed to delete service.");
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (svc: WorkshopService) => {
    setForm({
      name: svc.name, name_ar: svc.name_ar ?? "",
      category: svc.category, price: svc.price ?? "",
      price_type: svc.price_type, duration_minutes: svc.duration_minutes ? String(svc.duration_minutes) : "",
      description: svc.description ?? "", order: String(svc.order),
    });
    setEditingId(svc.id);
    setAdding(false);
  };

  const ServiceForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Name (English) *</label>
          <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Name (Arabic)</label>
          <input value={form.name_ar} onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent" dir="rtl" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
          <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent capitalize">
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Price Type</label>
          <select value={form.price_type} onChange={(e) => setForm((p) => ({ ...p, price_type: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent">
            <option value="fixed">Fixed Price</option>
            <option value="starting_from">Starting From</option>
            <option value="contact">Contact for Price</option>
          </select>
        </div>
        {form.price_type !== "contact" && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Price (SAR)</label>
            <input type="number" min="0" step="0.01" value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent" />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Duration (minutes)</label>
          <input type="number" min="0" value={form.duration_minutes}
            onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Display Order</label>
          <input type="number" min="0" value={form.order}
            onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent resize-none" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {submitLabel}
        </button>
        <button type="button" onClick={() => { setAdding(false); setEditingId(null); resetForm(); }}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-100 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-4">
      {services.length === 0 && !adding && (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No services yet.</p>
        </div>
      )}

      {services.map((svc) => (
        <div key={svc.id}>
          {editingId === svc.id ? (
            <ServiceForm onSubmit={(e) => handleUpdate(e, svc.id)} submitLabel="Update Service" />
          ) : (
            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">{svc.name_display || svc.name}</p>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full capitalize">
                    {svc.category.replace("_", " ")}
                  </span>
                  {!svc.is_active && (
                    <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                {svc.description && <p className="text-sm text-slate-500 mt-0.5 truncate">{svc.description}</p>}
                <div className="flex items-center gap-3 mt-1 text-sm">
                  {svc.price ? (
                    <span className="font-medium text-slate-900">
                      {svc.price_type === "starting_from" ? "From " : ""}SAR {parseFloat(svc.price).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Contact for price</span>
                  )}
                  {svc.duration_minutes && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {svc.duration_minutes}m
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => startEdit(svc)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(svc.id)} disabled={deletingId === svc.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                  {deletingId === svc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding && <ServiceForm onSubmit={handleAdd} submitLabel="Add Service" />}

      {!adding && editingId === null && (
        <button onClick={() => { setAdding(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 hover:border-accent hover:text-accent text-slate-500 rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Working Hours
// ---------------------------------------------------------------------------
function HoursTab({ workshop, onSaved }: { workshop: WorkshopDetail; onSaved: (u: WorkshopDetail) => void }) {
  const initialHours = WS_DAYS.map(({ day, label }) => {
    const existing = workshop.working_hours?.find((h) => h.day === day);
    return existing ?? { day, label, opening_time: "09:00", closing_time: "18:00", is_closed: false };
  });

  const [hours, setHours] = useState<(WorkshopWorkingHours & { label?: string })[]>(initialHours);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (index: number, field: keyof WorkshopWorkingHours, value: string | boolean | number) => {
    setHours((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.put<WorkshopDetail>(
        `/api/workshops/${workshop.id}/working-hours/`,
        hours.map(({ day, opening_time, closing_time, is_closed }) => ({ day, opening_time, closing_time, is_closed }))
      );
      onSaved(updated as WorkshopDetail);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      alert("Failed to save working hours.");
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
      <div className="space-y-3">
        {hours.map((h, i) => (
          <div key={h.day}
            className={`flex items-center gap-3 p-3 rounded-xl border ${h.is_closed ? "border-slate-100 bg-slate-50 opacity-60" : "border-slate-200 bg-white"}`}>
            <div className="w-28 flex-shrink-0">
              <p className="text-sm font-medium text-slate-700">
                {WS_DAYS.find((d) => d.day === h.day)?.label ?? `Day ${h.day}`}
              </p>
            </div>
            <label className="flex items-center gap-1.5 flex-shrink-0">
              <input type="checkbox" checked={h.is_closed}
                onChange={(e) => update(i, "is_closed", e.target.checked)} className="accent-accent" />
              <span className="text-xs text-slate-500">Closed</span>
            </label>
            {!h.is_closed && (
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <input type="time" value={h.opening_time}
                  onChange={(e) => update(i, "opening_time", e.target.value)}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent" />
                <span className="text-slate-400 text-sm">—</span>
                <input type="time" value={h.closing_time}
                  onChange={(e) => update(i, "closing_time", e.target.value)}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent" />
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-medium text-sm transition-colors">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Hours
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Bookings
// ---------------------------------------------------------------------------
function BookingsTab({ workshop }: { workshop: WorkshopDetail }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const url = statusFilter === "all"
    ? `/api/service-bookings/?workshop=${workshop.id}`
    : `/api/service-bookings/?workshop=${workshop.id}&status=${statusFilter}`;
  const { data, isLoading, refetch } = useApiQuery<PaginatedResponse<ServiceBooking>>(url, { deps: [statusFilter] });
  const bookings = data?.results ?? [];
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    setUpdatingId(bookingId);
    try {
      await api.patch(`/api/service-bookings/${bookingId}/`, { status: newStatus });
      refetch();
    } catch (err) {
      alert((err as Error).message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === s ? "bg-accent text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}>
            {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      ) : bookings.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No bookings found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900">{b.customer_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {b.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {b.vehicle_year} {b.vehicle_make} {b.vehicle_model}
                    {b.vehicle_plate && ` · ${b.vehicle_plate}`}
                  </p>
                  {b.service_name && (
                    <p className="text-xs text-accent mt-0.5 flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> {b.service_name}
                    </p>
                  )}
                  {b.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{b.description}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(b.booking_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-400">{b.booking_time}</p>
                  {b.estimated_cost && (
                    <p className="text-xs text-slate-600 mt-0.5">Est: SAR {Number(b.estimated_cost || 0).toLocaleString()}</p>
                  )}
                </div>
              </div>

              {BOOKING_ACTIONS[b.status]?.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {BOOKING_ACTIONS[b.status].map((action) => (
                    <button key={action}
                      onClick={() => handleStatusChange(b.id, action)}
                      disabled={updatingId === b.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                        action === "cancelled"
                          ? "bg-red-50 hover:bg-red-100 text-red-600"
                          : action === "completed"
                          ? "bg-green-50 hover:bg-green-100 text-green-700"
                          : "bg-accent/10 hover:bg-accent/20 text-accent"
                      }`}>
                      {updatingId === b.id && <Loader2 className="w-3 h-3 animate-spin" />}
                      {action.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Reviews
// ---------------------------------------------------------------------------
function ReviewsTab({ workshop }: { workshop: WorkshopDetail }) {
  const { data, isLoading } = useApiQuery<PaginatedResponse<WorkshopReview>>(
    `/api/workshops/${workshop.id}/reviews/`
  );
  const reviews = data?.results ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-5 h-5 ${s <= Math.round(Number(workshop.average_rating || 0)) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
          ))}
        </div>
        <span className="text-lg font-bold text-slate-900">{workshop.average_rating ? Number(workshop.average_rating).toFixed(1) : "—"}</span>
        <span className="text-sm text-slate-500">({workshop.total_reviews} reviews)</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
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
                  <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
                  {!r.is_approved && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
                  )}
                </div>
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
const TABS = ["Profile", "Services", "Hours", "Bookings", "Reviews"] as const;
type Tab = typeof TABS[number];

export default function DealerWorkshopPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Profile");
  const [workshop, setWorkshop] = useState<WorkshopDetail | null>(null);

  const { data: workshops, isLoading } = useApiQuery<WorkshopDetail[]>(
    "/api/workshops/mine/",
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (workshops && workshops.length > 0) setWorkshop(workshops[0]);
  }, [workshops]);

  const [createForm, setCreateForm] = useState({ name: "", city: "", address: "", phone: "" });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSaving(true); setCreateError("");
    try {
      const created = await api.post<WorkshopDetail>("/api/workshops/", createForm);
      setWorkshop(created);
    } catch (err: unknown) {
      setCreateError((err as Error).message || "Failed to create workshop.");
    } finally {
      setCreateSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  if (!workshop) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Workshop</h1>
          <p className="text-sm text-slate-500 mt-1">You don&apos;t have a workshop yet.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm max-w-md">
          <p className="text-slate-700 font-medium mb-4">Create Your Workshop</p>
          {createError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{createError}</div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            {[
              { name: "name", label: "Workshop Name", required: true },
              { name: "city", label: "City", required: true },
              { name: "address", label: "Address" },
              { name: "phone", label: "Phone" },
            ].map(({ name, label, required }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input name={name} value={(createForm as Record<string, string>)[name]}
                  onChange={(e) => setCreateForm((p) => ({ ...p, [e.target.name]: e.target.value }))}
                  required={required}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent" />
              </div>
            ))}
            <button type="submit" disabled={createSaving}
              className="w-full py-2.5 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2">
              {createSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Workshop
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        {workshop.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={workshop.logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Wrench className="w-7 h-7 text-orange-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{workshop.name}</h1>
            {workshop.is_verified && (
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{workshop.city}{workshop.phone ? ` · ${workshop.phone}` : ""}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-slate-600">{workshop.services?.length ?? 0} services</span>
            <span className="text-sm text-slate-600">{workshop.total_bookings} bookings</span>
            <Link href={`/workshop/${workshop.id}`} target="_blank"
              className="text-xs text-accent hover:underline flex items-center gap-0.5">
              View public page <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab ? "text-accent border-b-2 border-accent -mb-px" : "text-slate-500 hover:text-slate-700"
              }`}>
              {tab}
              {tab === "Bookings" && workshop.total_bookings > 0 && (
                <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                  {workshop.total_bookings}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="p-5">
          {activeTab === "Profile"   && <ProfileTab workshop={workshop} onSaved={setWorkshop} />}
          {activeTab === "Services"  && <ServicesTab workshop={workshop} />}
          {activeTab === "Hours"     && <HoursTab workshop={workshop} onSaved={setWorkshop} />}
          {activeTab === "Bookings"  && <BookingsTab workshop={workshop} />}
          {activeTab === "Reviews"   && <ReviewsTab workshop={workshop} />}
        </div>
      </div>
    </div>
  );
}
