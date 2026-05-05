"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { PaginatedResponse } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowLeft, Star, BadgeCheck, MapPin, Phone, Mail, Globe,
  Package, Clock, CheckCircle, Loader2, MessageSquare, ExternalLink,
  Users, Car, ChevronRight, Truck, TrendingUp,
} from "lucide-react";
import { getImageUrl } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ImporterProfile {
  id:               number;
  business_name:    string;
  description:      string | null;
  city:             string | null;
  address:          string | null;
  phone:            string | null;
  email:            string | null;
  website:          string | null;
  whatsapp:         string | null;
  logo_url:         string | null;
  cover_photo_url:  string | null;
  is_verified:      boolean;
  average_rating:   number;
  review_count:     number;
  source_countries: string[];
  specializations:  string[];
  total_imports:    number;
  avg_delivery_days: number | null;
  success_rate:     number | null;
  years_in_business: string | null;
  member_since:     string;
  active_listings:  number;
}

interface ImporterInventoryItem {
  id:              number;
  make:            string;
  model:           string;
  year:            number;
  final_price_sar: number | null;
  price:           number;
  source_country:  string | null;
  import_status:   string | null;
  import_status_display?: string;
  primary_image:   string | null;
  mileage:         number;
}

interface ImporterReview {
  id:         number;
  reviewer:   { name: string; avatar_url: string | null };
  rating:     number;
  comment:    string;
  created_at: string;
  order_number?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const COUNTRY_FLAGS: Record<string, string> = {
  usa:"🇺🇸", us:"🇺🇸", japan:"🇯🇵", jp:"🇯🇵",
  uae:"🇦🇪", ae:"🇦🇪", korea:"🇰🇷", kr:"🇰🇷",
  germany:"🇩🇪", de:"🇩🇪", uk:"🇬🇧", gb:"🇬🇧",
  canada:"🇨🇦", ca:"🇨🇦", europe:"🇪🇺", eu:"🇪🇺",
};

const COUNTRY_NAMES: Record<string, string> = {
  usa:"United States", japan:"Japan", uae:"UAE", korea:"South Korea",
  germany:"Germany", uk:"United Kingdom", canada:"Canada", europe:"Europe",
};

const STATUS_COLORS: Record<string, string> = {
  available:"bg-accent/10 text-accent",
  arriving:"bg-blue-100 text-blue-700",
  in_transit:"bg-blue-100 text-blue-700",
  at_port:"bg-purple-100 text-purple-700",
  customs_clearance:"bg-orange-100 text-orange-700",
  delivered:"bg-green-100 text-green-700",
};

const formatSAR = (n: number | null | undefined) => {
  if (n == null) return "—";
  const num = typeof (n as unknown) === "string" ? parseFloat(n as unknown as string) : n;
  return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(num);
};

const formatDate = (s: string) => new Date(s).toLocaleDateString("en-SA", { year: "numeric", month: "long", day: "numeric" });

// ---------------------------------------------------------------------------
// Star row
// ---------------------------------------------------------------------------
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <svg key={n} className={`w-4 h-4 ${n <= Math.round(rating) ? "text-yellow-400" : "text-slate-200"}`}
          viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inventory tab
// ---------------------------------------------------------------------------
function InventoryTab({ importerId }: { importerId: string }) {
  const { data, isLoading } = useApiQuery<PaginatedResponse<ImporterInventoryItem> | ImporterInventoryItem[]>(
    `/api/importers/${importerId}/inventory/`
  );
  const items: ImporterInventoryItem[] = Array.isArray(data) ? data : (data?.results ?? []);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;

  if (items.length === 0) return (
    <div className="py-12 text-center">
      <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-400 text-sm">No active listings right now.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((car) => {
        const img = car.primary_image
          ? (car.primary_image.startsWith("http") ? car.primary_image : getImageUrl(car.primary_image))
          : "/images/car-placeholder.jpg";
        const flag = COUNTRY_FLAGS[car.source_country?.toLowerCase() ?? ""] ?? "🌍";
        const statusColor = STATUS_COLORS[car.import_status ?? ""] ?? "bg-slate-100 text-slate-600";

        return (
          <Link
            key={car.id}
            href={`/car/${car.id}`}
            className="group bg-white rounded-xl border border-slate-100 hover:border-accent/30 hover:shadow-md transition-all overflow-hidden"
          >
            <div className="relative h-40 bg-slate-100">
              <Image src={img} alt={`${car.make} ${car.model}`} fill className="object-cover" />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                  {car.import_status_display ?? car.import_status?.replace(/_/g," ") ?? "Available"}
                </span>
              </div>
              <div className="absolute top-2.5 right-2.5 text-xl">{flag}</div>
            </div>
            <div className="p-3">
              <p className="font-semibold text-slate-900 text-sm">{car.year} {car.make} {car.model}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Intl.NumberFormat("en-SA").format(car.mileage)} km
                {car.source_country && ` · ${COUNTRY_NAMES[car.source_country.toLowerCase()] ?? car.source_country}`}
              </p>
              <p className="text-accent font-bold text-sm mt-2">{formatSAR(car.final_price_sar ?? car.price)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reviews tab
// ---------------------------------------------------------------------------
function ReviewsTab({ importerId }: { importerId: string }) {
  const { data, isLoading } = useApiQuery<PaginatedResponse<ImporterReview> | ImporterReview[]>(
    `/api/importers/${importerId}/reviews/`
  );
  const reviews: ImporterReview[] = Array.isArray(data) ? data : (data?.results ?? []);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;

  if (reviews.length === 0) return (
    <div className="py-12 text-center">
      <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-400 text-sm">No reviews yet.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              {r.reviewer.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.reviewer.avatar_url} alt={r.reviewer.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-slate-400">{r.reviewer.name[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 text-sm">{r.reviewer.name}</span>
                <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span>
              </div>
              <Stars rating={r.rating} />
              {r.order_number && (
                <p className="text-xs text-slate-400 mt-1 font-mono">{r.order_number}</p>
              )}
              {r.comment && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{r.comment}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ImporterProfilePage() {
  const params = useParams();
  const importerId = params.id as string;
  const [activeTab, setActiveTab] = useState<"inventory" | "reviews">("inventory");

  const { data: importer, isLoading } = useApiQuery<ImporterProfile>(
    `/api/importers/${importerId}/`,
    { enabled: !!importerId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!importer) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 text-center py-20">
          <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Importer Not Found</h1>
          <Link href="/importers" className="px-5 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-600 transition-colors text-sm">
            Back to Importers
          </Link>
        </div>
      </div>
    );
  }

  const initials = importer.business_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Cover — decorative only, no text inside */}
      <div className="relative h-48 sm:h-56 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
        {importer.cover_photo_url && (
          <Image src={importer.cover_photo_url} alt="" fill className="object-cover opacity-40" />
        )}
        <div className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />
        <div className="absolute top-6 left-6">
          <Link href="/importers" className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            All Importers
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Identity block — logo overlaps header, all text is on white */}
        <div className="mb-6">
          {/* Logo circle — only this overlaps the header */}
          <div className="-mt-12 mb-4 flex-shrink-0 inline-block">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl bg-white flex items-center justify-center overflow-hidden">
              {importer.logo_url ? (
                <Image src={importer.logo_url} alt={importer.business_name} width={80} height={80} className="object-contain p-1" />
              ) : (
                <span className="text-2xl font-bold text-[#0a0a0a]">{initials}</span>
              )}
            </div>
          </div>

          {/* Name, badge, city, stars — all clearly on white background */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{importer.business_name}</h1>
              {importer.is_verified && (
                <span className="flex items-center gap-1 bg-[#f3f4f6] text-[#0a0a0a] border border-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verified Importer
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap text-sm text-slate-500">
              {importer.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  {importer.city}
                </span>
              )}
              {importer.source_countries.length > 0 && (
                <span className="flex items-center gap-1.5">
                  {importer.source_countries.slice(0, 4).map((c) => (
                    <span key={c} className="text-lg leading-none" title={COUNTRY_NAMES[c.toLowerCase()] ?? c}>
                      {COUNTRY_FLAGS[c.toLowerCase()] ?? "🌍"}
                    </span>
                  ))}
                  {importer.source_countries.length > 4 && (
                    <span className="text-xs text-slate-400">+{importer.source_countries.length - 4}</span>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <Stars rating={importer.average_rating} />
              <span className="text-sm text-slate-600 font-medium">
                {Number(importer.average_rating) > 0 ? Number(importer.average_rating).toFixed(1) : "No ratings"}
              </span>
              {importer.review_count > 0 && (
                <span className="text-sm text-slate-400">({importer.review_count} reviews)</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                <div className="text-2xl font-black text-accent">
                  {importer.total_imports != null ? importer.total_imports : 0}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Cars Imported</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                <div className="text-2xl font-black text-slate-900">
                  {importer.avg_delivery_days != null
                    ? `${Number(importer.avg_delivery_days)} days`
                    : "N/A"}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Avg. Delivery</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                <div className="text-2xl font-black text-slate-900">
                  {importer.success_rate != null
                    ? `${Number(importer.success_rate).toFixed(0)}%`
                    : "N/A"}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Success Rate</div>
              </div>
            </div>

            {/* About */}
            {importer.description && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">About</h2>
                <p className="text-slate-600 text-sm leading-relaxed">{importer.description}</p>
              </div>
            )}

            {/* Source countries */}
            {importer.source_countries.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Source Markets</h2>
                <div className="flex flex-wrap gap-2">
                  {importer.source_countries.map((c) => {
                    const key = c.toLowerCase();
                    return (
                      <div key={c} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xl">{COUNTRY_FLAGS[key] ?? "🌍"}</span>
                        <span className="text-sm font-medium text-slate-700">{COUNTRY_NAMES[key] ?? c}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Specializations */}
            {importer.specializations.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Specializations</h2>
                <div className="flex flex-wrap gap-2">
                  {importer.specializations.map((s) => (
                    <span key={s} className="px-3 py-1.5 bg-accent/5 text-accent border border-accent/20 rounded-full text-sm font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs: Inventory | Reviews */}
            <div>
              <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 mb-5 w-fit">
                {(["inventory", "reviews"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab ? "bg-accent text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab === "inventory" ? <Car className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                    {tab === "inventory" ? `Inventory (${importer.active_listings})` : `Reviews (${importer.review_count})`}
                  </button>
                ))}
              </div>
              {activeTab === "inventory"
                ? <InventoryTab importerId={importerId} />
                : <ReviewsTab importerId={importerId} />
              }
            </div>
          </div>

          {/* Right: Contact sidebar */}
          <div className="space-y-4">
            {/* Contact Card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Contact</h2>

              {importer.phone && (
                <a href={`tel:${importer.phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                    <Phone className="w-4 h-4 text-slate-500 group-hover:text-accent" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium" dir="ltr">{importer.phone}</span>
                </a>
              )}

              {importer.whatsapp && (
                <a
                  href={`https://wa.me/${importer.whatsapp.replace(/\D/g,"")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                    <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                  </div>
                  <span className="text-sm text-slate-700 font-medium">WhatsApp</span>
                </a>
              )}

              {importer.email && (
                <a href={`mailto:${importer.email}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                    <Mail className="w-4 h-4 text-slate-500 group-hover:text-accent" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium truncate">{importer.email}</span>
                </a>
              )}

              {importer.website && (
                <a href={importer.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                    <Globe className="w-4 h-4 text-slate-500 group-hover:text-accent" />
                  </div>
                  <span className="text-sm text-accent font-medium flex items-center gap-1">
                    Website <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              )}

              <Link
                href={`/messages?importer=${importer.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl text-sm font-semibold transition-colors mt-2"
              >
                <MessageSquare className="w-4 h-4" />
                Send Message
              </Link>
            </div>

            {/* Meta */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-2.5">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">Info</h2>
              {importer.years_in_business && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Experience</span>
                  <span className="font-medium text-slate-700">{importer.years_in_business}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Member since</span>
                <span className="font-medium text-slate-700">{new Date(importer.member_since).getFullYear()}</span>
              </div>
              {importer.address && (
                <div className="text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5 mb-0.5"><MapPin className="w-3.5 h-3.5" />Address</span>
                  <span className="text-slate-600 text-xs">{importer.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
