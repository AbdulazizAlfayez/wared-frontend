"use client";

import { useState, useRef, useMemo, forwardRef, useCallback } from "react";
import Link from "next/link";
import {
  Search, MapPin, Star, X, Loader2, Store, Plus, ArrowRight,
  Wrench, CheckCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import WorkshopMap from "@/components/WorkshopMap";
import { Workshop } from "@/lib/workshops";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { WorkshopListItem, PaginatedResponse, City } from "@/lib/types";

function toMapWorkshop(w: WorkshopListItem): Workshop {
  return {
    id: String(w.id),
    name: w.name,
    city: w.city,
    address: "",
    lat: w.latitude != null ? Number(w.latitude) : 24.7136,
    lng: w.longitude != null ? Number(w.longitude) : 46.6753,
    phone: "",
    services: w.specializations ?? [],
    rating: Number(w.average_rating || 0),
    cars: [],
  };
}

export default function WorkshopPage() {
  const { locale, dir } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const queryParams = new URLSearchParams();
  if (cityFilter) queryParams.set("city_obj", cityFilter);
  if (verifiedOnly) queryParams.set("is_verified", "true");

  const { data, isLoading } = useApiQuery<PaginatedResponse<WorkshopListItem>>(
    `/api/workshops/?${queryParams.toString()}`,
    { deps: [cityFilter, verifiedOnly] }
  );
  const { data: citiesData } = useApiQuery<PaginatedResponse<City> | City[]>("/api/cities/");
  const cities = Array.isArray(citiesData)
    ? citiesData
    : (citiesData as { results?: City[] })?.results ?? [];

  const workshops = data?.results ?? [];

  const filtered = useMemo((): WorkshopListItem[] => {
    if (!searchQuery) return workshops;
    const q = searchQuery.toLowerCase();
    return workshops.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.city.toLowerCase().includes(q) ||
        (w.specializations ?? []).some((s) => s.toLowerCase().includes(q))
    );
  }, [workshops, searchQuery]);

  const mapWorkshops = useMemo(() => filtered.map(toMapWorkshop), [filtered]);

  const selectWorkshop = useCallback(
    (workshop: Workshop) => {
      setSelectedWorkshop(workshop);
      setTimeout(() => {
        const el = cardRefs.current.get(workshop.id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    },
    []
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {locale === "ar" ? "ورش السيارات" : "Workshops"}
            </h1>
            <p className="text-gray-600">
              {locale === "ar"
                ? "ابحث عن أفضل ورش السيارات في المملكة"
                : "Find the best car workshops across Saudi Arabia"}
            </p>
          </div>
          <Link
            href="/create-workshop"
            className={`inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors ${dir === "rtl" ? "flex-row-reverse" : ""}`}
          >
            <Plus className="w-5 h-5" />
            {locale === "ar" ? "أنشئ ورشتك" : "Create Workshop"}
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              style={{ insetInlineStart: "0.75rem" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                locale === "ar"
                  ? "ابحث عن ورشة، مدينة، أو تخصص..."
                  : "Search workshop, city, or specialization..."
              }
              className="w-full py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
              style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "2.5rem" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                style={{ insetInlineEnd: "0.75rem" }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {cities.length > 0 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">{locale === "ar" ? "كل المدن" : "All Cities"}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === "ar" ? c.name_ar : (c.name_en || c.name || "")}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-emerald-400 transition-colors">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="accent-emerald-600"
            />
            <span className="text-sm text-gray-700 whitespace-nowrap">
              {locale === "ar" ? "موثّق فقط" : "Verified Only"}
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </label>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 mb-4 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{locale === "ar" ? "جاري التحميل..." : "Loading workshops..."}</span>
          </div>
        )}

        {searchQuery && (
          <p className="mb-3 text-sm text-gray-500">
            {locale === "ar"
              ? `${filtered.length} نتيجة`
              : `${filtered.length} result${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        )}

        {selectedWorkshop && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
            <strong>{locale === "ar" ? "محدد:" : "Selected:"}</strong> {selectedWorkshop.name}
          </div>
        )}

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map */}
          <div className={`w-full lg:w-1/2 order-1 ${dir === "rtl" ? "lg:order-1" : "lg:order-2"}`}>
            <div className="sticky top-24 h-[350px] lg:h-[calc(100vh-12rem)] rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
              <WorkshopMap
                workshops={mapWorkshops}
                selectedWorkshop={selectedWorkshop}
                onMarkerClick={selectWorkshop}
              />
            </div>
          </div>

          {/* List */}
          <div
            ref={listRef}
            className={`w-full lg:w-1/2 order-2 space-y-4 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:scroll-smooth ${dir === "rtl" ? "lg:order-2 lg:pl-2" : "lg:order-1 lg:pr-2"}`}
          >
            {!isLoading && filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {locale === "ar" ? "لا توجد ورش" : "No workshops found"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {locale === "ar" ? "كن أول من يضيف ورشته!" : "Be the first to add your workshop!"}
                </p>
                <Link
                  href="/create-workshop"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {locale === "ar" ? "أنشئ ورشة" : "Create Workshop"}
                </Link>
              </div>
            ) : (
              filtered.map((workshop) => {
                const mapWs = toMapWorkshop(workshop);
                return (
                  <WorkshopCard
                    key={workshop.id}
                    workshop={workshop}
                    isSelected={selectedWorkshop?.id === String(workshop.id)}
                    onSelect={() => setSelectedWorkshop(mapWs)}
                    onViewOnMap={() => selectWorkshop(mapWs)}
                    locale={locale}
                    dir={dir}
                    ref={(el) => {
                      if (el) cardRefs.current.set(String(workshop.id), el);
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface WorkshopCardProps {
  workshop: WorkshopListItem;
  isSelected: boolean;
  onSelect: () => void;
  onViewOnMap: () => void;
  locale: string;
  dir?: string;
}

const WorkshopCard = forwardRef<HTMLDivElement, WorkshopCardProps>(
  ({ workshop, isSelected, onSelect, onViewOnMap, locale, dir }, ref) => {
    const isRTL = dir === "rtl";

    return (
      <div
        ref={ref}
        className={`bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer ${
          isSelected
            ? "border-emerald-500 shadow-lg ring-2 ring-emerald-500/20 bg-emerald-50/30"
            : "border-gray-100 hover:border-emerald-300 shadow-sm hover:shadow-md"
        }`}
        onClick={onSelect}
      >
        {isSelected && (
          <div className="mb-3 flex items-center gap-2 text-emerald-600 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {locale === "ar" ? "محدد على الخريطة" : "Selected on map"}
          </div>
        )}

        <div className="flex items-start gap-3 mb-3">
          {/* Logo */}
          {workshop.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={workshop.logo_url}
              alt={workshop.name}
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-6 h-6 text-orange-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                {workshop.name_display || workshop.name}
              </h3>
              {workshop.is_verified && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  <CheckCircle className="w-3 h-3" />
                  {locale === "ar" ? "موثّق" : "Verified"}
                </span>
              )}
            </div>
            <p
              className={`text-sm text-gray-500 flex items-center gap-1 mt-0.5 ${isRTL ? "flex-row-reverse justify-end" : ""}`}
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
              <span>{workshop.city_display || workshop.city}</span>
            </p>
          </div>

          {/* Rating */}
          {Number(workshop.average_rating || 0) > 0 && (
            <div
              className={`flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium text-amber-700">
                {Number(workshop.average_rating || 0).toFixed(1)}
              </span>
              {workshop.total_reviews > 0 && (
                <span className="text-xs text-amber-600">({workshop.total_reviews})</span>
              )}
            </div>
          )}
        </div>

        {/* Specializations */}
        {workshop.specializations?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {workshop.specializations.slice(0, 4).map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full"
              >
                {s}
              </span>
            ))}
            {workshop.specializations.length > 4 && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{workshop.specializations.length - 4}
              </span>
            )}
          </div>
        )}

        {workshop.services_count > 0 && (
          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5 text-emerald-600" />
            {workshop.services_count}{" "}
            {locale === "ar"
              ? "خدمة"
              : `service${workshop.services_count !== 1 ? "s" : ""}`}
          </p>
        )}

        {/* Actions */}
        <div className={`flex items-center gap-2 mt-1 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewOnMap();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 border-2 rounded-lg text-sm font-medium transition-all ${
              isSelected
                ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                : "border-gray-200 text-gray-700 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
            } ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <MapPin className="w-4 h-4" />
            {locale === "ar" ? "عرض على الخريطة" : "View on map"}
          </button>
          <Link
            href={`/workshop/${workshop.id}`}
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-2 border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
          >
            {locale === "ar" ? "التفاصيل" : "View Details"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }
);

WorkshopCard.displayName = "WorkshopCard";
