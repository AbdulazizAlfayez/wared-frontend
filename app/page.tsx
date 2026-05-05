"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calculator,
  MapPin,
  Shield,
  BadgeCheck,
  Loader2,
  Globe,
  TrendingUp,
  Clock,
  ChevronRight,
  Car as CarIcon,
  Search,
  CreditCard,
} from "lucide-react";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { ImportedListing, PaginatedResponse } from "@/lib/types";
import { getImageUrl } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const IMPORT_STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  available:         { label: "Available",         cls: "bg-emerald-100 text-emerald-700" },
  arriving:          { label: "Arriving Soon",      cls: "bg-slate-100 text-slate-700"     },
  in_transit:        { label: "In Transit",         cls: "bg-zinc-100 text-zinc-700"       },
  at_port:           { label: "At Port",            cls: "bg-violet-100 text-violet-700"   },
  customs_clearance: { label: "Customs Clearance",  cls: "bg-amber-100 text-amber-700"     },
  reserved:          { label: "Reserved",           cls: "bg-orange-100 text-orange-700"   },
  delivered:         { label: "Delivered",          cls: "bg-slate-100 text-slate-600"     },
};

const SOURCE_COUNTRY_FLAG: Record<string, string> = {
  usa:    "🇺🇸",
  uae:    "🇦🇪",
  japan:  "🇯🇵",
  korea:  "🇰🇷",
  europe: "🇪🇺",
  canada: "🇨🇦",
  qatar:  "🇶🇦",
  other:  "🌐",
};

function formatSAR(n: number | string | null) {
  if (!n) return null;
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(Number(n));
}

// ---------------------------------------------------------------------------
// 1. Hero
// ---------------------------------------------------------------------------
const HERO_STATS_EN = [
  { value: "50+",  label: "verified importers" },
  { value: "320+", label: "cars listed" },
  { value: "22",   label: "source markets" },
];
const HERO_STATS_AR = [
  { value: "50+",  label: "مستورد موثق" },
  { value: "320+", label: "سيارة" },
  { value: "22",   label: "دولة مصدّرة" },
];

