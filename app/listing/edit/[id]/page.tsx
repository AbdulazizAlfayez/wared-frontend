"use client";

export const dynamic = "force-dynamic";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Listing, ListingImage } from "@/lib/types";
import Link from "next/link";
import {
  Loader2, ArrowLeft, Save, Trash2, Star, Upload, X, AlertCircle, CheckCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants (mirrored from sell page)
// ---------------------------------------------------------------------------

const carMakes = [
  "Toyota","Honda","Nissan","Hyundai","Kia","Ford","Chevrolet","BMW",
  "Mercedes-Benz","Audi","Lexus","GMC","Jeep","Mazda","Mitsubishi",
  "Volkswagen","Porsche","Land Rover","Dodge","Infiniti",
];

const modelsByMake: Record<string, string[]> = {
  Toyota:["Camry","Corolla","Land Cruiser","Hilux","RAV4","Avalon","Yaris","Fortuner"],
  Honda:["Accord","Civic","CR-V","Pilot","HR-V","Odyssey"],
  Nissan:["Altima","Maxima","Patrol","X-Trail","Sentra","Kicks"],
  Hyundai:["Sonata","Elantra","Tucson","Santa Fe","Accent","Palisade"],
  Kia:["Optima","Sportage","Sorento","Cerato","Carnival"],
  Ford:["F-150","Explorer","Mustang","Edge","Expedition","Taurus"],
  Chevrolet:["Tahoe","Suburban","Silverado","Malibu","Traverse","Camaro"],
  BMW:["3 Series","5 Series","7 Series","X3","X5","X7"],
  "Mercedes-Benz":["C-Class","E-Class","S-Class","GLC","GLE","G-Class"],
  Audi:["A4","A6","A8","Q5","Q7","Q8"],
  Lexus:["ES","IS","LS","RX","LX","GX"],
  GMC:["Sierra","Yukon","Terrain","Acadia","Canyon"],
  Jeep:["Wrangler","Grand Cherokee","Cherokee","Compass","Gladiator"],
  Mazda:["Mazda3","Mazda6","CX-5","CX-9","MX-5"],
  Mitsubishi:["Pajero","Outlander","ASX","L200","Eclipse Cross"],
  Volkswagen:["Passat","Jetta","Tiguan","Atlas","Golf"],
  Porsche:["Cayenne","Panamera","Macan","911","Taycan"],
  "Land Rover":["Range Rover","Range Rover Sport","Defender","Discovery"],
  Dodge:["Charger","Challenger","Durango","Ram 1500"],
  Infiniti:["Q50","Q60","QX50","QX60","QX80"],
};

const cities = [
  "Riyadh","Jeddah","Mecca","Medina","Dammam","Khobar","Dhahran",
  "Taif","Tabuk","Abha","Khamis Mushait","Buraidah","Najran","Yanbu","Jubail",
];

const colors = [
  "White","Black","Silver","Gray","Red","Blue","Green",
  "Brown","Beige","Gold","Orange","Yellow",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 25 }, (_, i) => currentYear - i);

// ---------------------------------------------------------------------------
// Form shape
// ---------------------------------------------------------------------------

interface EditForm {
  make: string;
  model: string;
  year: string;
  price: string;
  mileage: string;
  condition: string;
  fuel_type: string;
  transmission: string;
  body_type: string;
  color: string;
  color_interior: string;
  city: string;
  title: string;
  description: string;
  vin: string;
  negotiable: boolean;
  accident_history: boolean;
  accident_description: string;
  warranty_remaining: boolean;
  service_history: boolean;
  customs_cleared: boolean;
  imported_from: string;
  drive_type: string;
  engine_size: string;
  horsepower: string;
  seats: string;
  doors: string;
}

const toForm = (l: Listing): EditForm => ({
  make: l.make ?? "",
  model: l.model ?? "",
  year: String(l.year ?? ""),
  price: String(l.price ?? ""),
  mileage: String(l.mileage ?? ""),
  condition: l.condition ?? "used",
  fuel_type: l.fuel_type ?? "",
  transmission: l.transmission ?? "",
  body_type: l.body_type ?? "",
  color: l.color ?? "",
  color_interior: l.color_interior ?? "",
  city: l.city ?? "",
  title: l.title ?? "",
  description: l.description ?? "",
  vin: l.vin ?? "",
  negotiable: l.negotiable ?? false,
  accident_history: l.accident_history ?? false,
  accident_description: l.accident_description ?? "",
  warranty_remaining: l.warranty_remaining ?? false,
  service_history: l.service_history ?? false,
  customs_cleared: l.customs_cleared ?? false,
  imported_from: l.imported_from ?? "",
  drive_type: l.drive_type ?? "",
  engine_size: l.engine_size ?? "",
  horsepower: String(l.horsepower ?? ""),
  seats: String(l.seats ?? ""),
  doors: String(l.doors ?? ""),
});

