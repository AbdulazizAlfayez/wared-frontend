"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Image from "next/image";
import {
  ArrowLeft, ArrowRight, CheckCircle, Loader2, Upload, X,
  Car, Globe, DollarSign, Ship, Shield, Camera, AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/Toast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TABS = [
  { id: 1, label: "Basic Info",    icon: Car },
  { id: 2, label: "Source",        icon: Globe },
  { id: 3, label: "Cost",          icon: DollarSign },
  { id: 4, label: "Shipping",      icon: Ship },
  { id: 5, label: "History",       icon: Shield },
  { id: 6, label: "Photos",        icon: Camera },
] as const;

const SOURCE_COUNTRIES = [
  { value: "usa",     label: "🇺🇸 United States" },
  { value: "japan",   label: "🇯🇵 Japan" },
  { value: "korea",   label: "🇰🇷 South Korea" },
  { value: "uae",     label: "🇦🇪 UAE" },
  { value: "germany", label: "🇩🇪 Germany" },
  { value: "canada",  label: "🇨🇦 Canada" },
  { value: "uk",      label: "🇬🇧 United Kingdom" },
  { value: "europe",  label: "🇪🇺 Europe" },
];

const AUCTION_SOURCES = ["Copart", "IAAI", "USS Japan", "Manheim", "TAA Japan", "JU Group", "Private", "Other"];

const PORTS_OF_ENTRY = ["Dammam", "Jeddah", "Jubail", "Yanbu", "Jizan", "Riyadh (Dry Port)"];

const CURRENCIES = ["USD", "JPY", "AED", "KRW", "EUR", "CAD", "GBP"];

const BODY_TYPES = ["Sedan", "SUV", "Coupe", "Hatchback", "Pickup", "Van", "Wagon", "Convertible", "Other"];

const FUEL_TYPES = ["Gasoline", "Diesel", "Hybrid", "Electric", "Plug-in Hybrid"];

const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "Semi-Automatic"];

const SPEC_ORIGINS = [
  { value: "gcc",      label: "GCC Specs" },
  { value: "american", label: "US Specs" },
  { value: "japanese", label: "Japan Specs" },
  { value: "european", label: "European Specs" },
  { value: "korean",   label: "Korean Specs" },
  { value: "other",    label: "Other" },
];

