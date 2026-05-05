"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import Link from "next/link";
import type { SubscriptionPlan } from "@/lib/types";
import {
  Store, User, Phone, Mail, MapPin, FileText, Car, Loader2,
  CheckCircle, XCircle, ArrowRight, ArrowLeft, Building2,
  UserCircle, Warehouse, Wrench, Zap, Crown, Star,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const cities = [
  "Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam", "Khobar", "Dhahran",
  "Taif", "Tabuk", "Abha", "Khamis Mushait", "Najran", "Jubail", "Yanbu",
  "Hail", "Buraidah",
];

const expectedListingsOptions = ["1-5", "6-10", "11-20", "21-50", "50+"];

const WORKSHOP_SERVICES = [
  "Oil Change & Maintenance", "Brake Service", "Engine Repair",
  "Transmission Repair", "AC & Cooling", "Electrical & Wiring",
  "Body Work & Paint", "Tires & Wheels", "Diagnostics & Inspection",
  "Car Detailing & Wash", "Suspension & Steering", "Battery Service",
];

const PLAN_STYLES: Record<string, {
  border: string; bg: string; selectedBorder: string; selectedBg: string;
  badgeBg: string; textColor: string; priceColor: string; featureColor: string;
}> = {
  free: {
    border: "border-slate-200", bg: "bg-white",
    selectedBorder: "border-slate-700", selectedBg: "bg-slate-50",
    badgeBg: "bg-slate-100 text-slate-700",
    textColor: "text-slate-900", priceColor: "text-slate-900", featureColor: "text-slate-600",
  },
  basic: {
    border: "border-accent/40", bg: "bg-white",
    selectedBorder: "border-accent", selectedBg: "bg-accent/5",
    badgeBg: "bg-accent/10 text-accent",
    textColor: "text-slate-900", priceColor: "text-accent", featureColor: "text-slate-600",
  },
  pro: {
    border: "border-slate-300", bg: "bg-slate-50",
    selectedBorder: "border-yellow-400", selectedBg: "bg-yellow-50",
    badgeBg: "bg-yellow-100 text-yellow-700",
    textColor: "text-slate-900", priceColor: "text-yellow-600", featureColor: "text-slate-600",
  },
};

const BADGE_ICONS: Record<string, React.ElementType> = {
  basic: Zap,
  pro: Crown,
};

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ step }: { step: number }) {
  const steps = [
    { n: 1, label: "Business Info" },
    { n: 2, label: "Choose Plan" },
    { n: 3, label: "Review" },
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              step > s.n
                ? "bg-green-500 text-white"
                : step === s.n
                ? "bg-accent text-white ring-4 ring-accent/20"
                : "bg-slate-100 text-slate-400"
            }`}>
              {step > s.n ? <CheckCircle className="w-5 h-5" /> : s.n}
            </div>
            <span className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
              step >= s.n ? "text-slate-700" : "text-slate-400"
            }`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-colors ${
              step > s.n ? "bg-green-400" : "bg-slate-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan card (for step 2)
// ---------------------------------------------------------------------------

function PlanCard({
  plan,
  billing,
  selected,
  onSelect,
}: {
  plan: SubscriptionPlan;
  billing: "monthly" | "annual";
  selected: boolean;
  onSelect: () => void;
}) {
  const styles = PLAN_STYLES[plan.slug] ?? PLAN_STYLES.free;
  const isPro = plan.slug === "pro";
  const price = billing === "annual" ? plan.annual_price : plan.monthly_price;
  const isFree = parseFloat(price) === 0;
  const BadgeIcon = BADGE_ICONS[plan.badge_type];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full text-left rounded-2xl border-2 p-5 transition-all ${styles.bg} ${
        selected ? `${styles.selectedBorder} ${styles.selectedBg} shadow-md` : styles.border
      } ${plan.slug === "basic" && !selected ? "ring-1 ring-accent/30" : ""}`}
    >
      {plan.slug === "basic" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
          Recommended
        </div>
      )}

      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Plan name + badge */}
      <div className="flex items-center gap-2 mb-2">
        {BadgeIcon && <BadgeIcon className={`w-4 h-4 ${isPro ? "text-yellow-400" : "text-accent"}`} />}
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${styles.badgeBg}`}>
          {plan.name}
        </span>
      </div>

      {/* Price */}
      <div className="mb-3">
        {isFree ? (
          <p className={`text-2xl font-bold ${styles.priceColor}`}>Free</p>
        ) : (
          <>
            <p className={`text-2xl font-bold ${styles.priceColor}`}>
              SAR {parseFloat(price).toLocaleString()}
            </p>
            <p className={`text-xs ${isPro ? "text-slate-400" : "text-slate-500"}`}>
              per {billing === "annual" ? "year" : "month"}
            </p>
          </>
        )}
      </div>

      {/* Key features (top 3) */}
      <ul className="space-y-1">
        <li className={`flex items-center gap-1.5 text-xs ${styles.featureColor}`}>
          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
          {plan.max_listings === 0 ? "Unlimited listings" : `Up to ${plan.max_listings} listings`}
        </li>
        <li className={`flex items-center gap-1.5 text-xs ${styles.featureColor}`}>
          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
          {plan.max_images_per_listing} images per listing
        </li>
        {plan.max_featured_listings > 0 && (
          <li className={`flex items-center gap-1.5 text-xs ${styles.featureColor}`}>
            <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
            {plan.max_featured_listings} featured listings
          </li>
        )}
      </ul>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BecomeDealerPage() {
  const { t, dir } = useTranslation();
  const { isAuthenticated, isLoading: authLoading, role } = useAuth();

  const canCreateListings = role === "dealer" || role === "admin";

  // Wizard step (1 = business info, 2 = choose plan, 3 = review & submit)
  const [step, setStep] = useState(1);

  // Step 1 state
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "individual",
    city: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    expectedListings: "",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Step 2 state
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [chosenPlan, setChosenPlan] = useState<SubscriptionPlan | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const isWorkshop = formData.businessType === "workshop";

  const { data: plans, isLoading: plansLoading } = useApiQuery<SubscriptionPlan[]>(
    "/api/subscription-plans/",
    { enabled: step >= 2 }
  );
  const sortedPlans = [...(plans ?? [])].sort((a, b) => a.display_order - b.display_order);

  const updateField = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const toggleService = (service: string) =>
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );

  const step1Valid =
    formData.businessName.trim() !== "" &&
    formData.city !== "" &&
    formData.phone.trim() !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const descriptionWithServices =
        isWorkshop && selectedServices.length > 0
          ? `Services: ${selectedServices.join(", ")}${formData.description ? `\n\n${formData.description}` : ""}`
          : formData.description || undefined;

      await api.post("/api/dealer-applications/", {
        business_name: formData.businessName,
        business_type: formData.businessType,
        city: formData.city,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address || undefined,
        description: descriptionWithServices,
        expected_listings: !isWorkshop ? formData.expectedListings || undefined : undefined,
      });

      // Store plan preference in localStorage so dashboard can show upgrade banner
      if (chosenPlan && chosenPlan.slug !== "free") {
        localStorage.setItem("pending_plan_slug", chosenPlan.slug);
        localStorage.setItem("pending_plan_name", chosenPlan.name);
        localStorage.setItem("pending_billing_cycle", billing);
      }

      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : t("dealerApplication.error.generic")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Guard screens
  // ---------------------------------------------------------------------------

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            {t("dealerApplication.signInRequired")}
          </h1>
          <p className="text-slate-500 mb-8">{t("dealerApplication.signInMessage")}</p>
          <Link
            href="/auth/signin"
            className={`inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold ${dir === "rtl" ? "flex-row-reverse" : ""}`}
          >
            <span>{t("nav.signIn")}</span>
            <ArrowRight className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </Link>
        </div>
      </div>
    );
  }

  if (canCreateListings) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            {t("dealerApplication.alreadyDealer")}
          </h1>
          <p className="text-slate-500 mb-8">{t("dealerApplication.alreadyDealerMessage")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sell"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold"
            >
              <Car className="w-5 h-5" />
              <span>{t("dealerApplication.startSelling")}</span>
            </Link>
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold"
            >
              View My Plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            {t("dealerApplication.successTitle")}
          </h1>
          <p className="text-slate-500 mb-3">{t("dealerApplication.successMessage")}</p>
          {chosenPlan && chosenPlan.slug !== "free" && (
            <p className="text-sm text-accent font-medium mb-6">
              You selected the <strong>{chosenPlan.name}</strong> plan. It will be available to activate from your dashboard once your application is approved.
            </p>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800">
            ⏱ Your application will be reviewed within <strong>24–48 hours</strong>.
          </div>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold"
          >
            {t("nav.browse")}
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Wizard
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16" dir={dir}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6">
          <Store className="w-10 h-10 text-accent mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-slate-900">
            {t("dealerApplication.title")}
          </h1>
          <p className="text-slate-500 mt-1">{t("dealerApplication.subtitle")}</p>
        </div>

        <StepIndicator step={step} />

        {/* ── STEP 1: Business Information ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Business Information</h2>

            {/* Business Type */}
            <div className="mb-6">
              <label className={`block text-sm font-medium text-slate-700 mb-3 ${dir === "rtl" ? "text-right" : ""}`}>
                {t("dealerApplication.businessType")} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "individual", icon: UserCircle, label: t("dealerApplication.types.individual") },
                  { value: "workshop", icon: Wrench, label: t("dealerApplication.types.dealership") },
                  { value: "showroom", icon: Warehouse, label: t("dealerApplication.types.showroom") },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateField("businessType", value)}
                    className={`p-4 rounded-xl border-2 transition-colors ${
                      formData.businessType === value
                        ? "border-accent bg-accent/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${formData.businessType === value ? "text-accent" : "text-slate-400"}`} />
                    <span className={`text-sm font-medium ${formData.businessType === value ? "text-accent" : "text-slate-600"}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Business Name */}
            <div className="mb-6">
              <label className={`block text-sm font-medium text-slate-700 mb-2 ${dir === "rtl" ? "text-right" : ""}`}>
                {t("dealerApplication.businessName")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Store className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 ${dir === "rtl" ? "right-3" : "left-3"}`} />
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  placeholder={t("dealerApplication.businessNamePlaceholder")}
                  className={`w-full py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent ${dir === "rtl" ? "pr-10 pl-4 text-right" : "pl-10 pr-4"}`}
                />
              </div>
            </div>

            {/* City & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className={`block text-sm font-medium text-slate-700 mb-2 ${dir === "rtl" ? "text-right" : ""}`}>
                  {t("dealerApplication.city")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 ${dir === "rtl" ? "right-3" : "left-3"}`} />
                  <select
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className={`w-full py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent appearance-none bg-white ${dir === "rtl" ? "pr-10 pl-4 text-right" : "pl-10 pr-4"}`}
                  >
                    <option value="">{t("dealerApplication.selectCity")}</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium text-slate-700 mb-2 ${dir === "rtl" ? "text-right" : ""}`}>
                  {t("dealerApplication.phone")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 ${dir === "rtl" ? "right-3" : "left-3"}`} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+966 5X XXX XXXX"
                    dir="ltr"
                    className={`w-full py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent ${dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"}`}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className={`block text-sm font-medium text-slate-700 mb-2 ${dir === "rtl" ? "text-right" : ""}`}>
                {t("dealerApplication.email")}
              </label>
              <div className="relative">
                <Mail className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 ${dir === "rtl" ? "right-3" : "left-3"}`} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="email@example.com"
                  dir="ltr"
                  className={`w-full py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent ${dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"}`}
                />
              </div>
            </div>

            {/* Address */}
            <div className="mb-6">
              <label className={`block text-sm font-medium text-slate-700 mb-2 ${dir === "rtl" ? "text-right" : ""}`}>
                {t("dealerApplication.address")}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder={t("dealerApplication.addressPlaceholder")}
                className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent ${dir === "rtl" ? "text-right" : ""}`}
              />
            </div>

            {/* Expected Listings (hidden for workshop) */}
            {!isWorkshop && (
              <div className="mb-6">
                <label className={`block text-sm font-medium text-slate-700 mb-2 ${dir === "rtl" ? "text-right" : ""}`}>
                  {t("dealerApplication.expectedListings")}
                </label>
                <div className="relative">
                  <Car className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 ${dir === "rtl" ? "right-3" : "left-3"}`} />
                  <select
                    value={formData.expectedListings}
                    onChange={(e) => updateField("expectedListings", e.target.value)}
                    className={`w-full py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent appearance-none bg-white ${dir === "rtl" ? "pr-10 pl-4 text-right" : "pl-10 pr-4"}`}
                  >
                    <option value="">{t("dealerApplication.selectExpected")}</option>
                    {expectedListingsOptions.map((o) => (
                      <option key={o} value={o}>{o} {t("dealerApplication.carsPerMonth")}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Services (workshop only) */}
            {isWorkshop && (
              <div className="mb-6">
                <label className={`block text-sm font-medium text-slate-700 mb-3 ${dir === "rtl" ? "text-right" : ""}`}>
                  Services Offered
                  <span className="ml-1.5 text-xs font-normal text-slate-400">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {WORKSHOP_SERVICES.map((service) => {
                    const active = selectedServices.includes(service);
                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                          active
                            ? "bg-accent border-accent text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-accent hover:text-accent"
                        }`}
                      >
                        {active && <span className="mr-1">✓</span>}
                        {service}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <label className={`block text-sm font-medium text-slate-700 mb-2 ${dir === "rtl" ? "text-right" : ""}`}>
                {t("dealerApplication.description")}
              </label>
              <div className="relative">
                <FileText className={`absolute top-3 w-5 h-5 text-slate-400 ${dir === "rtl" ? "right-3" : "left-3"}`} />
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder={
                    isWorkshop
                      ? "Describe your workshop and specialties (e.g. years of experience, certifications, brands you specialize in)"
                      : t("dealerApplication.descriptionPlaceholder")
                  }
                  rows={3}
                  className={`w-full py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent resize-none ${dir === "rtl" ? "pr-10 pl-4 text-right" : "pl-10 pr-4"}`}
                />
              </div>
            </div>

            {/* Next button */}
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="w-full py-3 bg-accent hover:bg-accent-600 disabled:bg-accent/40 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Next: Choose Your Plan
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Choose Plan ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Choose Your Plan</h2>
              <p className="text-sm text-slate-500 mb-6">
                You can always change your plan later from your dashboard.
              </p>

              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className={`text-sm font-medium ${billing === "monthly" ? "text-slate-900" : "text-slate-400"}`}>
                  Monthly
                </span>
                <button
                  type="button"
                  onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    billing === "annual" ? "bg-accent" : "bg-slate-300"
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    billing === "annual" ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
                <span className={`text-sm font-medium ${billing === "annual" ? "text-slate-900" : "text-slate-400"}`}>
                  Annual
                  <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                    Save 20%
                  </span>
                </span>
              </div>

              {/* Plan cards */}
              {plansLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {sortedPlans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      billing={billing}
                      selected={chosenPlan?.id === plan.id}
                      onSelect={() => setChosenPlan(plan)}
                    />
                  ))}
                </div>
              )}

              <p className="text-xs text-center text-slate-400 mb-6">
                No payment required now. Your plan activates after your application is approved.
              </p>

              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!chosenPlan}
                  className="flex-1 py-3 bg-accent hover:bg-accent-600 disabled:bg-accent/40 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {chosenPlan ? `Continue with ${chosenPlan.name}` : "Select a Plan to Continue"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review & Submit ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Review & Submit</h2>

              {/* Business summary */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Business Info
                  </h3>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-accent hover:underline font-medium"
                  >
                    Edit
                  </button>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-slate-400">Type</dt>
                    <dd className="text-slate-900 font-medium capitalize">{formData.businessType}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Name</dt>
                    <dd className="text-slate-900 font-medium truncate">{formData.businessName}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">City</dt>
                    <dd className="text-slate-900 font-medium">{formData.city}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Phone</dt>
                    <dd className="text-slate-900 font-medium" dir="ltr">{formData.phone}</dd>
                  </div>
                  {formData.email && (
                    <div className="col-span-2">
                      <dt className="text-slate-400">Email</dt>
                      <dd className="text-slate-900 font-medium">{formData.email}</dd>
                    </div>
                  )}
                  {!isWorkshop && formData.expectedListings && (
                    <div>
                      <dt className="text-slate-400">Expected listings</dt>
                      <dd className="text-slate-900 font-medium">{formData.expectedListings}/mo</dd>
                    </div>
                  )}
                  {isWorkshop && selectedServices.length > 0 && (
                    <div className="col-span-2">
                      <dt className="text-slate-400">Services</dt>
                      <dd className="text-slate-900 font-medium text-xs leading-relaxed">
                        {selectedServices.join(" · ")}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Plan summary */}
              {chosenPlan && (
                <div className={`rounded-xl p-4 mb-4 ${
                  chosenPlan.slug === "pro"
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-accent/5 border border-accent/20"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-semibold uppercase tracking-wide ${
                      chosenPlan.slug === "pro" ? "text-yellow-600" : "text-accent/70"
                    }`}>
                      Selected Plan
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs text-accent hover:underline font-medium"
                    >
                      Change
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-lg font-bold ${chosenPlan.slug === "pro" ? "text-white" : "text-slate-900"}`}>
                        {chosenPlan.name} Plan
                      </p>
                      <p className={`text-xs ${chosenPlan.slug === "pro" ? "text-slate-400" : "text-slate-500"}`}>
                        {billing === "annual" ? "Annual" : "Monthly"} billing
                      </p>
                    </div>
                    <p className={`text-xl font-bold ${chosenPlan.slug === "pro" ? "text-yellow-400" : "text-accent"}`}>
                      {parseFloat(billing === "annual" ? chosenPlan.annual_price : chosenPlan.monthly_price) === 0
                        ? "Free"
                        : `SAR ${parseFloat(billing === "annual" ? chosenPlan.annual_price : chosenPlan.monthly_price).toLocaleString()}/${billing === "annual" ? "yr" : "mo"}`
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Info note */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
                <p className="font-semibold mb-1">What happens next?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Your application will be reviewed within <strong>24–48 hours</strong></li>
                  <li>• Once approved, your dealer account will be activated</li>
                  {chosenPlan && chosenPlan.slug !== "free" ? (
                    <li>• You can activate your <strong>{chosenPlan.name}</strong> plan from your dashboard after approval</li>
                  ) : (
                    <li>• You&apos;ll start on the Free plan and can upgrade anytime</li>
                  )}
                  <li>• No payment is required</li>
                </ul>
              </div>

              {/* Error */}
              {submitError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4">
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{submitError}</span>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Store className="w-5 h-5" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