// ---------------------------------------------------------------------------
// Image manager component
// ---------------------------------------------------------------------------

function ImageManager({
  listingId,
  existingImages,
  onImagesChange,
}: {
  listingId: number;
  existingImages: ListingImage[];
  onImagesChange: () => void;
}) {
  const [images, setImages] = useState<ListingImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const getCsrf = () => {
    if (typeof document === "undefined") return "";
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("image", file);
        fd.append("is_primary", images.length === 0 ? "true" : "false");
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/listings/${listingId}/images/`,
          {
            method: "POST",
            credentials: "include",
            headers: { "X-CSRFToken": getCsrf() },
            body: fd,
          }
        );
      }
      // Refresh images
      const updated = await api.get<{ results: ListingImage[] }>(
        `/api/listings/${listingId}/images/`
      );
      setImages(updated.results ?? []);
      onImagesChange();
    } catch {
      alert("Failed to upload image(s).");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (imgId: number) => {
    if (!confirm("Delete this image?")) return;
    setDeletingId(imgId);
    try {
      await api.delete(`/api/listings/${listingId}/images/${imgId}/`);
      setImages((prev) => prev.filter((i) => i.id !== imgId));
      onImagesChange();
    } catch {
      alert("Failed to delete image.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (imgId: number) => {
    setSettingPrimary(imgId);
    try {
      await api.patch(`/api/listings/${listingId}/images/${imgId}/`, { is_primary: true });
      setImages((prev) =>
        prev.map((i) => ({ ...i, is_primary: i.id === imgId }))
      );
    } catch {
      alert("Failed to set primary image.");
    } finally {
      setSettingPrimary(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">
          Photos ({images.length}/10)
        </p>
        <label className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 hover:border-accent hover:text-accent text-slate-600 rounded-xl text-sm font-medium cursor-pointer transition-colors">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Uploading…" : "Add Photos"}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={handleUpload}
            disabled={uploading || images.length >= 10}
          />
        </label>
      </div>

      {images.length === 0 ? (
        <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm">
          No photos yet. Click &quot;Add Photos&quot; to upload.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative group rounded-xl overflow-hidden aspect-square border-2 ${
                img.is_primary ? "border-accent" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url || img.image}
                alt=""
                className="w-full h-full object-cover"
              />
              {img.is_primary && (
                <div className="absolute top-1 left-1 bg-accent text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Primary
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {!img.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(img.id)}
                    disabled={settingPrimary === img.id}
                    className="p-1 bg-white/90 rounded-lg text-accent hover:bg-white transition-colors"
                    title="Set as primary"
                  >
                    {settingPrimary === img.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Star className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(img.id)}
                  disabled={deletingId === img.id}
                  className="p-1 bg-white/90 rounded-lg text-red-500 hover:bg-white transition-colors"
                  title="Delete"
                >
                  {deletingId === img.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field components
// ---------------------------------------------------------------------------

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm";
const selectCls = inputCls;

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
        checked
          ? "border-accent bg-accent/5 text-accent"
          : "border-slate-200 text-slate-600 hover:border-slate-300"
      }`}
    >
      <span
        className={`w-8 h-4 rounded-full transition-colors flex items-center ${
          checked ? "bg-accent" : "bg-slate-200"
        }`}
      >
        <span
          className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/listings/${id}/`);
      router.push("/dashboard/listings");
    } catch {
      setError("Could not delete the listing. Please try again.");
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/auth/signin");
  }, [authLoading, isAuthenticated, router]);

  // Fetch listing
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    (async () => {
      try {
        const l = await api.get<Listing>(`/api/listings/${id}/`);
        // Ownership check
        if (user && l.owner_id && l.owner_id !== user.id && user.role !== "admin") {
          router.replace("/dashboard/listings");
          return;
        }
        setListing(l);
        setForm(toForm(l));
      } catch {
        router.replace("/dashboard/listings");
      } finally {
        setIsFetching(false);
      }
    })();
  }, [isAuthenticated, id, user, router]);

  const update = useCallback(<K extends keyof EditForm>(field: K, value: EditForm[K]) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (field === "make") next.model = "";
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !listing) return;
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload: Record<string, unknown> = {
        make: form.make,
        model: form.model,
        year: Number(form.year),
        price: Number(form.price),
        mileage: Number(form.mileage),
        condition: form.condition,
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        body_type: form.body_type || undefined,
        color: form.color,
        color_interior: form.color_interior,
        city: form.city,
        title: form.title,
        description: form.description || undefined,
        negotiable: form.negotiable,
        accident_history: form.accident_history,
        warranty_remaining: form.warranty_remaining,
        service_history: form.service_history,
        customs_cleared: form.customs_cleared,
      };
      if (form.vin) payload.vin = form.vin;
      if (form.accident_description) payload.accident_description = form.accident_description;
      if (form.imported_from) payload.imported_from = form.imported_from;
      if (form.drive_type) payload.drive_type = form.drive_type;
      if (form.engine_size) payload.engine_size = form.engine_size;
      if (form.horsepower) payload.horsepower = Number(form.horsepower);
      if (form.seats) payload.seats = Number(form.seats);
      if (form.doors) payload.doors = Number(form.doors);

      await api.patch(`/api/listings/${listing.id}/`, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save changes.";
      try {
        const parsed = JSON.parse(msg);
        const first = Object.values(parsed)[0];
        setError(Array.isArray(first) ? String(first[0]) : String(first));
      } catch {
        setError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isFetching) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!form || !listing) return null;

  const models = form.make ? (modelsByMake[form.make] ?? []) : [];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard/listings"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Listings
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Listing</h1>
            <p className="text-sm text-slate-500 mt-1">
              {listing.year} {listing.make} {listing.model} ·{" "}
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                listing.status === "approved" ? "bg-green-100 text-green-700" :
                listing.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                listing.status === "rejected" ? "bg-red-100 text-red-700" :
                "bg-slate-100 text-slate-600"
              }`}>
                {listing.status}
              </span>
            </p>
          </div>
          <Link
            href={`/car/${listing.id}`}
            target="_blank"
            className="text-xs text-accent hover:underline"
          >
            View listing →
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Photos</h2>
            <ImageManager
              listingId={listing.id}
              existingImages={listing.images}
              onImagesChange={() => {}}
            />
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Title">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  className={inputCls}
                  required
                />
              </Field>

              <Field label="Make">
                <select value={form.make} onChange={(e) => update("make", e.target.value)} className={selectCls} required>
                  <option value="">Select make</option>
                  {carMakes.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>

              <Field label="Model">
                <select value={form.model} onChange={(e) => update("model", e.target.value)} className={selectCls} required>
                  <option value="">Select model</option>
                  {models.map((m) => <option key={m}>{m}</option>)}
                  {!models.includes(form.model) && form.model && (
                    <option value={form.model}>{form.model}</option>
                  )}
                </select>
              </Field>

              <Field label="Year">
                <select value={form.year} onChange={(e) => update("year", e.target.value)} className={selectCls} required>
                  <option value="">Select year</option>
                  {years.map((y) => <option key={y}>{y}</option>)}
                </select>
              </Field>

              <Field label="Price (SAR)">
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  className={inputCls}
                  min="0"
                  required
                />
              </Field>

              <Field label="Mileage (km)">
                <input
                  type="number"
                  value={form.mileage}
                  onChange={(e) => update("mileage", e.target.value)}
                  className={inputCls}
                  min="0"
                  required
                />
              </Field>

              <Field label="Condition">
                <select value={form.condition} onChange={(e) => update("condition", e.target.value)} className={selectCls}>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="certified">Certified Pre-Owned</option>
                </select>
              </Field>

              <Field label="City">
                <select value={form.city} onChange={(e) => update("city", e.target.value)} className={selectCls} required>
                  <option value="">Select city</option>
                  {cities.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Exterior Color">
                <select value={form.color} onChange={(e) => update("color", e.target.value)} className={selectCls}>
                  <option value="">Select color</option>
                  {colors.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Interior Color">
                <select value={form.color_interior} onChange={(e) => update("color_interior", e.target.value)} className={selectCls}>
                  <option value="">Select color</option>
                  {colors.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={4}
                  className={inputCls}
                  placeholder="Describe your car..."
                />
              </Field>
            </div>
          </div>

          {/* Specs */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Specs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Fuel Type">
                <select value={form.fuel_type} onChange={(e) => update("fuel_type", e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  {["Petrol","Diesel","Hybrid","Electric","Gas"].map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>

              <Field label="Transmission">
                <select value={form.transmission} onChange={(e) => update("transmission", e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  <option>Automatic</option>
                  <option>Manual</option>
                  <option>CVT</option>
                  <option>Dual-clutch</option>
                </select>
              </Field>

              <Field label="Body Type">
                <select value={form.body_type} onChange={(e) => update("body_type", e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  {["Sedan","SUV","Pickup","Van","Hatchback","Coupe","Convertible","Wagon"].map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>

              <Field label="Drive Type">
                <select value={form.drive_type} onChange={(e) => update("drive_type", e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  {["FWD","RWD","AWD","4WD"].map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>

              <Field label="Engine Size (L)">
                <input type="text" value={form.engine_size} onChange={(e) => update("engine_size", e.target.value)} className={inputCls} placeholder="e.g. 2.0" />
              </Field>

              <Field label="Horsepower (hp)">
                <input type="number" value={form.horsepower} onChange={(e) => update("horsepower", e.target.value)} className={inputCls} min="0" />
              </Field>

              <Field label="Seats">
                <select value={form.seats} onChange={(e) => update("seats", e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  {[2,4,5,6,7,8,9].map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>

              <Field label="Doors">
                <select value={form.doors} onChange={(e) => update("doors", e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  {[2,3,4,5].map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>

              <Field label="VIN" hint="Optional — last 4 digits shown publicly">
                <input type="text" value={form.vin} onChange={(e) => update("vin", e.target.value)} className={inputCls} maxLength={17} placeholder="17-character VIN" />
              </Field>

              <Field label="Imported From">
                <select value={form.imported_from} onChange={(e) => update("imported_from", e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  {[["local","Local (Saudi)"],["gcc","GCC"],["american","USA"],["european","Europe"],["korean","Korea"],["japanese","Japan"]].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Saudi-specific */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Saudi-specific Details</h2>
            <div className="flex flex-wrap gap-3">
              <Toggle label="Negotiable" checked={form.negotiable} onChange={(v) => update("negotiable", v)} />
              <Toggle label="Warranty Remaining" checked={form.warranty_remaining} onChange={(v) => update("warranty_remaining", v)} />
              <Toggle label="Service History" checked={form.service_history} onChange={(v) => update("service_history", v)} />
              <Toggle label="Customs Cleared" checked={form.customs_cleared} onChange={(v) => update("customs_cleared", v)} />
              <Toggle label="Accident History" checked={form.accident_history} onChange={(v) => update("accident_history", v)} />
            </div>
            {form.accident_history && (
              <div className="mt-4">
                <Field label="Accident Description">
                  <textarea
                    value={form.accident_description}
                    onChange={(e) => update("accident_description", e.target.value)}
                    rows={3}
                    className={inputCls}
                    placeholder="Describe the accident(s)..."
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Save button */}
          {saveError && (
            <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {saveError}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Changes saved successfully!
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/dashboard/listings"
              className="flex-1 py-3 text-center border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-5 h-5" /> Save Changes</>
              )}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-8 bg-white rounded-2xl border border-red-200 p-6">
          <h2 className="text-base font-semibold text-red-700 mb-1">Danger Zone</h2>
          <p className="text-sm text-slate-500 mb-4">
            Deleting this listing removes it from the marketplace permanently. This cannot be undone.
          </p>
          {!confirmingDelete ? (
            <button type="button" onClick={() => setConfirmingDelete(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-red-300 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" /> Delete this listing
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-red-700">Are you sure?</span>
              <button type="button" onClick={handleDelete} disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl text-sm font-semibold transition-colors">
                {isDeleting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>) : (<><Trash2 className="w-4 h-4" /> Yes, delete permanently</>)}
              </button>
              <button type="button" onClick={() => setConfirmingDelete(false)} disabled={isDeleting}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
