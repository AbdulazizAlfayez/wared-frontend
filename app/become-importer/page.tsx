"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  Truck, Globe, FileText, CheckCircle, XCircle, ArrowRight, ArrowLeft,
  Loader2, Shield, Building2, DollarSign, Anchor, Star, Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SOURCE_COUNTRIES_OPTIONS = ["USA", "Japan", "South Korea", "UAE", "Germany", "Canada", "UK", "Europe", "China", "Australia"];

const SPECIALIZATIONS = [
  "Salvage / Rebuilt",
  "Low Mileage Clean",
  "Luxury & Premium",
  "Commercial Vehicles",
  "Sports Cars",
  "Hybrid & Electric",
  "Classic & Vintage",
  "Budget Imports",
];

const YEARS_OPTIONS = ["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"];

const MONTHLY_IMPORT_OPTIONS = ["1-3", "4-10", "11-20", "21-50", "50+"];

const SAUDI_CITIES = [
  "Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam", "Khobar", "Dhahran",
  "Jubail", "Yanbu", "Tabuk", "Abha", "Hail", "Buraidah", "Taif", "Najran",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const INPUT = "w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none text-sm bg-white";
const LABEL = "block text-sm font-semibold text-slate-700 mb-1.5";

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className={LABEL}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function ToggleChip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
        selected
          ? "bg-accent text-white border-accent"
          : "bg-white text-slate-600 border-slate-200 hover:border-accent/50"
      }`}
    >
      {label}
    </button>
  );
}

function StepIndicator({ step }: { step: number }) {
  const steps = [
    { n: 1, label: "Business Info" },
    { n: 2, label: "Import Details" },
    { n: 3, label: "Review" },
  ];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              step > s.n ? "bg-green-500 text-white"
                : step === s.n ? "bg-accent text-white ring-4 ring-accent/20"
                : "bg-slate-100 text-slate-400"
            }`}>
              {step > s.n ? <CheckCircle className="w-5 h-5" /> : s.n}
            </div>
            <span className={`mt-1.5 text-xs font-medium whitespace-nowrap ${step >= s.n ? "text-slate-700" : "text-slate-400"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-colors ${step > s.n ? "bg-green-400" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------
interface FormState {
  // Step 1
  business_name:      string;
  city:               string;
  phone:              string;
  email:              string;
  address:            string;
  cr_number:          string;
  customs_license:    string;
  import_license:     string;
  website:            string;
  // Step 2
  source_countries:   string[];
  specializations:    string[];
  years_in_business:  string;
  monthly_imports:    string;
  avg_car_value_sar:  string;
  description:        string;
}

const INITIAL: FormState = {
  business_name:"", city:"", phone:"", email:"", address:"",
  cr_number:"", customs_license:"", import_license:"", website:"",
  source_countries:[], specializations:[], years_in_business:"",
  monthly_imports:"", avg_car_value_sar:"", description:"",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function BecomeImporterPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({ ...INITIAL, email: user?.email ?? "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof FormState) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const toggleArray = (key: "source_countries" | "specializations", val: string) => {
    setForm(prev => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val],
      };
    });
  };

  const validate1 = () => {
    const e: typeof errors = {};
    if (!form.business_name.trim()) e.business_name = "Business name is required";
    if (!form.city) e.city = "City is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.cr_number.trim()) e.cr_number = "CR number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validate2 = () => {
    const e: typeof errors = {};
    if (form.source_countries.length === 0) e.source_countries = "Select at least one source country";
    if (!form.years_in_business) e.years_in_business = "Required";
    if (!form.monthly_imports) e.monthly_imports = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setIsSubmitting(true);
    try {
      await api.post("/api/importer-applications/", {
        business_name:      form.business_name,
        city:               form.city,
        phone:              form.phone,
        email:              form.email || user?.email,
        address:            form.address || undefined,
        cr_number:          form.cr_number,
        customs_license:    form.customs_license || undefined,
        import_license:     form.import_license || undefined,
        website:            form.website || undefined,
        source_countries:   form.source_countries,
        specializations:    form.specializations,
        years_in_business:  form.years_in_business,
        monthly_imports:    form.monthly_imports,
        avg_car_value_sar:  form.avg_car_value_sar ? parseFloat(form.avg_car_value_sar) : undefined,
        description:        form.description || undefined,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "";
      setSubmitError(msg || "Failed to submit. Please check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Success State
  // ---------------------------------------------------------------------------
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 p-10 text-center shadow-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-slate-500 mb-6">
            Thanks, <strong>{form.business_name}</strong>! Our team will review your application within 2–3 business days.
            We'll contact you at <strong>{form.email || user?.email}</strong>.
          </p>
          <div className="space-y-3 text-left bg-slate-50 rounded-2xl p-4 mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">What happens next?</p>
            {[
              "Our team reviews your CR and license documents",
              "We verify your customs broker credentials",
              "Account upgraded to Importer role",
              "You can start listing imported cars",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <span className="text-sm text-slate-600">{step}</span>
              </div>
            ))}
          </div>
          <Link href="/" className="block w-full py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Become an Importer</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            List imported cars from the USA, Japan, Korea, and more. Reach verified buyers across Saudi Arabia.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Shield,  label: "Verified Importers", sub: "CR & license verified" },
            { icon: Star,    label: "Buyer Trust",        sub: "Rated by buyers" },
            { icon: DollarSign, label: "Transparent Costs", sub: "Full cost breakdown" },
          ].map((b) => (
            <div key={b.label} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
              <b.icon className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-xs font-semibold text-slate-700">{b.label}</p>
              <p className="text-[10px] text-slate-400">{b.sub}</p>
            </div>
          ))}
        </div>

        <StepIndicator step={step} />

        {/* ------------------------------------------------------------------ */}
        {/* STEP 1: Business Info                                               */}
        {/* ------------------------------------------------------------------ */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-400" />
              Business Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Field label="Business / Trade Name" required>
                  <input className={`${INPUT} ${errors.business_name ? "border-red-400" : ""}`}
                    value={form.business_name} onChange={e => set("business_name")(e.target.value)}
                    placeholder="e.g. Al-Najdi Auto Imports" />
                  {errors.business_name && <p className="text-red-500 text-xs mt-1">{errors.business_name}</p>}
                </Field>
              </div>
              <Field label="City" required>
                <select value={form.city} onChange={e => set("city")(e.target.value)}
                  className={`${INPUT} ${errors.city ? "border-red-400" : ""}`}>
                  <option value="">Select city…</option>
                  {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </Field>
              <Field label="Business Phone" required>
                <input className={`${INPUT} ${errors.phone ? "border-red-400" : ""}`}
                  type="tel" value={form.phone} onChange={e => set("phone")(e.target.value)}
                  placeholder="+966 5X XXX XXXX" dir="ltr" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </Field>
              <div className="sm:col-span-2">
                <Field label="Business Address">
                  <input className={INPUT} value={form.address} onChange={e => set("address")(e.target.value)}
                    placeholder="Street address" />
                </Field>
              </div>
              <Field label="Commercial Registration (CR) Number" required>
                <input className={`${INPUT} ${errors.cr_number ? "border-red-400" : ""}`}
                  value={form.cr_number} onChange={e => set("cr_number")(e.target.value)}
                  placeholder="CR-XXXXXXXXXX" />
                {errors.cr_number && <p className="text-red-500 text-xs mt-1">{errors.cr_number}</p>}
              </Field>
              <Field label="Customs Broker License #">
                <input className={INPUT} value={form.customs_license} onChange={e => set("customs_license")(e.target.value)}
                  placeholder="License number (if applicable)" />
              </Field>
              <Field label="Import License #">
                <input className={INPUT} value={form.import_license} onChange={e => set("import_license")(e.target.value)}
                  placeholder="Import permit number (if applicable)" />
              </Field>
              <Field label="Website">
                <input className={INPUT} type="url" value={form.website} onChange={e => set("website")(e.target.value)}
                  placeholder="https://www.yoursite.com" />
              </Field>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => validate1() && setStep(2)}
                className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors"
              >
                Next: Import Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 2: Import Details                                              */}
        {/* ------------------------------------------------------------------ */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-slate-400" />
              Import Operations
            </h2>

            <div className="space-y-2">
              <p className={LABEL}>Source Countries <span className="text-red-500">*</span></p>
              <div className="flex flex-wrap gap-2">
                {SOURCE_COUNTRIES_OPTIONS.map(c => (
                  <ToggleChip
                    key={c} label={c}
                    selected={form.source_countries.includes(c)}
                    onClick={() => toggleArray("source_countries", c)}
                  />
                ))}
              </div>
              {errors.source_countries && <p className="text-red-500 text-xs">{errors.source_countries}</p>}
            </div>

            <div className="space-y-2">
              <p className={LABEL}>Specializations</p>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map(s => (
                  <ToggleChip
                    key={s} label={s}
                    selected={form.specializations.includes(s)}
                    onClick={() => toggleArray("specializations", s)}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Years in Business" required>
                <select value={form.years_in_business} onChange={e => set("years_in_business")(e.target.value)}
                  className={`${INPUT} ${errors.years_in_business ? "border-red-400" : ""}`}>
                  <option value="">Select…</option>
                  {YEARS_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {errors.years_in_business && <p className="text-red-500 text-xs mt-1">{errors.years_in_business}</p>}
              </Field>
              <Field label="Expected Monthly Imports" required>
                <select value={form.monthly_imports} onChange={e => set("monthly_imports")(e.target.value)}
                  className={`${INPUT} ${errors.monthly_imports ? "border-red-400" : ""}`}>
                  <option value="">Select range…</option>
                  {MONTHLY_IMPORT_OPTIONS.map(o => <option key={o} value={o}>{o} cars/month</option>)}
                </select>
                {errors.monthly_imports && <p className="text-red-500 text-xs mt-1">{errors.monthly_imports}</p>}
              </Field>
              <div className="sm:col-span-2">
                <Field label="Average Car Value (SAR)" hint="Approximate average price of cars you import">
                  <input type="number" className={INPUT} value={form.avg_car_value_sar}
                    onChange={e => set("avg_car_value_sar")(e.target.value)} placeholder="e.g. 80000" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Tell us about your business">
                  <textarea className={`${INPUT} resize-none`} rows={3} value={form.description}
                    onChange={e => set("description")(e.target.value)}
                    placeholder="Describe your import experience, how you source cars, what makes you different…" />
                </Field>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)}
                className="flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => validate2() && setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors">
                Review Application
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 3: Review & Submit                                             */}
        {/* ------------------------------------------------------------------ */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Review & Submit
            </h2>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Business Information</p>
                {[
                  ["Business Name", form.business_name],
                  ["City", form.city],
                  ["Phone", form.phone],
                  ["CR Number", form.cr_number],
                  form.customs_license ? ["Customs License", form.customs_license] : null,
                  form.import_license  ? ["Import License", form.import_license]   : null,
                ].filter((x): x is string[] => x !== null).map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-800">{val}</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Import Operations</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Source Countries</span>
                  <span className="font-medium text-slate-800 text-right max-w-[200px]">{form.source_countries.join(", ") || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Specializations</span>
                  <span className="font-medium text-slate-800 text-right max-w-[200px]">{form.specializations.join(", ") || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Years in Business</span>
                  <span className="font-medium text-slate-800">{form.years_in_business}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Monthly Imports</span>
                  <span className="font-medium text-slate-800">{form.monthly_imports} cars</span>
                </div>
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Review takes 2–3 business days</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      You'll receive an email at <strong>{form.email || user?.email}</strong> once your application is reviewed.
                    </p>
                  </div>
                </div>
              </div>

              <ul className="text-xs text-slate-500 space-y-1 list-none">
                <li>• Your CR number and license documents may be requested for verification</li>
                <li>• No subscription fees are charged until your account is approved</li>
                <li>• You can list cars immediately upon approval</li>
              </ul>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{submitError}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="flex-1 py-3 bg-accent hover:bg-accent-600 disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                {isSubmitting
                  ? <><Loader2 className="w-5 h-5 animate-spin" />Submitting…</>
                  : <><Truck className="w-5 h-5" />Submit Application</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Not logged in */}
        {!isAuthenticated && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-sm text-amber-700">
              <Link href="/auth/signin" className="font-semibold underline">Sign in</Link> or{" "}
              <Link href="/auth/signup" className="font-semibold underline">create an account</Link> to submit your application.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
