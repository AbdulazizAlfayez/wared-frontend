"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Globe,
  Clock,
  Car as CarIcon,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { ImportedListing, PaginatedResponse } from "@/lib/types";
import { getImageUrl } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { FadeIn, StaggerContainer, StaggerItem, AnimatedCounter, MagneticWrap } from "@/components/motion";

// ---------------------------------------------------------------------------
// Helpers (preserved from existing code)
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

// Arrow SVG for buttons
const ArrowSvg = () => (
  <svg viewBox="0 0 10 10" fill="none" className="w-[10px] h-[10px]">
    <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------------------
// Reveal on scroll hook
// ---------------------------------------------------------------------------
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll(".mk-reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.05, rootMargin: "0px 0px -5% 0px" }
    );
    els.forEach((el) => io.observe(el));
    // Fallback: reveal above-fold elements immediately
    requestAnimationFrame(() => {
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
      });
    });
    setTimeout(() => els.forEach((el) => el.classList.add("in")), 1400);
    return () => io.disconnect();
  }, []);
  return ref;
}

// ---------------------------------------------------------------------------
// Shared hook: fetch real listing + importer counts from API
// ---------------------------------------------------------------------------
function useRealStats() {
  const { data: listingsData } = useApiQuery<PaginatedResponse<ImportedListing>>(
    "/api/listings/?page_size=1"
  );
  const { data: importersData } = useApiQuery<PaginatedResponse<unknown>>(
    "/api/importers/?page_size=1"
  );
  const listingCount = (listingsData && !Array.isArray(listingsData)) ? listingsData.count : null;
  const importerCount = (importersData && !Array.isArray(importersData)) ? (importersData as PaginatedResponse<unknown>).count : null;
  return { listingCount, importerCount };
}