const IMPORT_STATUSES = [
  { value: "available",         label: "Available" },
  { value: "arriving",          label: "Arriving Soon" },
  { value: "in_transit",        label: "In Transit" },
  { value: "at_port",           label: "At Port" },
  { value: "customs_clearance", label: "Customs Clearance" },
  { value: "delivered",         label: "Delivered" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const INPUT = "w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none text-sm bg-white";
const LABEL = "block text-sm font-semibold text-slate-700 mb-1.5";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Select({
  value, onChange, options, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
}) {
  const opts = typeof options[0] === "string"
    ? (options as string[]).map(s => ({ value: s.toLowerCase().replace(/\s/g,"_"), label: s }))
    : options as { value: string; label: string }[];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={INPUT}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function NumberInput({ value, onChange, placeholder, prefix }: {
  value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium select-none">{prefix}</span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT} ${prefix ? "pl-14" : ""}`}
      />
    </div>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none py-1">
      <div
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          checked ? "bg-accent border-accent" : "border-slate-300 bg-white"
        }`}
      >
        {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------
interface FormData {
  // Tab 1
  make: string; model: string; year: string; trim: string;
  body_type: string; color: string; mileage: string; vin: string;
  fuel_type: string; transmission: string; engine_size: string;
  // Tab 2
  source_country: string; source_city: string; auction_source: string;
  auction_lot: string; original_listing_url: string;
  source_price: string; source_currency: string;
  // Tab 3
  shipping_cost: string; customs_duty: string; vat_amount: string;
  inspection_fee: string; transportation_cost: string; agent_fees: string;
  other_fees: string; profit_margin: string; final_price_sar: string;
  // Tab 4
  import_status: string; vessel_name: string; shipping_line: string;
  bill_of_lading: string; port_of_origin: string; port_of_entry: string;
  estimated_arrival_date: string;
  gcc_specs: boolean; spec_origin: string; emissions_compliant: boolean;
  // Tab 5
  carfax_url: string; autocheck_url: string;
  has_salvage_title: boolean; flood_damage: boolean; frame_damage: boolean;
  damage_description: string;
  accident_history: boolean; warranty_remaining: boolean; service_history: boolean;
  customs_cleared: boolean;
}

const INITIAL: FormData = {
  make:"", model:"", year:"", trim:"", body_type:"", color:"", mileage:"", vin:"",
  fuel_type:"", transmission:"", engine_size:"",
  source_country:"", source_city:"", auction_source:"", auction_lot:"",
  original_listing_url:"", source_price:"", source_currency:"USD",
  shipping_cost:"", customs_duty:"", vat_amount:"", inspection_fee:"",
  transportation_cost:"", agent_fees:"", other_fees:"", profit_margin:"",
  final_price_sar:"",
  import_status:"available", vessel_name:"", shipping_line:"", bill_of_lading:"",
  port_of_origin:"", port_of_entry:"", estimated_arrival_date:"",
  gcc_specs:false, spec_origin:"", emissions_compliant:true,
  carfax_url:"", autocheck_url:"",
  has_salvage_title:false, flood_damage:false, frame_damage:false,
  damage_description:"",
  accident_history:false, warranty_remaining:false, service_history:false,
  customs_cleared:false,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ListCarPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof FormData) => (val: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: val }));
    // Clear error for this field when the user edits it
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  // URL validation on blur
  const validateUrl = (key: keyof FormData) => () => {
    const val = form[key];
    if (typeof val === "string" && val.trim() && !/^https?:\/\//i.test(val.trim())) {
      setErrors(prev => ({ ...prev, [key]: "Enter a valid URL starting with https://" }));
    }
  };

  // Helper: get error-aware input class
  const inputCls = (key: keyof FormData) => `${INPUT} ${errors[key] ? "border-red-400 ring-1 ring-red-200" : ""}`;

  // Helper: render field error message
  const fieldError = (key: keyof FormData) => errors[key] ? <p className="text-red-500 text-xs mt-1">{errors[key]}</p> : null;

  // Auto-calculate total landed cost
  const calcLanded = () => {
    const nums = [form.shipping_cost, form.customs_duty, form.vat_amount, form.inspection_fee,
      form.transportation_cost, form.agent_fees, form.other_fees];
    const sum = nums.reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
    return sum > 0 ? sum : null;
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newPhotos = [...photos, ...files].slice(0, 20);
    setPhotos(newPhotos);
    const previews = newPhotos.map(f => URL.createObjectURL(f));
    setPhotoPreviews(previews);
    if (e.target) e.target.value = "";
  };

  const removePhoto = (i: number) => {
    const np = photos.filter((_, idx) => idx !== i);
    const nv = photoPreviews.filter((_, idx) => idx !== i);
    setPhotos(np);
    setPhotoPreviews(nv);
    if (primaryIndex >= np.length) setPrimaryIndex(Math.max(0, np.length - 1));
  };

  const validateTab = (tab: number): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (tab === 1) {
      if (!form.make)   e.make = "Required";
      if (!form.model)  e.model = "Required";
      if (!form.year || parseInt(form.year) < 1990 || parseInt(form.year) > new Date().getFullYear() + 1)
        e.year = "Enter a valid year";
      if (!form.mileage) e.mileage = "Required";
    }
    if (tab === 2) {
      if (!form.source_country) e.source_country = "Required";
      if (!form.source_price)   e.source_price = "Required";
    }
    if (tab === 3) {
      if (!form.final_price_sar) e.final_price_sar = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateTab(activeTab)) return;
    setActiveTab(t => Math.min(t + 1, 6));
  };

  const goPrev = () => setActiveTab(t => Math.max(t - 1, 1));

  const handleSubmit = async () => {
    if (!validateTab(activeTab)) return;
    if (!isAuthenticated) { showToast("error", "Please sign in."); return; }

    setIsSubmitting(true);
    try {
      // Build payload
      const title = `${form.year} ${form.make} ${form.model}${form.trim ? ` ${form.trim}` : ""}`;
      const payload: Record<string, unknown> = {
        title,
        make:           form.make,
        model:          form.model,
        year:           parseInt(form.year),
        body_type:      form.body_type || undefined,
        color:          form.color || undefined,
        mileage:        parseInt(form.mileage),
        city:           "Riyadh", // default; importer can edit later
        vin:            form.vin || undefined,
        fuel_type:      form.fuel_type || undefined,
        transmission:   form.transmission || undefined,
        engine_size:    form.engine_size || undefined,
        // Source
        source_country: form.source_country || undefined,
        source_city:    form.source_city || undefined,
        auction_source: form.auction_source || undefined,
        auction_lot:    form.auction_lot || undefined,
        source_price:   form.source_price ? parseFloat(form.source_price) : undefined,
        source_currency:form.source_currency || undefined,
        // Costs
        shipping_cost:       form.shipping_cost   ? parseFloat(form.shipping_cost)   : undefined,
        customs_duty_amount: form.customs_duty     ? parseFloat(form.customs_duty)    : undefined,
        vat_amount:          form.vat_amount       ? parseFloat(form.vat_amount)      : undefined,
        inspection_fee:      form.inspection_fee   ? parseFloat(form.inspection_fee)  : undefined,
        final_price_sar:     form.final_price_sar  ? parseFloat(form.final_price_sar) : undefined,
        // Shipping
        import_status:           form.import_status || "available",
        vessel_name:             form.vessel_name || undefined,
        shipping_line:           form.shipping_line || undefined,
        bill_of_lading_number:   form.bill_of_lading || undefined,
        port_of_origin:          form.port_of_origin || undefined,
        port_of_entry:           form.port_of_entry || undefined,
        estimated_arrival_date:  form.estimated_arrival_date || undefined,
        gcc_specs:               form.gcc_specs,
        spec_origin:             form.spec_origin || undefined,
        // History
        has_salvage_title:       form.has_salvage_title,
        odometer_verified:       false,
        accident_history:        form.accident_history,
        warranty_remaining:      form.warranty_remaining,
        service_history:         form.service_history,
        customs_cleared:         form.customs_cleared,
        damage_description:      form.damage_description || undefined,
        // Price (backward compat)
        price:                   form.final_price_sar ? parseFloat(form.final_price_sar) : 0,
        condition:               "used",
      };

      const newListing = await api.post<{ id: number }>("/api/listings/", payload);

      // Upload photos if any
      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const fd = new FormData();
          fd.append("image", photos[i]);
          fd.append("is_primary", (i === primaryIndex).toString());
          fd.append("order", i.toString());
          try {
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/listings/${newListing.id}/images/`,
              {
                method: "POST",
                credentials: "include",
                body: fd,
              }
            );
          } catch { /* non-fatal */ }
        }
      }

      showToast("success", "Car listed successfully!");
      router.push(`/car/${newListing.id}`);
    } catch (err: unknown) {
      // Surface real field errors from the backend
      const raw = err instanceof Error ? err.message : String(err);
      try {
        const body = JSON.parse(raw) as Record<string, string | string[]>;
        const fieldErrors: Record<string, string> = {};
        for (const [k, v] of Object.entries(body)) {
          if (k === "language") continue;
          fieldErrors[k] = Array.isArray(v) ? v[0] : String(v);
        }
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          // Navigate to the first tab with an error
          const tab1Fields = ["make", "model", "year", "mileage", "vin", "body_type", "color", "title", "city"];
          const tab2Fields = ["source_country", "source_city", "auction_source", "source_price", "source_currency"];
          const tab3Fields = ["shipping_cost", "customs_duty_amount", "vat_amount", "inspection_fee", "final_price_sar", "price"];
          const errorKeys = Object.keys(fieldErrors);
          if (errorKeys.some(k => tab1Fields.includes(k))) setActiveTab(1);
          else if (errorKeys.some(k => tab2Fields.includes(k))) setActiveTab(2);
          else if (errorKeys.some(k => tab3Fields.includes(k))) setActiveTab(3);
          showToast("error", "Please fix the highlighted fields.");
        } else {
          showToast("error", "Failed to list car. Please check all required fields.");
        }
      } catch {
        showToast("error", "Failed to list car. Please check all required fields.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Tab Content
  // ---------------------------------------------------------------------------
  const renderTab = () => {
    switch (activeTab) {
      case 1:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Make *">
              <input className={inputCls("make")} value={form.make}
                onChange={e => set("make")(e.target.value)} placeholder="e.g. Toyota" />
              {fieldError("make")}
            </Field>
            <Field label="Model *">
              <input className={inputCls("model")} value={form.model}
                onChange={e => set("model")(e.target.value)} placeholder="e.g. Camry" />
              {fieldError("model")}
            </Field>
            <Field label="Year *">
              <input type="number" className={inputCls("year")} value={form.year}
                onChange={e => set("year")(e.target.value)} placeholder="e.g. 2022" min="1990" max={new Date().getFullYear() + 1} />
              {fieldError("year")}
            </Field>
            <Field label="Trim / Variant">
              <input className={inputCls("trim")} value={form.trim} onChange={e => set("trim")(e.target.value)} placeholder="e.g. XLE, Sport" />
              {fieldError("trim")}
            </Field>
            <Field label="Body Type">
              <Select value={form.body_type} onChange={set("body_type")} options={BODY_TYPES} placeholder="Select body type" />
              {fieldError("body_type")}
            </Field>
            <Field label="Color">
              <input className={inputCls("color")} value={form.color} onChange={e => set("color")(e.target.value)} placeholder="e.g. Pearl White" />
              {fieldError("color")}
            </Field>
            <Field label="Mileage (km) *">
              <NumberInput value={form.mileage} onChange={set("mileage")} placeholder="e.g. 45000" />
              {fieldError("mileage")}
            </Field>
            <Field label="VIN" hint="17-character Vehicle Identification Number">
              <input className={inputCls("vin")} value={form.vin} onChange={e => set("vin")(e.target.value)} placeholder="1HGCM82633A004352" maxLength={17} />
              {fieldError("vin")}
            </Field>
            <Field label="Fuel Type">
              <Select value={form.fuel_type} onChange={set("fuel_type")} options={FUEL_TYPES} placeholder="Select fuel type" />
              {fieldError("fuel_type")}
            </Field>
            <Field label="Transmission">
              <Select value={form.transmission} onChange={set("transmission")} options={TRANSMISSIONS} placeholder="Select transmission" />
              {fieldError("transmission")}
            </Field>
            <Field label="Engine Size">
              <input className={inputCls("engine_size")} value={form.engine_size} onChange={e => set("engine_size")(e.target.value)} placeholder="e.g. 2.5L" />
              {fieldError("engine_size")}
            </Field>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Source Country *">
              <Select value={form.source_country} onChange={set("source_country")} options={SOURCE_COUNTRIES} placeholder="Select country" />
              {fieldError("source_country")}
            </Field>
            <Field label="Source City">
              <input className={inputCls("source_city")} value={form.source_city} onChange={e => set("source_city")(e.target.value)} placeholder="e.g. Los Angeles, CA" />
              {fieldError("source_city")}
            </Field>
            <Field label="Auction Source">
              <Select value={form.auction_source} onChange={set("auction_source")}
                options={AUCTION_SOURCES.map(a => ({ value: a.toLowerCase().replace(/\s/g,"_"), label: a }))}
                placeholder="Select auction" />
              {fieldError("auction_source")}
            </Field>
            <Field label="Auction Lot Number">
              <input className={inputCls("auction_lot")} value={form.auction_lot} onChange={e => set("auction_lot")(e.target.value)} placeholder="e.g. 12345678" />
              {fieldError("auction_lot")}
            </Field>
            <Field label="Source Price *">
              <NumberInput value={form.source_price} onChange={set("source_price")} placeholder="e.g. 8500" />
              {fieldError("source_price")}
            </Field>
            <Field label="Source Currency">
              <Select value={form.source_currency} onChange={set("source_currency")}
                options={CURRENCIES.map(c => ({ value: c, label: c }))} />
              {fieldError("source_currency")}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Original Auction Listing URL">
                <input className={inputCls("original_listing_url")} value={form.original_listing_url}
                  onChange={e => set("original_listing_url")(e.target.value)}
                  onBlur={validateUrl("original_listing_url")}
                  placeholder="https://www.copart.com/lot/..." type="url" />
                {fieldError("original_listing_url")}
              </Field>
            </div>
          </div>
        );

      case 3: {
        const landed = calcLanded();
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Shipping Cost (SAR)">
              <NumberInput value={form.shipping_cost} onChange={set("shipping_cost")} placeholder="e.g. 3500" prefix="SAR" />
            </Field>
            <Field label="Customs Duty (SAR)" hint="Typically 5% of car value">
              <NumberInput value={form.customs_duty} onChange={set("customs_duty")} placeholder="e.g. 2000" prefix="SAR" />
            </Field>
            <Field label="VAT (SAR)" hint="15% of (car + customs)">
              <NumberInput value={form.vat_amount} onChange={set("vat_amount")} placeholder="e.g. 3000" prefix="SAR" />
            </Field>
            <Field label="Inspection Fee (SAR)">
              <NumberInput value={form.inspection_fee} onChange={set("inspection_fee")} placeholder="e.g. 800" prefix="SAR" />
            </Field>
            <Field label="Transportation (SAR)">
              <NumberInput value={form.transportation_cost} onChange={set("transportation_cost")} placeholder="e.g. 500" prefix="SAR" />
            </Field>
            <Field label="Agent Fees (SAR)">
              <NumberInput value={form.agent_fees} onChange={set("agent_fees")} placeholder="e.g. 0" prefix="SAR" />
            </Field>
            <Field label="Other Fees (SAR)">
              <NumberInput value={form.other_fees} onChange={set("other_fees")} placeholder="e.g. 0" prefix="SAR" />
            </Field>
            {landed != null && (
              <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Auto-calculated Landed Cost</span>
                  <span className="text-lg font-black text-accent">
                    SAR {new Intl.NumberFormat("en-SA").format(landed)}
                  </span>
                </div>
              </div>
            )}
            <div className="sm:col-span-2">
              <Field label="Profit Margin (SAR)">
                <NumberInput value={form.profit_margin} onChange={set("profit_margin")} placeholder="Your markup" prefix="SAR" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Final Asking Price (SAR) *">
                <NumberInput value={form.final_price_sar} onChange={set("final_price_sar")} placeholder="Total price buyer pays" prefix="SAR" />
                {fieldError("final_price_sar")}
              </Field>
            </div>
          </div>
        );
      }

      case 4:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Import Status">
              <Select value={form.import_status} onChange={set("import_status")} options={IMPORT_STATUSES} />
            </Field>
            <Field label="Spec Origin">
              <Select value={form.spec_origin} onChange={set("spec_origin")} options={SPEC_ORIGINS} placeholder="Select spec origin" />
            </Field>
            <Field label="Port of Origin">
              <input className={INPUT} value={form.port_of_origin} onChange={e => set("port_of_origin")(e.target.value)} placeholder="e.g. Los Angeles" />
            </Field>
            <Field label="Port of Entry">
              <Select value={form.port_of_entry} onChange={set("port_of_entry")} options={PORTS_OF_ENTRY.map(p => ({ value: p.toLowerCase().replace(/\s/g,"_"), label: p }))} placeholder="Select port" />
            </Field>
            <Field label="Shipping Company">
              <input className={INPUT} value={form.shipping_line} onChange={e => set("shipping_line")(e.target.value)} placeholder="e.g. WALLENIUS" />
            </Field>
            <Field label="Vessel Name">
              <input className={INPUT} value={form.vessel_name} onChange={e => set("vessel_name")(e.target.value)} placeholder="e.g. MV Euphoria" />
            </Field>
            <Field label="Bill of Lading #">
              <input className={INPUT} value={form.bill_of_lading} onChange={e => set("bill_of_lading")(e.target.value)} placeholder="BL number" />
            </Field>
            <Field label="Estimated Arrival Date">
              <input type="date" className={INPUT} value={form.estimated_arrival_date}
                onChange={e => set("estimated_arrival_date")(e.target.value)}
                min={new Date().toISOString().split("T")[0]} />
            </Field>
            <div className="sm:col-span-2 space-y-1">
              <Checkbox checked={form.gcc_specs} onChange={v => set("gcc_specs")(v)} label="GCC Specs" />
              <Checkbox checked={form.emissions_compliant} onChange={v => set("emissions_compliant")(v)} label="Emissions Compliant" />
              <Checkbox checked={form.customs_cleared} onChange={v => set("customs_cleared")(v)} label="Customs Already Cleared" />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Carfax Report URL">
              <input className={inputCls("carfax_url")} value={form.carfax_url}
                onChange={e => set("carfax_url")(e.target.value)}
                onBlur={validateUrl("carfax_url")}
                placeholder="https://www.carfax.com/..." type="url" />
              {fieldError("carfax_url")}
            </Field>
            <Field label="AutoCheck Report URL">
              <input className={inputCls("autocheck_url")} value={form.autocheck_url}
                onChange={e => set("autocheck_url")(e.target.value)}
                onBlur={validateUrl("autocheck_url")}
                placeholder="https://www.autocheck.com/..." type="url" />
              {fieldError("autocheck_url")}
            </Field>
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-slate-700 mb-3">Vehicle Condition Flags</p>
              <div className="grid grid-cols-2 gap-2">
                <Checkbox checked={form.has_salvage_title} onChange={v => set("has_salvage_title")(v)} label="Has Salvage Title" />
                <Checkbox checked={form.flood_damage} onChange={v => set("flood_damage")(v)} label="Flood Damage" />
                <Checkbox checked={form.frame_damage} onChange={v => set("frame_damage")(v)} label="Frame Damage" />
                <Checkbox checked={form.accident_history} onChange={v => set("accident_history")(v)} label="Accident History" />
                <Checkbox checked={form.warranty_remaining} onChange={v => set("warranty_remaining")(v)} label="Warranty Remaining" />
                <Checkbox checked={form.service_history} onChange={v => set("service_history")(v)} label="Service History Available" />
              </div>
            </div>
            {(form.has_salvage_title || form.flood_damage || form.frame_damage || form.accident_history) && (
              <div className="sm:col-span-2">
                <Field label="Damage Description">
                  <textarea
                    className={`${INPUT} resize-none`}
                    rows={3}
                    value={form.damage_description}
                    onChange={e => set("damage_description")(e.target.value)}
                    placeholder="Describe the damage or condition..."
                  />
                </Field>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-5">
            <p className="text-sm text-slate-500">Upload up to 20 photos. Click a photo to set it as the primary image.</p>
            <div
              className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-accent/50 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Click to upload photos</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 10MB each · Max 20 photos</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoAdd}
              />
            </div>

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {photoPreviews.map((src, i) => (
                  <div
                    key={i}
                    className={`relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group border-2 transition-all ${
                      i === primaryIndex ? "border-accent shadow-md" : "border-transparent hover:border-slate-200"
                    }`}
                    onClick={() => setPrimaryIndex(i)}
                  >
                    <Image src={src} alt={`Photo ${i+1}`} fill className="object-cover" />
                    {i === primaryIndex && (
                      <div className="absolute top-1 left-1 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        Primary
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div
                  className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900">List New Imported Car</h1>
          <p className="text-slate-500 text-sm mt-0.5">Fill in all sections to publish your listing.</p>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="bg-white rounded-2xl border border-slate-100 p-1.5 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const done = activeTab > tab.id;
          // Check if any error belongs to this tab
          const tabFieldMap: Record<number, string[]> = {
            1: ["make","model","year","mileage","vin","body_type","color","title","city","trim","fuel_type","transmission","engine_size"],
            2: ["source_country","source_city","auction_source","auction_lot","source_price","source_currency","original_listing_url"],
            3: ["shipping_cost","customs_duty_amount","vat_amount","inspection_fee","final_price_sar","price","transportation_cost"],
            4: ["import_status","spec_origin","port_of_origin","port_of_entry","shipping_line","vessel_name","bill_of_lading_number","estimated_arrival_date"],
            5: ["carfax_url","autocheck_url","has_salvage_title","damage_description"],
            6: [],
          };
          const errorKeys = Object.keys(errors);
          const hasError = (tabFieldMap[tab.id] ?? []).some(f => errorKeys.includes(f));
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium flex-shrink-0 transition-colors ${
                activeTab === tab.id
                  ? "bg-accent text-white shadow-sm"
                  : hasError
                  ? "bg-red-50 text-red-600"
                  : done
                  ? "bg-green-50 text-green-700"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {hasError ? <AlertCircle className="w-4 h-4" /> : done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2">
          {(() => { const t = TABS[activeTab - 1]; const Icon = t.icon; return <Icon className="w-5 h-5 text-slate-400" />; })()}
          {TABS[activeTab - 1].label}
        </h2>
        {renderTab()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={activeTab === 1}
          className="flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        {activeTab < 6 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent-600 disabled:opacity-50 text-white rounded-xl font-bold transition-colors"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Publishing…</>
            ) : (
              <><CheckCircle className="w-5 h-5" />Publish Listing</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
