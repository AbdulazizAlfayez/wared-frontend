"use client";

import { useState, useRef, useMemo, forwardRef, useCallback } from "react";
import Link from "next/link";
import {
  Search, Phone, MapPin, Star, BadgeCheck, X, Loader2,
  Building2, Plus, ArrowRight,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import ShowroomMap, { type Showroom } from "@/components/ShowroomMap";
import { useApiQuery } from "@/lib/hooks/use-api";
import { useAuth } from "@/lib/auth-context";
import type { PaginatedResponse } from "@/lib/types";

// ---------------------------------------------------------------------------
// Local types — matches what the backend list endpoint actually returns
// (fields from ShowroomPreview + lat/lng fallbacks from DjangoShowroom)
// ---------------------------------------------------------------------------

interface ShowroomApiItem {
  id: number;
  name: string;
  city: string;
  address?: string;
  // Geo — backend may use either naming convention
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  // Contact
  phone?: string;
  // Stats / meta
  average_rating?: number | string;
  rating?: number; // legacy
  is_verified?: boolean;
  active_listings?: number;
  total_reviews?: number;
  // Taxonomy — backend may use either naming convention
  specializations?: string[];
  services?: string[]; // legacy
  // Media
  logo?: string | null;
  cover_photo?: string | null;
}

function djangoToShowroom(s: ShowroomApiItem): Showroom {
  return {
    id: String(s.id),
    name: s.name,
    city: s.city,
    address: s.address ?? "",
    lat: s.lat ?? s.latitude ?? 24.7136,
    lng: s.lng ?? s.longitude ?? 46.6753,
    phone: s.phone ?? "",
    services: s.specializations ?? s.services ?? [],
    rating: Number(s.average_rating ?? s.rating ?? 0),
    isVerified: s.is_verified ?? false,
    logo: s.logo ?? null,
    activeListings: s.active_listings ?? 0,
    totalReviews: s.total_reviews ?? 0,
    cars: [],
  };
}

// Fallback sample data (shown only when API returns no results)
const sampleShowrooms: Showroom[] = [
  {
    id: "sample-1", name: "Al Jazirah Showroom", city: "Riyadh",
    address: "King Fahd Road, Al Olaya District", lat: 24.7136, lng: 46.6753,
    phone: "+966 11 234 5678", services: ["Financing", "Certified", "Trade-in", "Warranty"],
    rating: 4.8, isVerified: true, logo: null, activeListings: 0, totalReviews: 0, cars: [],
  },
  {
    id: "sample-2", name: "Jeddah Motors", city: "Jeddah",
    address: "Prince Sultan Road, Al Rawdah", lat: 21.5433, lng: 39.1728,
    phone: "+966 12 345 6789", services: ["Financing", "Insurance", "Delivery", "Test Drive"],
    rating: 4.6, isVerified: false, logo: null, activeListings: 0, totalReviews: 0, cars: [],
  },
  {
    id: "sample-3", name: "Eastern Province Auto", city: "Dammam",
    address: "King Saud Street, Al Faisaliah", lat: 26.4207, lng: 50.0888,
    phone: "+966 13 456 7890", services: ["Certified", "Warranty", "After-sale Service"],
    rating: 4.7, isVerified: true, logo: null, activeListings: 0, totalReviews: 0, cars: [],
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ShowroomsPage() {
  const { t, locale, dir } = useTranslation();
  const { role } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShowroom, setSelectedShowroom] = useState<Showroom | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { data, isLoading } = useApiQuery<PaginatedResponse<ShowroomApiItem>>("/api/showrooms/");

  const showrooms = useMemo((): Showroom[] => {
    const raw = data?.results ?? [];
    let list: Showroom[] = raw.length > 0 ? raw.map(djangoToShowroom) : sampleShowrooms;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.services.some((svc) => svc.toLowerCase().includes(q))
      );
    }
    return list;
  }, [data, searchQuery]);

  const selectShowroom = useCallback((showroom: Showroom) => {
    setSelectedShowroom(showroom);
    setTimeout(() => {
      const el = cardRefs.current.get(showroom.id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, []);

  const isDealer = role === "dealer" || role === "admin";

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {locale === "ar" ? "معارض السيارات" : "Showrooms"}
            </h1>
            <p className="text-gray-600">
              {locale === "ar"
                ? "اكتشف أفضل معارض السيارات في المملكة العربية السعودية"
                : "Discover the best car dealerships across Saudi Arabia"}
            </p>
          </div>
          {isDealer && (
            <Link
              href="/dashboard/showroom"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              {locale === "ar" ? "معرضي" : "My Showroom"}
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-xl">
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
                  ? "ابحث عن معرض، مدينة، أو خدمة..."
                  : "Search showroom, city, or service..."
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
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-500">
              {showrooms.length} result{showrooms.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 mb-4 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading showrooms…</span>
          </div>
        )}

        {/* Main Content: Map + List */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map */}
          <div className="w-full lg:w-1/2 order-1 lg:order-2">
            <div className="sticky top-24 h-[350px] lg:h-[calc(100vh-12rem)] rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
              <ShowroomMap
                showrooms={showrooms}
                selectedShowroom={selectedShowroom}
                onMarkerClick={selectShowroom}
              />
            </div>
          </div>

          {/* Showroom List */}
          <div
            ref={listRef}
            className="w-full lg:w-1/2 order-2 lg:order-1 space-y-4 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:scroll-smooth lg:pr-2"
          >
            {showrooms.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No showrooms found</h3>
                <p className="text-gray-500">Try a different search term.</p>
              </div>
            ) : (
              showrooms.map((showroom) => (
                <ShowroomCard
                  key={showroom.id}
                  showroom={showroom}
                  isSelected={selectedShowroom?.id === showroom.id}
                  onSelect={() => selectShowroom(showroom)}
                  locale={locale}
                  ref={(el) => {
                    if (el) cardRefs.current.set(showroom.id, el);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ShowroomCard
// ---------------------------------------------------------------------------

interface ShowroomCardProps {
  showroom: Showroom;
  isSelected: boolean;
  onSelect: () => void;
  locale: string;
}

const ShowroomCard = forwardRef<HTMLDivElement, ShowroomCardProps>(
  ({ showroom, isSelected, onSelect, locale }, ref) => {
    const isSample = showroom.id.startsWith("sample-");

    return (
      <div
        ref={ref}
        className={`bg-white rounded-2xl border-2 transition-all ${
          isSelected
            ? "border-emerald-500 shadow-lg ring-2 ring-emerald-500/20"
            : "border-gray-100 hover:border-emerald-300 shadow-sm hover:shadow-md"
        }`}
      >
        {/* Make the whole top section (minus action buttons) navigate to detail */}
        <div
          className="p-5 cursor-pointer"
          onClick={onSelect}
        >
          {/* Selected indicator */}
          {isSelected && (
            <div className="mb-3 flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Selected on map
            </div>
          )}

          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* Logo */}
            {showroom.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={showroom.logo}
                alt={showroom.name}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-emerald-600">
                  {showroom.name.charAt(0)}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base font-semibold text-gray-900">{showroom.name}</h3>
                {showroom.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                {showroom.city}{showroom.address ? ` · ${showroom.address}` : ""}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg flex-shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium text-amber-700">
                {Number(showroom.rating) > 0 ? Number(showroom.rating).toFixed(1) : "New"}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            {showroom.activeListings > 0 && (
              <span>{showroom.activeListings} listings</span>
            )}
            {showroom.totalReviews > 0 && (
              <span>{showroom.totalReviews} reviews</span>
            )}
          </div>

          {/* Services / Specializations */}
          {showroom.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1">
              {showroom.services.slice(0, 4).map((service) => (
                <span
                  key={service}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                >
                  {service}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-4 flex items-center gap-2 flex-wrap border-t border-gray-50 pt-3">
          {showroom.phone && (
            <a
              href={`tel:${showroom.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              {locale === "ar" ? "اتصل" : "Call"}
            </a>
          )}
          {!isSample && (
            <Link
              href={`/showrooms/${showroom.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-2 border-2 border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
            >
              {locale === "ar" ? "التفاصيل" : "View Details"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    );
  }
);

ShowroomCard.displayName = "ShowroomCard";
