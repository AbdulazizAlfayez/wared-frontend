"use client";

export const dynamic = "force-dynamic";


import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api as djangoApi } from "@/lib/api";
import type { ListingLimitStatus } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import {
  Car,
  Camera,
  DollarSign,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Upload,
  X,
  User,
  AlertCircle,
  ShieldAlert,
  Clock } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const carMakes = [
  "Toyota",
  "Honda",
  "Nissan",
  "Hyundai",
  "Kia",
  "Ford",
  "Chevrolet",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Lexus",
  "GMC",
  "Jeep",
  "Mazda",
  "Mitsubishi",
  "Volkswagen",
  "Porsche",
  "Land Rover",
  "Dodge",
  "Infiniti",
];

const modelsByMake: Record<string, string[]> = {
  Toyota: ["Camry", "Corolla", "Land Cruiser", "Hilux", "RAV4", "Avalon", "Yaris", "Fortuner"],
  Honda: ["Accord", "Civic", "CR-V", "Pilot", "HR-V", "Odyssey"],
  Nissan: ["Altima", "Maxima", "Patrol", "X-Trail", "Sentra", "Kicks"],
  Hyundai: ["Sonata", "Elantra", "Tucson", "Santa Fe", "Accent", "Palisade"],
  Kia: ["Optima", "Sportage", "Sorento", "Cerato", "Carnival"],
  Ford: ["F-150", "Explorer", "Mustang", "Edge", "Expedition", "Taurus"],
  Chevrolet: ["Tahoe", "Suburban", "Silverado", "Malibu", "Traverse", "Camaro"],
  BMW: ["3 Series", "5 Series", "7 Series", "X3", "X5", "X7"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLC", "GLE", "G-Class"],
  Audi: ["A4", "A6", "A8", "Q5", "Q7", "Q8"],
  Lexus: ["ES", "IS", "LS", "RX", "LX", "GX"],
  GMC: ["Sierra", "Yukon", "Terrain", "Acadia", "Canyon"],
  Jeep: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Gladiator"],
  Mazda: ["Mazda3", "Mazda6", "CX-5", "CX-9", "MX-5"],
  Mitsubishi: ["Pajero", "Outlander", "ASX", "L200", "Eclipse Cross"],
  Volkswagen: ["Passat", "Jetta", "Tiguan", "Atlas", "Golf"],
  Porsche: ["Cayenne", "Panamera", "Macan", "911", "Taycan"],
  "Land Rover": ["Range Rover", "Range Rover Sport", "Defender", "Discovery"],
  Dodge: ["Charger", "Challenger", "Durango", "Ram 1500"],
  Infiniti: ["Q50", "Q60", "QX50", "QX60", "QX80"] };

const cities = [
  "Riyadh",
  "Jeddah",
  "Mecca",
  "Medina",
  "Dammam",
  "Khobar",
  "Dhahran",
  "Taif",
  "Tabuk",
  "Abha",
  "Khamis Mushait",
  "Buraidah",
  "Najran",
  "Yanbu",
  "Jubail",
];

const colors = [
  "White",
  "Black",
  "Silver",
  "Gray",
  "Red",
  "Blue",
  "Green",
  "Brown",
  "Beige",
  "Gold",
  "Orange",
  "Yellow",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 25 }, (_, i) => currentYear - i);

interface FormData {
  make: string;
  model: string;
  year: string;
  mileage: string;
  condition: "new" | "used";
  fuelType: string;
  transmission: string;
  color: string;
  city: string;
  title: string;
  description: string;
  price: string;
  negotiable: boolean;
  phone: string;
  images: string[];
  workshopId: string; // Optional workshop to attach listing to (for repairs)
  showroomId: string; // Optional showroom to attach listing to (for sales)
}

