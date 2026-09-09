"use client";

import { useTranslation } from "@/lib/i18n";
import type { CountryAggregate } from "@/types/source-country";

interface CountryCardProps {
  country: CountryAggregate;
  isSelected: boolean;
  onClick: () => void;
}

function formatPrice(n: string | null) {
  if (!n) return null;
  return new Intl.NumberFormat("en-SA", {
    maximumFractionDigits: 0,
  }).format(Number(n));
}

export default function CountryCard({
  country,
  isSelected,
  onClick,
}: CountryCardProps) {
  const { t, locale } = useTranslation();
  const disabled = country.total_cars === 0;
  const name = locale === "ar" ? country.name_ar : country.name_en;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        w-full text-left rounded-2xl border p-5
        transition-all duration-200
        ${isSelected
          ? "ring-2 ring-blue-500 border-blue-200 bg-blue-50/50"
          : "border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md"
        }
        ${disabled ? "opacity-40 cursor-not-allowed hover:translate-y-0 hover:shadow-none" : "cursor-pointer"}
      `}
    >
      {/* Flag + name */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl leading-none">{country.flag_emoji}</span>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-base truncate">{name}</h3>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {t("map.carsCount").replace("{count}", String(country.total_cars))}
          </span>
        </div>
      </div>

      {/* Status chips */}
      {country.total_cars > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {country.available_cars > 0 && (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {country.available_cars} {t("map.available")}
            </span>
          )}
          {country.arriving_soon_cars > 0 && (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {country.arriving_soon_cars} {t("map.arrivingSoon")}
            </span>
          )}
          {country.reserved_cars > 0 && (
            <span className="text-[11px] font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
              {country.reserved_cars} {t("map.reserved")}
            </span>
          )}
        </div>
      )}

      {/* Price + shipping */}
      {country.total_cars > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
          {country.min_price_sar && (
            <span>
              {t("map.fromPrice").replace("{price}", formatPrice(country.min_price_sar) ?? "—")}
            </span>
          )}
          <span>
            {t("map.shippingDays").replace("{days}", String(country.avg_shipping_days))}
          </span>
        </div>
      )}

      {/* Popular makes */}
      {country.popular_makes.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {country.popular_makes.slice(0, 3).map((make) => (
            <span
              key={make}
              className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full"
            >
              {make}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
