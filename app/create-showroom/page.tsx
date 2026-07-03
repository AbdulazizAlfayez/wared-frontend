"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Phone,
  FileText,
  CheckCircle,
  ArrowLeft,
  Loader2,
  User,
  ShieldAlert,
  Tag,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const cities = [
  "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Dhahran",
  "Taif", "Tabuk", "Abha", "Buraidah", "Najran", "Yanbu", "Jubail",
];

const availableServices = [
  "Financing", "Certified", "Trade-in", "Warranty", "Insurance",
  "Inspection", "Delivery", "After-sale Service", "Extended Warranty", "Test Drive",
];

export default function CreateShowroomPage() {
  const { t, dir, locale } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, role } = useAuth();

  const canCreateListings = role === "importer" || role === "admin";

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const toggleService = (service: string) => {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(locale === "ar" ? "اسم المعرض مطلوب" : "Showroom name is required");
      return;
    }
    if (!city) {
      setError(locale === "ar" ? "المدينة مطلوبة" : "City is required");
      return;
    }
    if (!address.trim()) {
      setError(locale === "ar" ? "العنوان مطلوب" : "Address is required");
      return;
    }
    if (!phone.trim()) {
      setError(locale === "ar" ? "رقم الهاتف مطلوب" : "Phone number is required");
      return;
    }
    if (services.length === 0) {
      setError(locale === "ar" ? "اختر خدمة واحدة على الأقل" : "Select at least one service");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/api/showrooms/", {
        name: name.trim(),
        city,
        address: address.trim(),
        phone: phone.trim(),
        services,
        description: description.trim() || undefined,
      });

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {locale === "ar" ? "تسجيل الدخول مطلوب" : "Sign In Required"}
          </h1>
          <p className="text-slate-500 mb-8">
            {locale === "ar"
              ? "يجب عليك تسجيل الدخول لإنشاء معرض"
              : "You need to sign in to create a showroom"}
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors"
          >
            {locale === "ar" ? "تسجيل الدخول" : "Sign In"}
          </Link>
        </div>
      </div>
    );
  }

  if (!canCreateListings) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            {locale === "ar" ? "للتجار فقط" : "Dealers Only"}
          </h1>
          <p className="text-slate-500 mb-8">
            {locale === "ar"
              ? "فقط التجار والمسؤولين يمكنهم إنشاء معارض. تقدم لتصبح تاجراً أولاً."
              : "Only dealers and admins can create showrooms. Apply to become a dealer first."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/become-dealer"
              className="px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors text-center"
            >
              {locale === "ar" ? "تقدم كتاجر" : "Become a Dealer"}
            </Link>
            <Link
              href="/showrooms"
              className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-colors text-center"
            >
              {locale === "ar" ? "تصفح المعارض" : "Browse Showrooms"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              {locale === "ar" ? "تم إنشاء المعرض بنجاح!" : "Showroom Created!"}
            </h1>
            <p className="text-slate-500 mb-8">
              {locale === "ar"
                ? "معرضك قيد المراجعة من قبل المسؤولين. سيظهر في صفحة المعارض بعد الموافقة عليه."
                : "Your showroom is pending admin review. It will appear on the showrooms page once approved."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/showrooms"
                className="flex-1 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors text-center"
              >
                {locale === "ar" ? "عرض المعارض" : "View Showrooms"}
              </Link>
              <Link
                href="/sell"
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-colors text-center"
              >
                {locale === "ar" ? "إضافة سيارة" : "Add a Car"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className={`inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
        >
          <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          <span>{locale === "ar" ? "رجوع" : "Back"}</span>
        </button>

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            {locale === "ar" ? "إنشاء معرض جديد" : "Create Showroom"}
          </h1>
          <p className="text-slate-500">
            {locale === "ar"
              ? "أضف معرضك للوصول إلى المزيد من العملاء"
              : "Add your showroom to reach more customers"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 space-y-6">
          {/* Showroom Name */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
              <Building2 className="w-4 h-4 inline-block mb-1 me-2" />
              {locale === "ar" ? "اسم المعرض" : "Showroom Name"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={locale === "ar" ? "مثال: معرض الجزيرة للسيارات" : "e.g., Al Jazirah Motors"}
              className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent ${dir === "rtl" ? "text-right" : ""}`}
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
              <MapPin className="w-4 h-4 inline-block mb-1 me-2" />
              {locale === "ar" ? "المدينة" : "City"} <span className="text-red-500">*</span>
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent bg-white"
            >
              <option value="">{locale === "ar" ? "اختر المدينة" : "Select city"}</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
              <MapPin className="w-4 h-4 inline-block mb-1 me-2" />
              {locale === "ar" ? "العنوان الكامل" : "Full Address"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={locale === "ar" ? "الشارع، الحي، المعلم القريب" : "Street, District, Landmark"}
              className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent ${dir === "rtl" ? "text-right" : ""}`}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
              <Phone className="w-4 h-4 inline-block mb-1 me-2" />
              {locale === "ar" ? "رقم الهاتف" : "Phone Number"} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+966 5X XXX XXXX"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
              dir="ltr"
            />
          </div>

          {/* Services */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
              <Tag className="w-4 h-4 inline-block mb-1 me-2" />
              {locale === "ar" ? "الخدمات المقدمة" : "Services Offered"} <span className="text-red-500">*</span>
            </label>
            <p className={`text-xs text-slate-500 ${dir === "rtl" ? "text-right" : ""}`}>
              {locale === "ar" ? "اختر الخدمات التي يقدمها معرضك" : "Select the services your showroom offers"}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableServices.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    services.includes(service)
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
              <FileText className="w-4 h-4 inline-block mb-1 me-2" />
              {locale === "ar" ? "الوصف (اختياري)" : "Description (Optional)"}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                locale === "ar"
                  ? "أخبرنا المزيد عن معرضك، العلامات التجارية، وما يميزك..."
                  : "Tell us more about your showroom, brands, specialties..."
              }
              rows={4}
              className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent resize-none ${dir === "rtl" ? "text-right" : ""}`}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm ${dir === "rtl" ? "text-right" : ""}`}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{locale === "ar" ? "جاري الإنشاء..." : "Creating..."}</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>{locale === "ar" ? "إنشاء المعرض" : "Create Showroom"}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