// ---------------------------------------------------------------------------
// 1. Hero
// ---------------------------------------------------------------------------
function Hero() {
  const { dir } = useTranslation();
  const isRTL = dir === "rtl";
  const { listingCount, importerCount } = useRealStats();

  return (
    <section className="hero-section relative overflow-hidden" style={{ minHeight: "100vh", paddingBottom: 60, background: "var(--mk-ink)" }}>
      {/* Background video */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <img
        src="/videos/hero-poster.jpg"
        alt=""
        aria-hidden="true"
        className="hero-video-fallback hidden absolute inset-0 w-full h-full object-cover z-0"
      />
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/videos/hero-poster.jpg"
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/hero-mobile.mp4" media="(max-width: 767px)" type="video/mp4" />
        <source src="/videos/hero-desktop.mp4" type="video/mp4" />
      </video>

      {/* Dark gradient overlay */}
      <div aria-hidden="true" className="absolute inset-0 z-10 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Content — above video + overlay */}
      <div className="hero-wrap relative z-20">
        {/* Eyebrow */}
        <FadeIn delay={0.1}>
          <div className="flex items-center gap-[14px] mb-7">
            <span className="mk-btn hero-pill font-geist" style={{ padding: "6px 12px", fontSize: 12, cursor: "default" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.6" /></svg>
              {isRTL ? "مستوردة إلى السعودية · موثقة جمركياً" : "Imported to Saudi Arabia · Verified by customs"}
            </span>
            <span className="mk-eyebrow hero-eyebrow font-geist"><span className="dot" />{isRTL ? "نوفر من أسواق عالمية متعددة" : "Now sourcing from multiple markets"}</span>
          </div>
        </FadeIn>

        {/* Headline */}
        <FadeIn delay={0.25} y={40} duration={0.9}>
          <h1 className="font-geist font-extrabold text-white" style={{ letterSpacing: "-0.045em", lineHeight: 0.92, fontSize: "clamp(64px, 11.5vw, 200px)", maxWidth: "11ch" }}>
            {isRTL ? (
              <>أي سيارة.<br />من أي مكان.<br /><span className="text-white/40">توصلك <span className="font-light">لبابك</span>.</span></>
            ) : (
              <>Any car.<br />Anywhere.<br /><span className="text-white/40">Delivered <span className="font-light">to&nbsp;you</span>.</span></>
            )}
          </h1>
        </FadeIn>

        {/* Subtitle + CTAs */}
        <FadeIn delay={0.45} duration={0.8}>
          <div className="mt-9" style={{ maxWidth: "52ch" }}>
            <p className="font-geist text-white/75" style={{ fontSize: 18, lineHeight: 1.45 }}>
              {isRTL
                ? "سيارات مستوردة بعناية من شركاء موثوقين حول العالم. تابع كل خطوة من الميناء إلى باب بيتك — الأوراق، الجمارك والشحن في مكان واحد."
                : "Hand-picked imports from verified partners worldwide. Track every step from port to your door — paperwork, duties and shipping handled in one place."}
            </p>
            <div className="flex gap-3 mt-7">
              <MagneticWrap strength={0.15}>
                <Link href="/browse" className="mk-btn hero-btn-primary" style={{ padding: "16px 22px", fontSize: 15 }}>
                  {isRTL ? "تصفّح السيارات" : "Browse cars"}
                  <span className="arr"><ArrowSvg /></span>
                </Link>
              </MagneticWrap>
              <MagneticWrap strength={0.15}>
                <Link href="/how-it-works" className="mk-btn hero-btn-outline" style={{ padding: "16px 22px", fontSize: 15 }}>
                  {isRTL ? "كيف تعمل المنصة" : "How it works"}
                </Link>
              </MagneticWrap>
            </div>
          </div>
        </FadeIn>

        {/* Stats — animated counters */}
        <FadeIn delay={0.6} duration={0.8}>
          <div className="flex gap-[54px] max-sm:gap-6 max-sm:flex-wrap mt-16 pt-7" style={{ borderTop: "1px solid rgba(255,255,255,.15)" }}>
            {listingCount != null && (
              <div className="flex flex-col">
                <div className="font-display font-bold text-[34px] tracking-tight text-white">
                  <AnimatedCounter target={listingCount} suffix="+" duration={1.8} />
                </div>
                <div className="text-xs tracking-[.14em] uppercase mt-1 text-white/50">{isRTL ? "سيارة معروضة" : "listed cars"}</div>
              </div>
            )}
            {importerCount != null && (
              <div className="flex flex-col">
                <div className="font-display font-bold text-[34px] tracking-tight text-white">
                  <AnimatedCounter target={importerCount} suffix="+" duration={1.8} />
                </div>
                <div className="text-xs tracking-[.14em] uppercase mt-1 text-white/50">{isRTL ? "مستورد موثق" : "verified importers"}</div>
              </div>
            )}
            <div className="flex flex-col">
              <div className="font-display font-bold text-[34px] tracking-tight text-white">{isRTL ? "عالمي" : "Global"}</div>
              <div className="text-xs tracking-[.14em] uppercase mt-1 text-white/50">{isRTL ? "دول مصدّرة متعددة" : "multiple source countries"}</div>
            </div>
            <div className="flex flex-col">
              <div className="font-display font-bold text-[34px] tracking-tight text-white">{isRTL ? "موثّق" : "Vetted"}</div>
              <div className="text-xs tracking-[.14em] uppercase mt-1 text-white/50">{isRTL ? "مستوردون موثّقون" : "verified importers only"}</div>
            </div>
          </div>
        </FadeIn>
      </div>

    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Marquee
// ---------------------------------------------------------------------------
function Marquee() {
  return (
    <div className="mk-marquee" aria-hidden="true">
      <div className="track">
        {[0, 1].map((i) => (
          <span key={i}>
            {["UAE", "Qatar", "USA", "Japan", "South Korea", "Germany", "Canada", "GCC", "EU", "UK"].map((market) => (
              <span key={`${i}-${market}`}>{market}<span className="dot" /></span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Browse Cars (with real API data + demo fallback)
// ---------------------------------------------------------------------------
const DEMO_CARS = [
  { id: "demo-1", make: "Mercedes-Benz", model: "G 63", year: 2024, mileage: 4200, price: 1084000, final_price_sar: 1084000, source_country: "europe", city: "Stuttgart", import_status: "available", sub: "Petrol · LHD", images: [], primary_image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1400&q=80&auto=format&fit=crop" },
  { id: "demo-2", make: "Porsche", model: "911 GT3", year: 2023, mileage: 8900, price: 892000, final_price_sar: 892000, source_country: "europe", city: "Munich", import_status: "available", sub: "Petrol", images: [], primary_image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80&auto=format&fit=crop" },
  { id: "demo-3", make: "Lexus", model: "LX 600", year: 2024, mileage: 1400, price: 478000, final_price_sar: 478000, source_country: "japan", city: "Tokyo", import_status: "available", sub: "Petrol", images: [], primary_image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=80&auto=format&fit=crop" },
  { id: "demo-4", make: "Cadillac", model: "Escalade V", year: 2024, mileage: 3100, price: 612000, final_price_sar: 612000, source_country: "usa", city: "Detroit", import_status: "available", sub: "Petrol", images: [], primary_image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80&auto=format&fit=crop" },
  { id: "demo-5", make: "Lamborghini", model: "Urus", year: 2023, mileage: 6600, price: 1260000, final_price_sar: 1260000, source_country: "europe", city: "Modena", import_status: "available", sub: "Petrol", images: [], primary_image: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200&q=80&auto=format&fit=crop" },
  { id: "demo-6", make: "Toyota", model: "Land Cruiser", year: 2024, mileage: 2200, price: 338000, final_price_sar: 338000, source_country: "japan", city: "Yokohama", import_status: "available", sub: "Petrol", images: [], primary_image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1200&q=80&auto=format&fit=crop" },
] as unknown as ImportedListing[];

const DEMO_BADGES: Record<string, string> = {
  "demo-1": "From Stuttgart",
  "demo-2": "From Munich",
  "demo-3": "From Tokyo",
  "demo-4": "From Detroit",
  "demo-5": "From Modena",
  "demo-6": "From Yokohama",
};

// Pill definitions: label (en), label (ar), query params
const FILTER_PILLS = [
  { en: "All",           ar: "الكل",           params: "" },
  { en: "Sedan",         ar: "سيدان",          params: "body_type=sedan" },
  { en: "SUV",           ar: "دفع رباعي",      params: "body_type=suv" },
  { en: "Coupe",         ar: "كوبيه",          params: "body_type=coupe" },
  { en: "Pickup",        ar: "بيك أب",         params: "body_type=pickup" },
  { en: "Electric",      ar: "كهربائية",        params: "fuel_type=electric" },
  { en: "Hybrid",        ar: "هايبرد",          params: "fuel_type=hybrid" },
  { en: "Under 200K SAR",ar: "أقل من 200K",    params: "price_max=200000" },
  { en: "2024+",         ar: "2024+",           params: "year_min=2024" },
];

function BrowseCars() {
  const [activePill, setActivePill] = useState(0);
  const filterParams = FILTER_PILLS[activePill]?.params ?? "";
  // No explicit ordering — the API default puts paid promotions (Featured /
  // Top Search) first, then newest, so boosted cars lead the homepage grid.
  const queryUrl = `/api/imported-cars/?page_size=6${filterParams ? `&${filterParams}` : ""}`;

  const { data } = useApiQuery<PaginatedResponse<ImportedListing>>(
    queryUrl,
    { deps: [queryUrl] }
  );
  const apiListings = Array.isArray(data) ? data : (data?.results ?? []);
  // Always render — show demo fallback while loading or on error
  const listings = apiListings.length > 0 ? apiListings : (activePill === 0 ? DEMO_CARS : []);
  const isDemo = activePill === 0 && apiListings.length === 0;
  const { listingCount } = useRealStats();
  const { dir } = useTranslation();
  const isRTL = dir === "rtl";
  const countLabel = listingCount != null ? `${listingCount.toLocaleString()}+` : "";

  return (
    <section className="relative py-[140px]" style={{ background: "var(--mk-paper)" }}>
      <div className="max-w-[1440px] mx-auto px-9 max-md:px-[22px]">
        {/* Section header */}
        <FadeIn className="mk-sec-head">
          <h2 className="font-display font-bold tracking-tighter leading-[.92]" style={{ fontSize: "clamp(48px, 7vw, 112px)" }}>
            {isRTL ? <>ابحث <span className="mk-serif-it">عنها.</span><br /><span style={{ color: "var(--mk-mute-2)" }}>في أي مكان.</span></> : <>Find <span className="mk-serif-it">it.</span><br /><span style={{ color: "var(--mk-mute-2)" }}>Anywhere.</span></>}
          </h2>
          <div className="text-[17px] leading-relaxed" style={{ color: "#3a3a36", maxWidth: "46ch" }}>
            <span className="mk-eyebrow"><span className="dot" />{isRTL ? "تصفح" : "Browse"}</span>
            <p className="mt-[18px]">
              {isRTL
                ? `تصفح ${countLabel ? `أكثر من ${countLabel}` : ""} سيارة من مستوردين موثقين في اليابان، ألمانيا، أمريكا، الإمارات وغيرها.`
                : `Filter through ${countLabel ? `${countLabel} ` : ""}live listings sourced by vetted importers in Japan, Germany, USA, UAE and more. Every car arrives with full inspection, history and customs paperwork.`}
            </p>
          </div>
        </FadeIn>

        {/* Filter pills */}
        <div className="mk-filter-pills">
          {FILTER_PILLS.map((pill, i) => (
            <button
              key={pill.en}
              type="button"
              onClick={() => setActivePill(i)}
              className={`p ${activePill === i ? "active" : ""}`}
            >
              {isRTL ? pill.ar : pill.en}
            </button>
          ))}
        </div>

        {/* Car grid */}
        {listings.length === 0 && activePill !== 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-slate-400 mb-2">{isRTL ? "ما لقينا سيارات بهالفلتر" : "No cars match this filter"}</p>
            <button onClick={() => setActivePill(0)} className="text-accent text-sm font-medium hover:underline">
              {isRTL ? "عرض الكل" : "Show all"}
            </button>
          </div>
        ) : (
        <StaggerContainer stagger={0.1} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing, i) => {
              const primaryImage = listing.images?.find((img: any) => img.is_primary) ?? listing.images?.[0];
              const imageUrl = listing.primary_image || primaryImage?.image_url || (primaryImage?.image ? getImageUrl(primaryImage.image) : null);
              const finalPrice = listing.final_price_sar ?? listing.price;
              const demoBadge = isDemo ? DEMO_BADGES[listing.id as string] : null;
              const statusInfo = !isDemo && listing.import_status ? (IMPORT_STATUS_STYLES[listing.import_status] ?? null) : null;
              const flag = !isDemo && listing.source_country ? (SOURCE_COUNTRY_FLAG[listing.source_country] ?? "🌐") : null;
              const badgeText = demoBadge || (statusInfo ? statusInfo.label : (flag ? `${flag} ${listing.source_country?.toUpperCase()}` : null));
              const cardHref = isDemo ? "/browse" : `/car/${listing.id}`;
              const sub = (listing as unknown as { sub?: string }).sub;

              return (
                <StaggerItem key={listing.id} className="mk-car-card">
                  <Link href={cardHref} className="block">
                    <div className="ph relative">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={`${listing.year} ${listing.make} ${listing.model}`} fill className="object-cover rounded-[14px] transition-transform duration-700 ease-out hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CarIcon className="w-10 h-10 text-slate-300" />
                        </div>
                      )}
                      {badgeText && <span className="badge">{badgeText}</span>}
                    </div>
                    <div className="flex justify-between items-end mt-[14px]">
                      <div>
                        <h3 className="font-display font-semibold tracking-tight text-[20px]">
                          {listing.make} {listing.model}
                        </h3>
                        <div className="text-[13px] mt-1" style={{ color: "var(--mk-mute)" }}>
                          {[listing.year, listing.mileage > 0 ? `${Number(listing.mileage).toLocaleString()} km` : null, sub, listing.city].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      {finalPrice && (
                        <div className="font-display font-bold text-[22px] tracking-tight">
                          <span className="text-[13px] font-medium mr-1" style={{ color: "var(--mk-mute)" }}>SAR</span>
                          {Number(finalPrice).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}

        {/* View all link */}
        <div className="text-center mt-10">
          <Link href="/browse" className="mk-btn primary" style={{ padding: "16px 22px", fontSize: 15 }}>
            {isRTL ? "عرض الكل" : "View all cars"}
            <span className="arr"><ArrowSvg /></span>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. Price Calculator
// ---------------------------------------------------------------------------
function PriceCalculator() {
  const { dir } = useTranslation();
  const isRTL = dir === "rtl";

  return (
    <section className="py-[140px]" style={{ background: "var(--mk-ink)", color: "var(--mk-paper)" }}>
      <div className="max-w-[1440px] mx-auto px-9 max-md:px-[22px]">
        <FadeIn className="mk-sec-head">
          <h2 className="font-display font-bold tracking-tighter leading-[.92]" style={{ fontSize: "clamp(48px, 7vw, 112px)" }}>
            {isRTL ? <>كل رسم، <span className="mk-serif-it">قبل الشحن.</span></> : <>Every fee, <span className="mk-serif-it">before it ships.</span></>}
          </h2>
          <div className="text-[17px] leading-relaxed" style={{ color: "#bdbdb6", maxWidth: "46ch" }}>
            <span className="mk-eyebrow" style={{ color: "#9b9b96" }}><span className="dot" style={{ background: "#fff" }} />{isRTL ? "حاسبة مباشرة" : "Live calculator"}</span>
            <p className="mt-[18px]">
              {isRTL
                ? "بدون رسوم خفية. نوضح سعر المصدر، الشحن، الجمارك، الضريبة، الفحص، وهامش المستورد — كل شيء مفصّل بالريال."
                : "No hidden costs. We surface the source price, freight, customs, VAT, inspection, and the importer\u2019s margin \u2014 everything you\u2019d pay, itemized down to the riyal."}
            </p>
          </div>
        </FadeIn>

        <div className="grid max-md:grid-cols-1 gap-[72px] items-start" style={{ gridTemplateColumns: "1fr 1.05fr" }}>
          {/* Left: breakdown */}
          <FadeIn delay={0.1}>
            {/* Vehicle + origin header */}
            {[
              { l: isRTL ? "السيارة" : "Vehicle", v: "Porsche 911 GT3" },
              { l: isRTL ? "المصدر" : "Origin", v: "Munich → Jeddah" },
            ].map(({ l, v }, i) => (
              <div key={i} className="flex justify-between py-[22px] items-center" style={{ borderBottom: "1px solid rgba(255,255,255,.12)", ...(i === 0 ? { borderTop: "1px solid rgba(255,255,255,.12)" } : {}) }}>
                <span className="text-sm" style={{ color: "#a8a8a3" }}>{l}</span>
                <span className="font-display font-semibold text-[22px] tracking-tight">{v}</span>
              </div>
            ))}

            {/* Cost lines */}
            {[
              { l: isRTL ? "سعر FOB (المصدر)" : "FOB price (source)", v: "SAR 720,000" },
              { l: isRTL ? "شحن وتأمين" : "Freight & insurance", v: "SAR 28,400" },
              { l: isRTL ? "مناولة الميناء" : "Port handling", v: "SAR 800" },
              { l: isRTL ? "نقل (جدة → الرياض)" : "Transportation (Jeddah → Riyadh)", v: "SAR 1,500" },
            ].map(({ l, v }, i) => (
              <div key={i} className="flex justify-between py-[18px] items-center" style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                <span className="text-sm" style={{ color: "#a8a8a3" }}>{l}</span>
                <span className="font-display font-medium text-[18px] tracking-tight tabular-nums">{v}</span>
              </div>
            ))}

            {/* Government fees header */}
            <div className="pt-6 pb-2">
              <span className="text-[10.5px] uppercase tracking-[.18em]" style={{ color: "rgba(250,250,247,.45)" }}>{isRTL ? "رسوم حكومية" : "Government fees"}</span>
            </div>
            {[
              { l: isRTL ? "جمارك (5%)" : "Customs duty (5%)", v: "SAR 36,000" },
              { l: isRTL ? "ضريبة (15%)" : "VAT (15%)", v: "SAR 117,660" },
              { l: isRTL ? "فحص SASO" : "SASO inspection", v: "SAR 1,200" },
            ].map(({ l, v }, i) => (
              <div key={i} className="flex justify-between py-[18px] items-center" style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                <span className="text-sm" style={{ color: "#a8a8a3" }}>{l}</span>
                <span className="font-display font-medium text-[18px] tracking-tight tabular-nums">{v}</span>
              </div>
            ))}

            {/* Total landed cost */}
            <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,.25)" }}>
              <div className="flex justify-between items-center">
                <span className="text-[13px] tracking-[.14em] uppercase" style={{ color: "#a8a8a3" }}>{isRTL ? "إجمالي التكلفة" : "Total landed cost"}</span>
                <span className="font-display font-semibold text-[24px] tracking-tight tabular-nums">SAR 905,560</span>
              </div>
            </div>

            {/* Importer margin */}
            <div className="flex justify-between py-[18px] items-center" style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}>
              <span className="text-sm" style={{ color: "#a8a8a3" }}>{isRTL ? "هامش المستورد" : "Importer margin"}</span>
              <span className="font-display font-medium text-[18px] tracking-tight tabular-nums">SAR 90,000</span>
            </div>

            {/* Final price */}
            <div className="mt-6 pt-7 pb-2" style={{ borderTop: "2px solid rgba(255,255,255,.4)" }}>
              <span className="text-[13px] tracking-[.14em] uppercase" style={{ color: "#a8a8a3" }}>{isRTL ? "السعر النهائي (ما تدفعه)" : "Final price (what you pay)"}</span>
              <div className="font-display font-bold tracking-tighter leading-[.95] mt-1" style={{ fontSize: "clamp(56px, 7vw, 108px)", color: "#0FA68A" }}>
                <span style={{ color: "#7d7d78", fontSize: ".32em", verticalAlign: "top", marginRight: ".08em", display: "inline-block", transform: "translateY(.6em)" }}>SAR</span>
                995,560
              </div>
            </div>

            {/* Footnote */}
            <p className="mt-6 text-[12.5px] leading-relaxed" style={{ color: "rgba(250,250,247,.45)", maxWidth: "48ch" }}>
              {isRTL
                ? "وارد تفرض رسوم حجز SAR 99 غير قابلة للاسترداد عند حجز السيارة. هذا هو الرسم الوحيد الذي نحصّله من المشترين."
                : "Wared charges a non-refundable SAR 99 reservation fee when you reserve a car. That\u2019s the only fee we charge buyers."}
            </p>
          </FadeIn>

          {/* Right: form card */}
          <div className="mk-reveal delay-2 relative overflow-hidden" style={{ background: "#0F0F0F", border: "1px solid rgba(255,255,255,.06)", borderRadius: 28, padding: 32 }}>
            <div className="absolute" style={{ top: -100, right: -100, width: 300, height: 300, background: "radial-gradient(circle, rgba(255,255,255,.06), transparent 60%)" }} />
            <h4 className="font-display font-semibold text-2xl tracking-tight mb-6 flex items-center gap-[10px]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.4" /><path d="M8 9h8M8 13h5M8 17h3" stroke="currentColor" strokeWidth="1.4" /></svg>
              {isRTL ? "ابنِ عرض سعرك" : "Build your quote"}
            </h4>
            <div className="text-center mt-8">
              <Link href="/calculator" className="mk-btn primary" style={{ padding: "16px 28px", fontSize: 15 }}>
                {isRTL ? "افتح الحاسبة" : "Open full calculator"}
                <span className="arr"><ArrowSvg /></span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 5. Ship It — Timeline
// ---------------------------------------------------------------------------
function ShipIt() {
  const { dir } = useTranslation();
  const isRTL = dir === "rtl";

  const steps = isRTL
    ? [
        { n: "01", title: "التوريد", desc: "تاجر أو مزاد موثق. فحص قبل الشراء بواسطة وكيلنا.", when: "يوم 0–3", active: true },
        { n: "02", title: "التصدير", desc: "الملكية، لوحة التصدير، حجز الشحن.", when: "يوم 4–9", active: true },
        { n: "03", title: "في البحر", desc: "تتبع السفينة. تحديثات كل 12 ساعة.", when: "يوم 10–26", active: false },
        { n: "04", title: "الجمارك", desc: "فحص هيئة المواصفات (ساسو). تخليص الجمارك والضريبة.", when: "يوم 27–30", active: false },
        { n: "05", title: "التوصيل", desc: "نقل لعنوانك — الرياض، جدة، الدمام و10 مدن أخرى.", when: "يوم 31–34", active: false },
      ]
    : [
        { n: "01", title: "Source", desc: "Verified dealer or auction. Pre-purchase inspection by our local agent.", when: "Day 0–3", active: true },
        { n: "02", title: "Export", desc: "Title, export plate, freight booked. RoRo or container — your choice.", when: "Day 4–9", active: true },
        { n: "03", title: "At sea", desc: "Track the vessel. ETA updates every 12h, tied to AIS feeds.", when: "Day 10–26", active: false },
        { n: "04", title: "Customs", desc: "Saudi Standards (SASO) check. Duty + VAT cleared with one signature.", when: "Day 27–30", active: false },
        { n: "05", title: "Delivered", desc: "Trucked to your address — Riyadh, Jeddah, Dammam and 10 more cities.", when: "Day 31–34", active: false },
      ];

  return (
    <section className="relative py-[140px] overflow-hidden" style={{ background: "var(--mk-paper-2)" }}>
      <div className="max-w-[1440px] mx-auto px-9 max-md:px-[22px]">
        <div className="mk-sec-head mk-reveal">
          <h2 className="font-display font-bold tracking-tighter leading-[.92]" style={{ fontSize: "clamp(48px, 7vw, 112px)" }}>
            {isRTL ? <>اشحنها <span className="mk-serif-it">لبابك.</span><br /><span style={{ color: "var(--mk-mute-2)" }}>من الميناء للباب.</span></> : <>Ship <span className="mk-serif-it">it.</span><br /><span style={{ color: "var(--mk-mute-2)" }}>Port to door.</span></>}
          </h2>
          <div className="text-[17px] leading-relaxed" style={{ color: "#3a3a36", maxWidth: "46ch" }}>
            <span className="mk-eyebrow"><span className="dot" />{isRTL ? "الرحلة" : "The journey"}</span>
            <p className="mt-[18px]">
              {isRTL
                ? "بمجرد الحجز، ننسق الفحص والتصدير والشحن البحري والتخليص الجمركي والتوصيل. ستتابع كل خطوة لحظة بلحظة."
                : "Once you reserve, we coordinate inspection, export, ocean freight, Saudi customs clearance and last-mile delivery. You\u2019ll see every milestone in real time."}
            </p>
          </div>
        </div>

        <div className="mk-journey mk-reveal delay-1">
          <div className="mk-journey-track">
            {steps.map(({ n, title, desc, when, active }) => (
              <div key={n} className={`mk-j-step ${active ? "active" : ""}`}>
                <div className="num">{n}</div>
                <h4 className="font-display font-semibold text-xl tracking-tight mb-1.5">{title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: "#3a3a36" }}>{desc}</p>
                <span className="block text-[11px] tracking-[.14em] uppercase mt-[10px]" style={{ color: "var(--mk-mute)" }}>{when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6. Track It — Phone mockup
// ---------------------------------------------------------------------------
function TrackIt() {
  const { dir } = useTranslation();
  const isRTL = dir === "rtl";

  return (
    <section className="py-[140px]" style={{ background: "var(--mk-ink)", color: "var(--mk-paper)" }}>
      <div className="max-w-[1440px] mx-auto px-9 max-md:px-[22px]">
        <div className="grid max-md:grid-cols-1 gap-20 items-center" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Phone */}
          <div className="mk-reveal">
            <div className="mk-phone">
              <div className="screen">
                <div className="flex justify-between px-6 pt-3 text-xs text-white font-semibold">
                  <span>9:41</span><span>●●● 5G</span>
                </div>
                <div className="px-[22px] pt-12 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  <div className="text-[13px] tracking-[.14em] uppercase" style={{ color: "#9b9b96" }}>Shipment · MK-204</div>
                  <div className="font-display font-semibold text-[22px] tracking-tight mt-0.5">Porsche 911 GT3</div>
                </div>
                <div className="flex-1 flex flex-col gap-[14px] px-[22px] py-[18px]">
                  {/* Map placeholder */}
                  <div className="h-[140px] rounded-[14px] relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a1a, #0e0e0e)", border: "1px solid rgba(255,255,255,.06)" }}>
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 140" preserveAspectRatio="none">
                      <path d="M20 110 Q120 0 200 80 T300 40" stroke="#fff" strokeWidth="1.4" fill="none" strokeDasharray="3 4" />
                      <circle cx="20" cy="110" r="4" fill="#fff" />
                      <circle cx="200" cy="80" r="6" fill="#fff" stroke="#0a0a0a" strokeWidth="2" />
                      <circle cx="300" cy="40" r="4" fill="none" stroke="#fff" strokeWidth="1.4" />
                    </svg>
                  </div>
                  {/* Progress */}
                  <div>
                    <div className="h-[3px] rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,.12)" }}>
                      <div className="h-full rounded-sm bg-white" style={{ width: "64%", animation: "mk-progress-fill 4s ease-in-out infinite alternate" }} />
                    </div>
                    <div className="font-display font-bold text-[38px] tracking-tight mt-2">64%</div>
                    <div className="text-xs mt-[-4px]" style={{ color: "#9b9b96" }}>Eta Jeddah · Mar 14</div>
                  </div>
                  {/* Events */}
                  <div className="flex flex-col gap-[10px]">
                    {[
                      { label: "In transit · Suez Canal", time: "Today, 14:22 GST", muted: false },
                      { label: "Departed Hamburg", time: "Mar 02 · 09:05", muted: false },
                      { label: "Inspection passed", time: "Feb 27", muted: true },
                    ].map(({ label, time, muted }) => (
                      <div key={label} className="flex gap-3 items-start py-2" style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
                        <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: muted ? "#444" : "#fff" }} />
                        <div className="text-[13px] font-medium">
                          {label}
                          <small className="block text-[11px] mt-0.5 font-normal" style={{ color: "#9b9b96" }}>{time}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right text */}
          <div className="mk-reveal delay-1">
            <span className="mk-eyebrow" style={{ color: "#9b9b96" }}><span className="dot" style={{ background: "#fff" }} />{isRTL ? "تطبيق واحد" : "One app"}</span>
            <h2 className="font-display font-bold tracking-tighter leading-[.92] mt-3" style={{ fontSize: "clamp(48px, 7vw, 112px)" }}>
              {isRTL ? <>تتبعها <span className="mk-serif-it">مباشرة.</span><br /><span style={{ color: "#5a5a55" }}>كل كيلومتر.</span></> : <>Track <span className="mk-serif-it">it.</span><br /><span style={{ color: "#5a5a55" }}>Live, every mile.</span></>}
            </h2>
            <p className="text-[17px] leading-relaxed mt-[18px]" style={{ color: "#bdbdb6", maxWidth: "42ch" }}>
              {isRTL
                ? "موقع السفينة، حالة الجمارك، مراحل الدفع — كلها في جوالك. إشعارات عندما تحتاج توقيعك."
                : "Vessel position, customs status, payment milestones — all in your pocket. Push notifications when something needs your signature."}
            </p>

            <div className="flex flex-col gap-[18px] mt-8">
              {(isRTL
                ? [
                    { n: "01", title: "تتبع AIS مباشر", desc: "من جهاز السفينة مباشرة، يتحدث كل 12 ساعة." },
                    { n: "02", title: "مستنداتك في مكان واحد", desc: "بوليصة الشحن، شهادة ساسو، الفاتورة — كلها رقمية." },
                    { n: "03", title: "دفع متعدد العملات", desc: "ادفع بالريال أو الدولار أو اليورو أو الين بسعر ساما المباشر." },
                  ]
                : [
                    { n: "01", title: "Live AIS tracking", desc: "Pulled directly from the vessel transponder, refreshed every 12 hours." },
                    { n: "02", title: "Documents in one place", desc: "Bill of lading, SASO certificate, invoice — signed digitally, stored forever." },
                    { n: "03", title: "Multi-currency payments", desc: "Pay in SAR, USD, EUR or JPY at the live SAMA rate. Split into milestones." },
                  ]
              ).map(({ n, title, desc }) => (
                <div key={n} className="flex gap-4 py-[18px]" style={{ borderTop: "1px solid rgba(255,255,255,.12)" }}>
                  <div className="font-display font-bold text-sm w-7 tracking-wide" style={{ color: "#9b9b96" }}>{n}</div>
                  <div>
                    <h4 className="font-display font-semibold text-lg tracking-tight mb-1">{title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: "#bdbdb6" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 7. Big Stats
// ---------------------------------------------------------------------------
function BigStats() {
  const { dir } = useTranslation();
  const isRTL = dir === "rtl";
  const { listingCount, importerCount } = useRealStats();

  const stats = isRTL
    ? [
        ...(listingCount != null ? [{ n: `${listingCount.toLocaleString()}+`, l: "سيارة معروضة" }] : []),
        ...(importerCount != null ? [{ n: `${importerCount.toLocaleString()}+`, l: "مستورد موثق" }] : []),
        { n: "دول متعددة", l: "دول مصدّرة" },
        { n: "99", l: "ريال رسوم حجز فقط" },
      ]
    : [
        ...(listingCount != null ? [{ n: `${listingCount.toLocaleString()}+`, l: "listed cars" }] : []),
        ...(importerCount != null ? [{ n: `${importerCount.toLocaleString()}+`, l: "verified importers" }] : []),
        { n: "Global", l: "source countries" },
        { n: "99", l: "SAR reservation fee" },
      ];

  return (
    <section className="mk-bigstats py-[120px]" style={{ background: "var(--mk-ink)", color: "var(--mk-paper)" }}>
      <div className="max-w-[1440px] mx-auto px-9 max-md:px-[22px]">
        <div className="row mk-reveal">
          {stats.map(({ n, l }) => (
            <div key={l} className="cell">
              <div className="font-display font-bold tracking-tighter leading-[.95]" style={{ fontSize: "clamp(56px, 7vw, 104px)" }}>
                {n.includes("+") ? <>{n.replace("+", "")}<span style={{ color: "#7d7d78" }}>+</span></> : n}
              </div>
              <div className="text-[13px] tracking-[.14em] uppercase mt-[10px]" style={{ color: "#bdbdb6" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 8. Why Wared — Interactive Showcase
// ---------------------------------------------------------------------------

const REASONS = [
  {
    id: "savings",
    label: "Lower prices",
    image: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=1920&q=80&auto=format&fit=crop",
  },
  {
    id: "transparency",
    label: "See every fee",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80&auto=format&fit=crop",
  },
  {
    id: "trust",
    label: "Verified importers only",
    image: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1920&q=80&auto=format&fit=crop",
  },
];

function SavingsCard({ active: _active }: { active: boolean }) {
  return (
    <div className="bg-white/[0.12] backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-[420px] text-white text-center">
      <div className="text-[11px] uppercase tracking-[0.15em] text-white/60 mb-5">Why importing saves you money</div>
      <div className="mb-1">
        <span className="text-[36px] font-medium tracking-tight">
          Save by importing directly
        </span>
      </div>
      <div className="text-[12.5px] text-white/65 mb-6">Skip the middleman — import your car at source price</div>
      <div className="border-t border-white/15 pt-5 space-y-3 text-left">
        {["Direct from international auctions", "No showroom overhead in the price", "Transparent margin — you see what we make"].map((text) => (
          <div key={text} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px]">✓</span>
            </div>
            <span className="text-[13.5px] text-white/80">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownCard() {
  const lines = [
    { label: "Source price", value: "95,000" },
    { label: "Shipping", value: "6,200" },
    { label: "Customs duty (5%)", value: "4,750" },
    { label: "VAT (15%)", value: "15,400" },
    { label: "Inspection · SASO", value: "1,200" },
    { label: "Importer margin", value: "19,450" },
  ];

  return (
    <div className="bg-white/[0.12] backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-[420px] text-white">
      <div className="text-[11px] uppercase tracking-[0.15em] text-white/60 mb-5 text-center">Full cost breakdown</div>
      <div className="space-y-2.5 text-[14px]">
        {lines.map((line) => (
          <div key={line.label} className="flex justify-between">
            <span className="text-white/70">{line.label}</span>
            <span className="tabular-nums font-medium text-white">SAR {line.value}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-white/20 mt-5 pt-4 flex justify-between items-baseline">
        <span className="text-[13px] uppercase tracking-wider text-white/60">Final price</span>
        <span className="text-[26px] font-medium tabular-nums">SAR 142,000</span>
      </div>
      <div className="text-center mt-4 text-[11.5px] text-white/55">Every fee shown before you pay. No surprises.</div>
    </div>
  );
}

function VerifiedCard() {
  return (
    <div className="bg-white/[0.12] backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-[420px] text-white">
      <div className="text-[11px] uppercase tracking-[0.15em] text-white/60 mb-5 text-center">Every importer is vetted</div>
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-[18px] font-medium">GI</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-[15px]">Gulf Imports Trading</span>
            <span className="text-teal-300 text-[14px]">✓</span>
          </div>
          <div className="text-[12px] text-white/60">13 years · Dammam, Eastern Province</div>
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-white/40 text-center mb-2">Example importer profile</div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { value: "50+", label: "Imported" },
          { value: "95%+", label: "On-time" },
          { value: "4.8★", label: "Reviews" },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className="text-[20px] font-medium tabular-nums">{value}</div>
            <div className="text-[10.5px] text-white/55 uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {["CR licensed", "SASO certified", "MOC licensed"].map((b) => (
          <span key={b} className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px]">{b}</span>
        ))}
      </div>
    </div>
  );
}

function WhyWaredSection() {
  const [active, setActive] = useState(REASONS[0]);
  const { dir } = useTranslation();
  const isRTL = dir === "rtl";

  useEffect(() => {
    REASONS.forEach((r) => {
      const img = new window.Image();
      img.src = r.image;
    });
  }, []);

  return (
    <section className="section dark relative w-full overflow-hidden min-h-[820px]">
      {REASONS.map((r) => (
        <div
          key={r.id}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${active.id === r.id ? "opacity-100" : "opacity-0"}`}
          style={{ backgroundImage: `url(${r.image})` }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/65" />

      <div className="relative w-full max-w-6xl mx-auto grid grid-rows-[auto_1fr_auto] gap-10 py-16 px-8 text-white min-h-[820px] z-10">
        {/* ROW 1 — Headline */}
        <FadeIn className="text-center max-w-3xl mx-auto">
          <h2 className="font-geist font-light tracking-tight leading-[1.05] text-[48px] md:text-[56px]">
            {isRTL ? (
              <>لماذا آلاف السعوديين<br /><span className="mk-serif-it font-normal">يستوردون بأنفسهم.</span></>
            ) : (
              <>Why thousands of Saudis<br /><span className="mk-serif-it font-normal">are importing instead.</span></>
            )}
          </h2>
          <p className="mt-4 text-[15px] text-white/80 max-w-md mx-auto">
            {isRTL ? "ثلاثة أسباب لاختيار وارد." : "Three reasons buyers choose Wared."}
          </p>
        </FadeIn>

        {/* ROW 2 — Card (centered in middle area) */}
        <div className="flex items-center justify-center">
          <div className="relative w-[420px] max-w-full min-h-[380px] flex items-center justify-center">
            {REASONS.map((r) => (
              <div
                key={r.id}
                className={`absolute transition-all duration-500 ease-out ${
                  active.id === r.id ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                {r.id === "savings" && <SavingsCard active={active.id === r.id} />}
                {r.id === "transparency" && <BreakdownCard />}
                {r.id === "trust" && <VerifiedCard />}
              </div>
            ))}
          </div>
        </div>

        {/* ROW 3 — Chips */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {REASONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setActive(r)}
              className={`px-6 py-3 rounded-full text-[14px] font-medium border transition-all duration-300 ${
                active.id === r.id
                  ? "bg-white text-navy-900 border-white"
                  : "bg-white/10 backdrop-blur-sm text-white border-white/25 hover:bg-white/20"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 9. Download App CTA
// ---------------------------------------------------------------------------

function DownloadAppCTA() {
  const { dir } = useTranslation();
  const isRTL = dir === "rtl";

  return (
    <section className="py-24 px-8" style={{ background: "var(--mk-paper-2)", borderTop: "1px solid rgba(10,10,10,.06)" }}>
      <div className="max-w-5xl mx-auto text-center">
        <FadeIn>
          <h2 className="font-geist font-light tracking-tight leading-[1.1]" style={{ fontSize: "clamp(36px, 4.5vw, 48px)", color: "var(--mk-ink)" }}>
            {isRTL ? (
              <>تابع استيرادك<br /><span className="mk-serif-it font-normal">من راحة يدك.</span></>
            ) : (
              <>Track your import<br /><span className="mk-serif-it font-normal">from the palm of your hand.</span></>
            )}
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed max-w-xl mx-auto" style={{ color: "var(--mk-mute)" }}>
            {isRTL
              ? "احجز سيارات، تواصل مع المستوردين، وتابع كل خطوة من شحنتك مباشرة عبر تطبيق وارد."
              : "Reserve cars, message importers, and follow every step of your shipment in real-time on the Wared mobile app."}
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <a href="#" className="inline-flex items-center gap-3 px-6 py-3.5 bg-[#0B1424] text-white rounded-xl hover:bg-black transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
              <div className="text-left">
                <div className="text-[10px] text-white/60 leading-none">{isRTL ? "حمّل من" : "Download on the"}</div>
                <div className="text-[15px] font-medium leading-tight">App Store</div>
              </div>
            </a>
            <a href="#" className="inline-flex items-center gap-3 px-6 py-3.5 bg-[#0B1424] text-white rounded-xl hover:bg-black transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.48c.32.38.82.52 1.32.32l9.5-4.3-2.96-2.96-7.86 6.94zM.67 2.22C.26 2.63 0 3.26 0 4.01v15.98c0 .75.26 1.38.67 1.79L12 10.5.67 2.22zM21.81 9.64l-3.27-1.86-3.35 3.02 3.72 3.72 2.9-1.65c.94-.53.94-1.9 0-2.43v-.8zM14.5 10.5l3.2-2.88L5.18.43C4.78.21 4.34.19 3.97.36l10.53 10.14z" /></svg>
              <div className="text-left">
                <div className="text-[10px] text-white/60 leading-none">{isRTL ? "احصل عليه من" : "Get it on"}</div>
                <div className="text-[15px] font-medium leading-tight">Google Play</div>
              </div>
            </a>
          </div>

          <p className="mt-4 text-[12px]" style={{ color: "var(--mk-mute)" }}>
            {isRTL ? "التطبيق قيد الإطلاق قريباً" : "App launching soon — join the waitlist"}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Root page
// ---------------------------------------------------------------------------
export default function Home() {
  const pageRef = useReveal();

  return (
    <div ref={pageRef} className="mk-page" style={{ background: "var(--mk-paper)" }}>
      <Hero />
      <Marquee />
      <BrowseCars />
      <PriceCalculator />
      <ShipIt />
      <TrackIt />
      <BigStats />
      <WhyWaredSection />
      <DownloadAppCTA />
    </div>
  );
}