function Hero() {
  const { dir } = useTranslation();
  const isRTL = dir === "rtl";
  const stats = isRTL ? HERO_STATS_AR : HERO_STATS_EN;

  return (
    <section
      className="hero-section-wrap"
      style={{
        position: "relative",
        background: "#fafafa",
        overflow: "hidden",
        minHeight: 600,
      }}
    >
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-headline { animation: heroFadeUp 400ms ease forwards; }
        .hero-subtitle { animation: heroFadeUp 400ms ease 200ms both; }
        .hero-ctas     { animation: heroFadeUp 400ms ease 300ms both; }
        .hero-stats    { animation: heroFadeUp 400ms ease 400ms both; }
        .hero-cta-primary:hover  { opacity: 0.82 !important; }
        .hero-cta-secondary:hover { background: rgba(10,10,10,0.04) !important; }
        @media (max-width: 640px) {
          .hero-hl-text        { font-size: 40px !important; }
          .hero-subtitle-text  { max-width: 100% !important; }
          .hero-stats-row      { max-width: 100% !important; gap: 16px !important; }
          .hero-section-wrap   { min-height: 500px !important; }
          .hero-content-pad    { padding: 32px 20px !important; }
        }
      `}</style>

      {/* Layer 1 — Topographic sine-wave lines */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.4,
          pointerEvents: "none",
        }}
        preserveAspectRatio="none"
        viewBox="0 0 1200 600"
      >
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const y = 60 + i * 78;
          const amp = 28 + i * 4;
          const op = Math.max(0.05, 0.15 - i * 0.014);
          const d = `M 0,${y} C 150,${y - amp} 300,${y + amp} 450,${y} S 750,${y - amp} 900,${y} S 1100,${y + amp} 1200,${y}`;
          return (
            <path key={i} d={d} fill="none" stroke="#0a0a0a" strokeWidth="0.4" opacity={op} />
          );
        })}
      </svg>

      {/* Layer 2 — Radial glow (bottom-right) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 80% 100%, rgba(10,10,10,0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        className="hero-content-pad"
        style={{
          position: "relative",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px 32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: 600,
        }}
      >
        {/* Headline */}
        <h1
          className="hero-headline hero-hl-text"
          style={{
            fontSize: 64,
            fontWeight: 500,
            letterSpacing: "-2px",
            lineHeight: 0.98,
            color: "#0a0a0a",
            marginBottom: 16,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {isRTL ? (
            <>
              <span style={{ display: "block" }}>أي سيارة.</span>
              <span style={{ display: "block" }}>من أي مكان.</span>
              <span style={{ display: "block", color: "#999" }}>توصلك لباب بيتك.</span>
            </>
          ) : (
            <>
              <span style={{ display: "block" }}>Any car.</span>
              <span style={{ display: "block" }}>Anywhere.</span>
              <span style={{ display: "block", color: "#999" }}>Delivered to you.</span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p
          className="hero-subtitle hero-subtitle-text"
          style={{
            fontSize: 14,
            color: "#555",
            lineHeight: 1.6,
            maxWidth: "50%",
            margin: "16px 0 24px",
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {isRTL
            ? "سيارات مستوردة بعناية من شركاء موثوقين حول العالم. تابع كل خطوة من الميناء إلى باب بيتك."
            : "Hand-picked imports from verified partners worldwide. Track every step from port to your door."
          }
        </p>

        {/* CTAs */}
        <div
          className="hero-ctas"
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap" as const,
            justifyContent: isRTL ? "flex-end" : "flex-start",
          }}
        >
          <Link
            href="/browse"
            className="hero-cta-primary"
            style={{
              background: "#0a0a0a",
              color: "white",
              padding: "12px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              transition: "opacity 0.15s",
              display: "inline-block",
            }}
          >
            {isRTL ? "تصفّح السيارات ←" : "Browse cars →"}
          </Link>
          <Link
            href="/how-it-works"
            className="hero-cta-secondary"
            style={{
              background: "transparent",
              color: "#0a0a0a",
              padding: "12px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              border: "0.5px solid rgba(10,10,10,0.2)",
              textDecoration: "none",
              transition: "background 0.15s",
              display: "inline-block",
            }}
          >
            {isRTL ? "كيف تعمل المنصة" : "How it works"}
          </Link>
        </div>

        {/* Stats row */}
        <div
          className="hero-stats hero-stats-row"
          style={{
            display: "flex",
            gap: 32,
            marginTop: 32,
            paddingTop: 20,
            borderTop: "0.5px solid rgba(10,10,10,0.1)",
            maxWidth: "60%",
            flexWrap: "wrap" as const,
            justifyContent: isRTL ? "flex-end" : "flex-start",
          }}
        >
          {stats.map(({ value, label }) => (
            <div key={label} style={{ textAlign: isRTL ? "right" : "left" }}>
              <div style={{ fontSize: 22, fontWeight: 500, color: "#0a0a0a", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Stats Strip
// ---------------------------------------------------------------------------
const STATS = [
  { value: "500+",  label: "Verified Importers"    },
  { value: "3,200+", label: "Cars Imported"         },
  { value: "13",    label: "Saudi Cities Covered"  },
  { value: "98%",   label: "On-time Delivery Rate" },
];

function StatsStrip() {
  return (
    <section className="bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-black text-white tracking-tight">
                {value}
              </div>
              <div className="text-sm text-slate-400 font-medium mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. Source Countries
// ---------------------------------------------------------------------------
const SOURCE_COUNTRIES = [
  { key: "usa",    label: "USA",        sub: "Copart · IAAI",  flag: "🇺🇸" },
  { key: "uae",    label: "UAE",        sub: "Dubai · Sharjah", flag: "🇦🇪" },
  { key: "japan",  label: "Japan",      sub: "USS · TAA · JAA", flag: "🇯🇵" },
  { key: "korea",  label: "South Korea", sub: "Hyundai · Kia", flag: "🇰🇷" },
  { key: "europe", label: "Europe",     sub: "Germany · UK",   flag: "🇪🇺" },
];

function SourceCountries() {
  const router = useRouter();
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-2">
            Source Markets
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Browse by Country
          </h2>
          <p className="text-slate-500 mt-2">
            We work with auction houses and importers across these markets.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {SOURCE_COUNTRIES.map(({ key, label, sub, flag }) => (
            <button
              key={key}
              onClick={() => router.push(`/browse?source_country=${key}`)}
              className="group flex flex-col items-center gap-4 p-7 rounded-2xl border-2 border-slate-100 bg-white hover:border-accent/50 hover:bg-accent/5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 text-center"
            >
              <span className="text-5xl leading-none">{flag}</span>
              <div>
                <p className="font-bold text-slate-800 group-hover:text-accent transition-colors text-sm">
                  {label}
                </p>
                <p className="text-xs text-slate-400 mt-1">{sub}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-accent font-semibold bg-accent/10 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                Browse <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. Imported Car Card
// ---------------------------------------------------------------------------
function ImportedCarCard({ listing }: { listing: ImportedListing }) {
  const primaryImage =
    listing.images?.find((img) => img.is_primary) ?? listing.images?.[0];
  const imageUrl =
    listing.primary_image ||
    primaryImage?.image_url ||
    (primaryImage?.image ? getImageUrl(primaryImage.image) : null);

  const statusInfo = listing.import_status
    ? (IMPORT_STATUS_STYLES[listing.import_status] ??
       { label: listing.import_status, cls: "bg-slate-100 text-slate-600" })
    : null;

  const flag = listing.source_country
    ? (SOURCE_COUNTRY_FLAG[listing.source_country] ?? "🌐")
    : null;

  const finalPrice = listing.final_price_sar ?? listing.price;

  return (
    <Link href={`/car/${listing.id}`}>
      <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-accent/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 flex-shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${listing.year} ${listing.make} ${listing.model}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <CarIcon className="w-10 h-10 text-slate-300" />
              <span className="text-xs text-slate-400">No Image</span>
            </div>
          )}

          {/* Status badge */}
          {statusInfo && (
            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.cls}`}>
              {statusInfo.label}
            </div>
          )}

          {/* Country flag */}
          {flag && (
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-base">
              {flag}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2 flex-grow">
          <h3 className="font-bold text-slate-900 text-sm leading-snug">
            {listing.year} {listing.make} {listing.model}
          </h3>

          {/* Price row */}
          <div className="flex items-end gap-1.5 mt-auto pt-2">
            <span className="text-lg font-black text-accent leading-none">
              {formatSAR(finalPrice)}
            </span>
            {listing.source_price && listing.source_currency && (
              <span className="text-xs text-slate-400 leading-none pb-0.5">
                ({listing.source_currency.toUpperCase()}{" "}
                {Number(listing.source_price).toLocaleString()})
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-slate-400 border-t border-slate-100 pt-2 mt-1">
            {listing.mileage > 0 && (
              <span>{Number(listing.mileage).toLocaleString()} km</span>
            )}
            {listing.city && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {listing.city}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// 5. Featured Imported Cars
// ---------------------------------------------------------------------------
function FeaturedImportedCars() {
  const { data, isLoading } = useApiQuery<PaginatedResponse<ImportedListing>>(
    "/api/imported-cars/?ordering=-created_at&page_size=6"
  );
  const listings = Array.isArray(data) ? data : (data?.results ?? []);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-2">
              Available Now
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Featured Imports
            </h2>
          </div>
          <Link
            href="/browse"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-700 font-semibold transition-colors group"
          >
            View all
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((l) => (
              <ImportedCarCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Globe className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No imported cars listed yet.</p>
          </div>
        )}

        <div className="mt-8 sm:hidden text-center">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm"
          >
            View all cars <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6. Arriving Soon
// ---------------------------------------------------------------------------
function ArrivingSoon() {
  const { data, isLoading } = useApiQuery<PaginatedResponse<ImportedListing>>(
    "/api/imported-cars/arriving/"
  );
  const listings = Array.isArray(data) ? data : (data?.results ?? []);

  if (!isLoading && listings.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-slate-500 font-semibold text-sm uppercase tracking-widest mb-2">
              In Transit
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Arriving Soon
            </h2>
            <p className="text-slate-500 mt-1 text-sm">
              Reserve before they land.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {listings.slice(0, 8).map((l) => {
              const primaryImage =
                l.images?.find((img: { is_primary: boolean }) => img.is_primary) ?? l.images?.[0];
              const imageUrl =
                l.primary_image ||
                primaryImage?.image_url ||
                (primaryImage?.image ? getImageUrl(primaryImage.image) : null);

              return (
                <Link key={l.id} href={`/car/${l.id}`}>
                  <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-400 hover:shadow-lg transition-all duration-300">
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`${l.year} ${l.make} ${l.model}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CarIcon className="w-10 h-10 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-bold text-sm leading-tight">
                          {l.year} {l.make} {l.model}
                        </p>
                        {l.estimated_arrival_date && (
                          <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ETA {new Date(l.estimated_arrival_date).toLocaleDateString("en-SA", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900">
                        {formatSAR(l.final_price_sar ?? l.price)}
                      </span>
                      <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                        {l.source_country
                          ? (SOURCE_COUNTRY_FLAG[l.source_country] ?? "🌐") +
                            " " +
                            l.source_country.toUpperCase()
                          : "Arriving Soon"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 7. How It Works
// ---------------------------------------------------------------------------
const STEPS = [
  {
    n: "01",
    Icon: Search,
    color: "bg-accent/10 text-accent",
    title: "Browse & Choose",
    desc: "Browse cars from USA, Japan, Korea, UAE, and Europe. Full specs and auction reports upfront.",
  },
  {
    n: "02",
    Icon: Calculator,
    color: "bg-blue-100 text-blue-600",
    title: "See Total Cost",
    desc: "Instant landed cost: car price + shipping + customs 5% + VAT 15%. Zero surprises.",
  },
  {
    n: "03",
    Icon: CreditCard,
    color: "bg-violet-100 text-violet-600",
    title: "Place Your Order",
    desc: "SAR 99 reservation connects you directly with a verified importer. No middlemen.",
  },
  {
    n: "04",
    Icon: MapPin,
    color: "bg-emerald-100 text-emerald-600",
    title: "Track Live",
    desc: "10-stage live tracking from auction → vessel → Saudi port → customs → your door.",
  },
];

function HowItWorks() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-2">
            Simple Process
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            How It Works
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            From browsing to delivery — four steps to get your dream imported car in Saudi Arabia.
          </p>
        </div>

        {/* Steps grid with connector lines on desktop */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Connector line (desktop only) */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" aria-hidden />

          {STEPS.map(({ n, Icon, color, title, desc }) => (
            <div key={n} className="relative bg-white rounded-2xl p-7 border border-slate-100 hover:border-accent/40 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group">
              {/* Step number */}
              <div className="text-[64px] font-black text-slate-50 select-none leading-none absolute top-4 right-5 group-hover:text-accent/10 transition-colors">
                {n}
              </div>
              {/* Icon */}
              <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/how-it-works"
            className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-600 font-semibold transition-colors"
          >
            Learn more about the process <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 8. Cost Calculator Teaser
// ---------------------------------------------------------------------------
function CalculatorTeaser() {
  const router = useRouter();
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)",
          }}
        >
          <div className="px-8 sm:px-16 py-16 flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 text-white">
              <p className="text-white/70 font-semibold text-sm uppercase tracking-widest mb-3">
                Free Tool
              </p>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
                How much will it really cost?
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-md">
                Calculate the full landed cost in SAR — car price, shipping,
                customs duty, VAT, port fees — for any car from any country.
              </p>
              <button
                onClick={() => router.push("/calculator")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-accent font-bold hover:bg-slate-50 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Calculator className="w-5 h-5" />
                Open Calculator
              </button>
            </div>

            {/* Example breakdown card */}
            <div className="flex-shrink-0 w-full lg:w-72 bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">
                Example: 2022 Toyota from USA
              </p>
              {[
                { l: "Car price (USD 16,000)", v: "SAR 60,000" },
                { l: "Customs duty (5%)",      v: "SAR 3,000"  },
                { l: "VAT (15%)",              v: "SAR 9,450"  },
                { l: "Shipping",               v: "SAR 4,000"  },
                { l: "Inspection + handling",  v: "SAR 1,800"  },
              ].map(({ l, v }) => (
                <div key={l} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0 text-sm">
                  <span className="text-white/70">{l}</span>
                  <span className="font-bold">{v}</span>
                </div>
              ))}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20">
                <span className="text-white/80 font-semibold text-sm">Total</span>
                <span className="text-xl font-black">≈ SAR 78,250</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 9. Why Choose Us
// ---------------------------------------------------------------------------
const TRUST_POINTS = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Verified Importers Only",
    desc: "Every importer is vetted. Commercial registration, import license, and track record — all verified.",
  },
  {
    icon: <BadgeCheck className="w-6 h-6" />,
    title: "Zero Hidden Fees",
    desc: "The total landed cost shown is what you pay. Customs, VAT, shipping — all included upfront.",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Live Shipment Tracking",
    desc: "Track your car from the auction house through the port and customs to your door.",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Saudi Compliance",
    desc: "All imports are SASO-certified and fully customs-cleared before delivery.",
  },
];

function TrustSection() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-2">
            Our Promise
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Why MARKABA
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TRUST_POINTS.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-7 border border-slate-200 hover:border-accent/30 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center mb-5">
                {icon}
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-base">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 10. Importer CTA
// ---------------------------------------------------------------------------
function ImporterCTA() {
  return (
    <section className="py-4 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl text-white px-8 sm:px-16 py-16 text-center"
          style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #1a1a1a 100%)" }}
        >
          {/* Background decoration */}
          <div aria-hidden className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(192,192,192,0.25), transparent 70%)", transform: "translate(30%, -30%)" }} />
          <div aria-hidden className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, white, transparent 70%)", transform: "translate(-30%, 30%)" }} />

          <div className="relative">
            <p className="font-semibold text-sm uppercase tracking-widest mb-4 text-slate-300">
              For Importers
            </p>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight mb-5">
              Are you an importer?
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
              List your inventory, manage orders, and connect with thousands of Saudi buyers looking for imported cars every day.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/become-importer"
                className="inline-flex items-center gap-2 px-9 py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-bold text-base transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Apply as Importer
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 px-9 py-4 border border-white/30 hover:border-white/60 text-white rounded-2xl font-semibold text-base transition-all hover:-translate-y-0.5 hover:bg-white/10"
              >
                Browse Cars
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Root page
// ---------------------------------------------------------------------------
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <StatsStrip />
      <SourceCountries />
      <FeaturedImportedCars />
      <ArrivingSoon />
      <HowItWorks />
      <CalculatorTeaser />
      <TrustSection />
      <ImporterCTA />
    </div>
  );
}
