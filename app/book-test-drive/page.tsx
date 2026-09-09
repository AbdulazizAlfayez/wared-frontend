"use client";

export const dynamic = "force-dynamic";


import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Car, User, Phone, Calendar, Clock, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";

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
];

const timeSlots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];

function BookTestDriveContent() {
  const { t, dir } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const carId = searchParams.get("carId") || "";
  const carTitle = searchParams.get("title") || "";
  const carCity = searchParams.get("city") || "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [city, setCity] = useState(carCity);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carId) return;
    setIsSubmitting(true);
    try {
      await api.post("/api/bookings/", {
        listing: parseInt(carId, 10),
        preferred_date: date,
        preferred_time: time,
        message: notes || undefined,
      });
      setIsSubmitted(true);
    } catch {
      alert("Failed to submit booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              {t("testDrive.requestSent")}
            </h1>
            {carTitle && (
              <p className="text-slate-500 mb-2">
                {t("testDrive.bookingFor")}{" "}
                <strong style={{ fontFamily: 'var(--font-geist-sans), Inter, system-ui, sans-serif' }}>
                  {carTitle}
                </strong>
              </p>
            )}
            <p className="text-slate-500 mb-6">
              <strong>{date}</strong> – <strong>{time}</strong> – <strong>{city}</strong>
            </p>
            <p className="text-sm text-slate-400 mb-8" dir="ltr">
              {phone}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/browse"
                className="flex-1 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors text-center"
              >
                {t("favorites.browseCars")}
              </Link>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setName("");
                  setPhone("");
                  setDate("");
                  setTime("");
                  setNotes("");
                }}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                {t("common.tryAgain")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className={`inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
        >
          <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          <span>{t("common.back")}</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t("testDrive.title")}
          </h1>
          <p className="text-slate-500">
            {t("testDrive.messagePlaceholder")}
          </p>
        </div>

        {/* Car Info Card */}
        {carTitle && (
          <div className={`bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6 flex items-center gap-4 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="text-sm text-accent font-medium">
                {t("testDrive.bookingFor")}
              </div>
              <div 
                className="text-slate-900 font-semibold"
                style={{ fontFamily: 'var(--font-geist-sans), Inter, system-ui, sans-serif' }}
              >
                {carTitle}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t("testDrive.fullName")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User 
                  className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                  style={{ insetInlineStart: "0.75rem" }}
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("testDrive.fullName")}
                  required
                  className="w-full py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
                  style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "1rem" }}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t("testDrive.phoneNumber")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone 
                  className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                  style={{ insetInlineStart: "0.75rem" }}
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("testDrive.phonePlaceholder")}
                  required
                  className="w-full py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
                  style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "1rem" }}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {t("testDrive.preferredDate")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar 
                    className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                    style={{ insetInlineStart: "0.75rem" }}
                  />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={minDate}
                    required
                    className="w-full py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent"
                    style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "1rem" }}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {t("testDrive.preferredTime")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock 
                    className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                    style={{ insetInlineStart: "0.75rem" }}
                  />
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent appearance-none bg-white"
                    style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "1rem" }}
                  >
                    <option value="">{t("testDrive.selectTime")}</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t("testDrive.city")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin 
                  className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                  style={{ insetInlineStart: "0.75rem" }}
                />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent appearance-none bg-white"
                  style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "1rem" }}
                >
                  <option value="">{t("testDrive.selectCity")}</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t("testDrive.message")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("testDrive.messagePlaceholder")}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t("testDrive.sending")}</span>
                </>
              ) : (
                <>
                  <Car className="w-5 h-5" />
                  <span>{t("testDrive.sendRequest")}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BookTestDrivePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <BookTestDriveContent />
    </Suspense>
  );
}
