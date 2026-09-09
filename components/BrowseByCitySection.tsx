"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2 } from "lucide-react";

interface CityApiItem {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  latitude: string | null;
  longitude: string | null;
  region_name_en?: string;
}

interface ResolvedCity {
  id: number;
  displayEn: string;
  displayAr: string;
  apiAr: string;
  emoji: string;
}

// Ordered list of featured cities.
// backendName = exact name_en returned by the backend (case-insensitive match).
// preferSlug  = slug hint to disambiguate duplicates (e.g. two "Riyadh" entries).
const FEATURED: Array<{
  displayEn: string;
  displayAr: string;
  backendName: string;
  preferSlug?: string;
  emoji: string;
}> = [
  { displayEn: "Riyadh",  displayAr: "الرياض",          backendName: "Riyadh",    preferSlug: "riyadh",      emoji: "🏙️" },
  { displayEn: "Jeddah",  displayAr: "جدة",             backendName: "Jeddah",    preferSlug: "jeddah",      emoji: "🌊" },
  { displayEn: "Mecca",   displayAr: "مكة المكرمة",     backendName: "Makkah",    preferSlug: "makkah-city", emoji: "🕋" },
  { displayEn: "Madinah", displayAr: "المدينة المنورة", backendName: "Madinah",   preferSlug: "madinah-city",emoji: "🕌" },
  { displayEn: "Dammam",  displayAr: "الدمام",          backendName: "Dammam",    preferSlug: "dammam",      emoji: "⚓" },
  { displayEn: "Khobar",  displayAr: "الخبر",           backendName: "Al Khobar", preferSlug: "al-khobar",   emoji: "🏢" },
  { displayEn: "Tabuk",   displayAr: "تبوك",            backendName: "Tabuk",     preferSlug: "tabuk-city",  emoji: "🏔️" },
  { displayEn: "Abha",    displayAr: "أبها",            backendName: "Abha",      preferSlug: "abha",        emoji: "🌲" },
  { displayEn: "Taif",    displayAr: "الطائف",          backendName: "Taif",      preferSlug: "taif",        emoji: "🌸" },
  { displayEn: "Buraidah",displayAr: "بريدة",           backendName: "Buraydah",  preferSlug: "buraydah",    emoji: "🌴" },
  { displayEn: "Hail",    displayAr: "حائل",            backendName: "Ha'il",     preferSlug: "hail-city",   emoji: "🏜️" },
  { displayEn: "Jizan",   displayAr: "جازان",           backendName: "Jazan",     preferSlug: "jazan-city",  emoji: "🌿" },
];

/** Fetch every page of /api/cities/ and return all results combined. */
async function fetchAllCities(): Promise<CityApiItem[]> {
  const all: CityApiItem[] = [];
  let url: string | null = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/cities/`;

  while (url) {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) break;
    const data: { results: CityApiItem[]; next: string | null } = await res.json();
    all.push(...data.results);
    url = data.next;
  }

  return all;
}

export default function BrowseByCitySection() {
  const router = useRouter();
  const [cities, setCities] = useState<ResolvedCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchAllCities().then((all) => {
      if (cancelled) return;

      const resolved = FEATURED.reduce<ResolvedCity[]>((acc, spec) => {
        const nameLC = spec.backendName.toLowerCase();

        // All cities that match by name (case-insensitive)
        const candidates = all.filter(
          (c) => c.name_en.toLowerCase() === nameLC
        );

        if (candidates.length === 0) return acc;

        // If multiple match (e.g. two "Riyadh"), prefer the one whose slug
        // matches preferSlug, then the one with a non-empty slug + lat/lng.
        let best = candidates[0];
        if (candidates.length > 1) {
          const preferred = spec.preferSlug
            ? candidates.find((c) => c.slug === spec.preferSlug)
            : undefined;
          best =
            preferred ??
            candidates.find((c) => c.slug && c.latitude) ??
            candidates[0];
        }

        acc.push({
          id: best.id,
          displayEn: spec.displayEn,
          displayAr: spec.displayAr,
          apiAr: best.name_ar,
          emoji: spec.emoji,
        });

        return acc;
      }, []);

      setCities(resolved);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </section>
    );
  }

  if (!cities.length) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-accent font-semibold text-sm mb-1 uppercase tracking-wide">
            Find Cars Near You
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Browse by City
          </h2>
          <p className="text-slate-500 mt-2">
            Discover cars listed across Saudi Arabia
          </p>
        </div>

        {/* City grid — 2 cols mobile · 3 cols tablet · 6 cols desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {cities.map((city) => (
            <button
              key={city.id}
              onClick={() => router.push(`/browse?city_obj=${city.id}`)}
              className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-accent hover:border-accent hover:shadow-md transition-all duration-200 text-center"
            >
              <span className="text-3xl" role="img" aria-label={city.displayEn}>
                {city.emoji}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-white transition-colors leading-tight">
                  {city.displayEn}
                </p>
                <p className="text-xs text-slate-400 group-hover:text-white/70 transition-colors mt-0.5">
                  {city.apiAr || city.displayAr}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/browse")}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-accent transition-colors"
          >
            <MapPin className="w-4 h-4" />
            View listings from all cities
          </button>
        </div>
      </div>
    </section>
  );
}