export default function SellPage() {
  const { t, dir } = useTranslation();
  const { isAuthenticated, isLoading: authLoading, role } = useAuth();

  // Role derived from auth context
  const canCreateListings: boolean | undefined = authLoading
    ? undefined
    : isAuthenticated
    ? role === "importer" || role === "admin"
    : false;

  // DEPRECATED: Subscription limits disabled — commission-only model
  // const { data: mySubscription } = useApiQuery<DealerSubscription>(
  //   "/api/my-subscription/",
  //   { enabled: canCreateListings === true }
  // );
  // const { data: dealerDashData } = useApiQuery<{ approved_listings: number }>(
  //   "/api/dashboard/dealer/",
  //   { enabled: canCreateListings === true }
  // );
  // const activeCount = dealerDashData?.approved_listings ?? 0;
  // const maxListings = mySubscription?.plan?.max_listings ?? 0;
  const isAtLimit = false;
  const isNearLimit = false;

  const [limitStatus, setLimitStatus] = useState<ListingLimitStatus | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    djangoApi.get<ListingLimitStatus>("/api/listings/limit/")
      .then(setLimitStatus)
      .catch(() => {});
  }, [isAuthenticated]);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [listingStatus, setListingStatus] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFilesRef = useRef<File[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    make: "",
    model: "",
    year: "",
    mileage: "",
    condition: "used",
    fuelType: "petrol",
    transmission: "automatic",
    color: "",
    city: "",
    title: "",
    description: "",
    price: "",
    negotiable: false,
    phone: "",
    images: [],
    workshopId: "", // Empty means private/individual listing
    showroomId: "", // Empty means private/individual listing (for showrooms)
  });

  const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const MAX_IMAGES = 10;

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    setImageError(null);
    const currentCount = formData.images.length;
    const remainingSlots = MAX_IMAGES - currentCount;
    
    if (remainingSlots <= 0) {
      setImageError(t("sell.photos.maxReached") || `Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    Array.from(files).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        invalidFiles.push(file.name);
      } else if (validFiles.length < remainingSlots) {
        validFiles.push(file);
      }
    });
    
    if (invalidFiles.length > 0) {
      setImageError(t("sell.photos.invalidType") || "Only JPG, PNG, and WebP images are allowed");
    }
    
    if (validFiles.length > 0) {
      // Store actual File objects for later upload
      imageFilesRef.current = [...imageFilesRef.current, ...validFiles];
      
      // Convert files to data URLs for preview
      const newImages: string[] = [];
      let processed = 0;
      
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
          }
          processed++;
          if (processed === validFiles.length) {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, ...newImages] }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }, [formData.images.length, t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeImage = useCallback((index: number) => {
    // Remove from File objects array
    imageFilesRef.current = imageFilesRef.current.filter((_, i) => i !== index);
    // Remove from preview
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index) }));
    setImageError(null);
  }, []);

  const updateField = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "make") {
      setFormData((prev) => ({ ...prev, model: "" }));
    }
  };

  const availableModels = formData.make ? modelsByMake[formData.make] || [] : [];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // 1. Create the listing
      const listing = await djangoApi.post<{ id: number; status: string }>(
        "/api/listings/",
        {
          title: formData.title,
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year),
          price: parseInt(formData.price),
          mileage: parseInt(formData.mileage),
          city: formData.city,
          fuel_type: formData.fuelType,
          transmission: formData.transmission,
          condition: formData.condition,
          color: formData.color || "",
          description: formData.description || "",
          negotiable: formData.negotiable,
        }
      );

      // 2. Upload images via multipart/form-data
      const csrf =
        document.cookie.match(/(?:^|; )csrftoken=([^;]*)/)?.[1] || "";
      for (let i = 0; i < imageFilesRef.current.length; i++) {
        const file = imageFilesRef.current[i];
        const fd = new globalThis.FormData();
        fd.append("image", file);
        fd.append("order", String(i + 1));
        if (i === 0) fd.append("is_primary", "true");
        await fetch(`${BASE_URL}/api/listings/${listing.id}/images/`, {
          method: "POST",
          credentials: "include",
          headers: csrf ? { "X-CSRFToken": csrf } : {},
          body: fd,
        });
      }

      setCreatedListingId(String(listing.id));
      setListingStatus(listing.status);
      setIsSubmitted(true);
    } catch (error: unknown) {
      console.error("Error creating listing:", error);
      // Surface 429 daily-limit message from backend
      const anyErr = error as { status?: number; message?: string; detail?: string };
      if (anyErr?.status === 429) {
        setSubmitError(anyErr.detail ?? anyErr.message ?? "Daily listing limit reached. Try again tomorrow.");
      } else {
        setSubmitError(
          dir === "rtl"
            ? "حدث خطأ أثناء نشر إعلانك. يرجى المحاولة مرة أخرى."
            : "An error occurred while publishing your listing. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, name: t("sell.steps.details"), icon: Car },
    { id: 2, name: t("sell.steps.photos"), icon: Camera },
    { id: 3, name: t("sell.steps.pricing"), icon: DollarSign },
    { id: 4, name: t("sell.steps.review"), icon: CheckCircle },
  ];

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              {t("sell.signInRequired")}
            </h1>
            <p className="text-slate-500 mb-8">
              {t("sell.signInMessage")}
            </p>
            <Link
              href="/auth/signin"
              className={`inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors ${dir === "rtl" ? "flex-row-reverse" : ""}`}
            >
              <span>{t("nav.signIn")}</span>
              <ArrowRight className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if user can create listings (dealer or admin only)
  if (canCreateListings === false) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            {t("sell.dealerOnly")}
          </h1>
          <p className="text-slate-500 mb-8">
            {t("sell.dealerOnlyMessage")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/become-importer"
              className="px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors text-center"
            >
              {t("sell.becomeDealerButton")}
            </Link>
            <Link
              href="/browse"
              className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-colors text-center"
            >
              {t("nav.browse")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading role check
  if (canCreateListings === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (isSubmitted) {
    const isPending = listingStatus === "pending";
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isPending ? "bg-amber-100" : "bg-green-100"}`}>
              {isPending ? (
                <Clock className="w-10 h-10 text-amber-500" />
              ) : (
                <CheckCircle className="w-10 h-10 text-green-500" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              {isPending ? t("listingStatus.submittedForReview") : t("sell.success.title")}
            </h1>
            <p className="text-slate-500 mb-8">
              {isPending ? t("listingStatus.submittedMessage") : t("sell.success.message")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard/listings"
                className="flex-1 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors text-center"
              >
                {t("listingStatus.viewMyListings")}
              </Link>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setCreatedListingId(null);
                  setListingStatus(null);
                  setStep(1);
                  imageFilesRef.current = [];
                  setFormData({
                    make: "",
                    model: "",
                    year: "",
                    mileage: "",
                    condition: "used",
                    fuelType: "petrol",
                    transmission: "automatic",
                    color: "",
                    city: "",
                    title: "",
                    description: "",
                    price: "",
                    negotiable: false,
                    phone: "",
                    images: [],
                    workshopId: "",
                    showroomId: "" });
                }}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                {t("sell.success.sellAnother")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            {t("sell.title")}
          </h1>
          <p className="text-slate-500">
            {t("sell.subtitle")}
          </p>
        </div>

        {/* Daily listing limit banner */}
        {limitStatus && (
          <div className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm ${
            limitStatus.remaining === 0
              ? "bg-red-50 border border-red-200 text-red-600"
              : "bg-slate-50 border border-slate-200 text-slate-600"
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {limitStatus.remaining === 0
              ? `Daily listing limit reached (${limitStatus.listings_today}/${limitStatus.daily_limit}). Try again tomorrow or upgrade your plan.`
              : `${limitStatus.listings_today}/${limitStatus.daily_limit} listings used today — ${limitStatus.remaining} remaining`}
          </div>
        )}

        {/* DEPRECATED: Subscription limit banners removed — commission-only model */}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="relative flex items-start justify-between">
            {/* Connector lines - positioned behind the icons */}
            <div className="absolute top-5 left-0 right-0 flex items-center px-[10%]">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded ${
                    step > i ? "bg-accent" : "bg-slate-100"
                  }`}
                />
              ))}
            </div>
            
            {/* Step icons and labels */}
            {(dir === "rtl" ? [...steps].reverse() : steps).map((s) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center" style={{ width: '20%' }}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= s.id
                      ? "bg-accent text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center whitespace-nowrap ${
                    step >= s.id ? "text-accent" : "text-slate-400"
                  }`}
                >
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
          {/* Step 1: Car Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Make */}
                <div className="space-y-2">
                  <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                    {t("sell.form.make")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.make}
                    onChange={(e) => updateField("make", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent bg-white"
                  >
                    <option value="">{t("sell.form.selectMake")}</option>
                    {carMakes.map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                    {t("sell.form.model")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => updateField("model", e.target.value)}
                    disabled={!formData.make}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{t("sell.form.selectModel")}</option>
                    {availableModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div className="space-y-2">
                  <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                    {t("sell.form.year")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => updateField("year", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent bg-white"
                  >
                    <option value="">{t("sell.form.selectYear")}</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mileage */}
                <div className="space-y-2">
                  <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                    {t("sell.form.mileage")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => updateField("mileage", e.target.value)}
                    placeholder={t("sell.form.mileagePlaceholder")}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
                    dir="ltr"
                  />
                </div>

                {/* Condition */}
                <div className="space-y-2">
                  <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                    {t("sell.form.condition")} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("condition", "new")}
                      className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                        formData.condition === "new"
                          ? "bg-accent text-white"
                          : "border border-slate-200 text-slate-700 hover:border-accent"
                      }`}
                    >
                      {t("filters.new")}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("condition", "used")}
                      className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                        formData.condition === "used"
                          ? "bg-accent text-white"
                          : "border border-slate-200 text-slate-700 hover:border-accent"
                      }`}
                    >
                      {t("filters.used")}
                    </button>
                  </div>
                </div>

                {/* Fuel Type */}
                <div className="space-y-2">
                  <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                    {t("sell.form.fuelType")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => updateField("fuelType", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent bg-white"
                  >
                    <option value="petrol">{t("filters.petrol")}</option>
                    <option value="diesel">{t("filters.diesel")}</option>
                    <option value="hybrid">{t("filters.hybrid")}</option>
                    <option value="electric">{t("filters.electric")}</option>
                  </select>
                </div>

                {/* Transmission */}
                <div className="space-y-2">
                  <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                    {t("sell.form.transmission")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => updateField("transmission", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent bg-white"
                  >
                    <option value="automatic">{t("filters.automatic")}</option>
                    <option value="manual">{t("filters.manual")}</option>
                  </select>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                    {t("sell.form.color")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.color}
                    onChange={(e) => updateField("color", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent bg-white"
                  >
                    <option value="">{t("sell.form.selectColor")}</option>
                    {colors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div className="space-y-2 sm:col-span-2">
                  <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                    {t("sell.form.city")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent bg-white"
                  >
                    <option value="">{t("sell.form.selectCity")}</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Photos */}
          {step === 2 && (
            <div className="space-y-6">
              <div className={dir === "rtl" ? "text-right" : ""}>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {t("sell.photos.title")}
                </h3>
                <p className="text-slate-500 text-sm">
                  {t("sell.photos.subtitle")}
                </p>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />

              {/* Upload Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? "border-accent bg-accent/5" 
                    : "border-slate-200 hover:border-accent"
                } ${formData.images.length >= MAX_IMAGES ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-accent" : "text-slate-300"}`} />
                <p className="text-slate-700 font-medium mb-2">
                  {t("sell.photos.dragDrop")}
                </p>
                <p className="text-slate-400 text-sm">
                  {t("sell.photos.requirements")}
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  {formData.images.length} / {MAX_IMAGES} {dir === "rtl" ? "صور" : "images"}
                </p>
              </div>

              {/* Error Message */}
              {imageError && (
                <div className={`flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm ${dir === "rtl" ? "flex-row-reverse text-right" : ""}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{imageError}</span>
                </div>
              )}

              {/* Tips */}
              <p className={`text-sm text-slate-500 bg-slate-50 rounded-xl p-4 ${dir === "rtl" ? "text-right" : ""}`}>
                💡 {t("sell.photos.tips")}
              </p>

              {/* Uploaded Images Grid */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden group"
                    >
                      <Image
                        src={image}
                        alt={`Upload ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {index === 0 && (
                        <span 
                          className="absolute top-2 px-2 py-1 bg-accent text-white text-xs rounded-lg"
                          style={{ insetInlineStart: "0.5rem" }}
                        >
                          {t("sell.photos.mainPhoto")}
                        </span>
                      )}
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ insetInlineEnd: "0.5rem" }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Placeholder slots when no images */}
              {formData.images.length === 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      onClick={() => fileInputRef.current?.click()}
                      className="relative aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-accent transition-colors flex items-center justify-center"
                    >
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                        <span className="text-xs text-slate-400">
                          {i === 1 ? (t("sell.photos.mainPhoto")) : `${dir === "rtl" ? "صورة" : "Photo"} ${i}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="space-y-6">

              {/* Title */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                  {t("sell.form.title")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder={t("sell.form.titlePlaceholder")}
                  className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent ${dir === "rtl" ? "text-right" : ""}`}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                  {t("sell.form.description")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder={t("sell.form.descriptionPlaceholder")}
                  rows={4}
                  className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent resize-none ${dir === "rtl" ? "text-right" : ""}`}
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                  {t("sell.form.price")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder={t("sell.form.pricePlaceholder")}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
                  dir="ltr"
                />
              </div>

              {/* Negotiable */}
              <label className={`flex items-center gap-3 cursor-pointer ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                <input
                  type="checkbox"
                  checked={formData.negotiable}
                  onChange={(e) => updateField("negotiable", e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                />
                <span className="text-slate-700">{t("sell.form.negotiable")}</span>
              </label>

              {/* Phone */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                  {t("sell.form.phone")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder={t("sell.form.phonePlaceholder")}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div className={dir === "rtl" ? "text-right" : ""}>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {t("sell.review.title")}
                </h3>
                <p className="text-slate-500 text-sm">
                  {t("sell.review.subtitle")}
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <div className={`flex justify-between items-start ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                  <div className={dir === "rtl" ? "text-right" : ""}>
                    <h4 
                      className="text-xl font-semibold text-slate-900"
                      style={{ fontFamily: 'var(--font-geist-sans), Inter, system-ui, sans-serif' }}
                    >
                      {formData.title || `${formData.year} ${formData.make} ${formData.model}`}
                    </h4>
                    <p className="text-slate-500">{formData.city}</p>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-accent hover:text-accent-600 text-sm font-medium"
                  >
                    {t("sell.review.edit")}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">{t("car.make")}:</span>
                    <span className="text-slate-900 font-medium ms-2" style={{ fontFamily: 'var(--font-geist-sans), Inter, system-ui, sans-serif' }}>
                      {formData.make}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t("car.model")}:</span>
                    <span className="text-slate-900 font-medium ms-2" style={{ fontFamily: 'var(--font-geist-sans), Inter, system-ui, sans-serif' }}>
                      {formData.model}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t("car.year")}:</span>
                    <span className="text-slate-900 font-medium ms-2">{formData.year}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t("car.mileage")}:</span>
                    <span className="text-slate-900 font-medium ms-2" dir="ltr">
                      {Number(formData.mileage).toLocaleString()} km
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t("car.condition")}:</span>
                    <span className="text-slate-900 font-medium ms-2">
                      {formData.condition === "new" ? t("filters.new") : t("filters.used")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t("car.fuelType")}:</span>
                    <span className="text-slate-900 font-medium ms-2">{formData.fuelType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t("car.transmission")}:</span>
                    <span className="text-slate-900 font-medium ms-2">{formData.transmission}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t("car.color")}:</span>
                    <span className="text-slate-900 font-medium ms-2">{formData.color}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className={`flex justify-between items-center ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                    <span className="text-slate-500">{t("car.price")}:</span>
                    <span className="text-2xl font-bold text-accent" dir="ltr">
                      SAR {Number(formData.price).toLocaleString()}
                      {formData.negotiable && (
                        <span className="text-sm font-normal text-slate-500 ms-2">
                          ({t("sell.form.negotiable")})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {formData.description && (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-slate-600">{formData.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Error */}
          {submitError && (
            <div className={`mt-6 flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl ${dir === "rtl" ? "flex-row-reverse text-right" : ""}`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={`mt-8 flex gap-4 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
                className={`flex-1 py-3 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
              >
                <ArrowLeft className={`w-5 h-5 ${dir === "rtl" ? "rotate-180" : ""}`} />
                <span>{t("sell.back")}</span>
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className={`flex-1 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
              >
                <span>{t("sell.next")}</span>
                <ArrowRight className={`w-5 h-5 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 py-3 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t("sell.publishing")}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>{t("sell.publish")}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
