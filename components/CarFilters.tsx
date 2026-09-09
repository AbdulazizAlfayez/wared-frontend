"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal, CheckSquare, Square } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const carMakes = [
  "Toyota", "Honda", "Nissan", "Hyundai", "Kia", "Ford", "Chevrolet",
  "BMW", "Mercedes-Benz", "Audi", "Lexus", "GMC", "Jeep", "Land Rover", "Porsche",
  "Mitsubishi", "Mazda", "Subaru", "Infiniti", "Cadillac", "Lincoln", "Dodge",
  "RAM", "Volkswagen", "Volvo", "Genesis", "Haval",
];

const fuelTypes     = ["Petrol", "Diesel", "Hybrid", "Electric"];
const transmissions = ["Automatic", "Manual"];
const conditions    = ["new", "used", "certified"];
const bodyTypes     = [
  "Sedan", "SUV", "Pickup", "Coupe", "Hatchback", "Van", "Truck", "Convertible", "Wagon",
];

const SORT_KEYS: { value: string; key: string }[] = [
  { value: "-created_at",            key: "filters.newestFirst"  },
  { value: "created_at",             key: "filters.oldestFirst"  },
  { value: "final_price_sar",        key: "filters.priceLowHigh" },
  { value: "-final_price_sar",       key: "filters.priceHighLow" },
  { value: "mileage",                key: "filters.mileageLowHigh" },
  { value: "-year",                  key: "filters.yearNewest"   },
  { value: "estimated_arrival_date", key: "filters.arrivingSoon" },
];

// Import-specific option keys (labels resolved via t())
const SOURCE_COUNTRY_KEYS = ["usa", "uae", "japan", "korea", "europe", "canada", "qatar", "other"];
const SOURCE_FLAGS: Record<string, string> = { usa: "🇺🇸", uae: "🇦🇪", japan: "🇯🇵", korea: "🇰🇷", europe: "🇪🇺", canada: "🇨🇦", qatar: "🇶🇦", other: "🌐" };
const SPEC_ORIGIN_KEYS = ["gcc", "american", "european", "japanese", "korean", "other"];
const IMPORT_STATUS_KEYS = ["available", "in_transit", "arriving", "at_port", "customs_clearance", "reserved"];

interface CarFiltersProps {
  onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
  // Standard listing filters
  make: string;
  model: string;
  city: string;
  fuelType: string;
  transmission: string;
  condition: string;
  bodyType: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  minMileage: string;
  maxMileage: string;
  sort: string;
  negotiable: string;
  warrantyRemaining: string;
  noAccidents: string;
  // Import-specific filters
  sourceCountry: string;
  specOrigin: string;
  importStatus: string;
  hasSalvageTitle: string;
  gccSpecs: string;
}

const EMPTY_FILTERS: FilterState = {
  make: "", model: "", city: "", fuelType: "", transmission: "", condition: "",
  bodyType: "", minPrice: "", maxPrice: "", minYear: "", maxYear: "",
  minMileage: "", maxMileage: "", sort: "", negotiable: "", warrantyRemaining: "",
  noAccidents: "",
  sourceCountry: "", specOrigin: "", importStatus: "", hasSalvageTitle: "", gccSpecs: "",
};

export default function CarFilters({ onFilterChange }: CarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    make:             searchParams.get("make")             || "",
    model:            searchParams.get("model")            || "",
    city:             searchParams.get("city")             || "",
    fuelType:         searchParams.get("fuelType")         || "",
    transmission:     searchParams.get("transmission")     || "",
    condition:        searchParams.get("condition")        || "",
    bodyType:         searchParams.get("bodyType")         || "",
    minPrice:         searchParams.get("minPrice")         || "",
    maxPrice:         searchParams.get("maxPrice")         || "",
    minYear:          searchParams.get("minYear")          || "",
    maxYear:          searchParams.get("maxYear")          || "",
    minMileage:       searchParams.get("minMileage")       || "",
    maxMileage:       searchParams.get("maxMileage")       || "",
    sort:             searchParams.get("sort")             || "",
    negotiable:       searchParams.get("negotiable")       || "",
    warrantyRemaining:searchParams.get("warrantyRemaining")|| "",
    noAccidents:      searchParams.get("noAccidents")      || "",
    sourceCountry:    searchParams.get("source_country")   || "",
    specOrigin:       searchParams.get("specOrigin")       || "",
    importStatus:     searchParams.get("importStatus")     || "",
    hasSalvageTitle:  searchParams.get("hasSalvageTitle")  || "",
    gccSpecs:         searchParams.get("gccSpecs")         || "",
  });

  useEffect(() => {
    const params = new URLSearchParams();
    const q = searchParams.get("search");
    if (q) params.set("search", q);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        // Map camelCase keys to the URL param names CarGrid/browse expect
        const urlKey = key === "sourceCountry" ? "source_country" : key;
        params.set(urlKey, value);
      }
    });
    router.push(`/browse?${params.toString()}`, { scroll: false });
    onFilterChange?.(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const updateFilter = (key: keyof FilterState, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const toggleBool = (key: keyof FilterState) =>
    setFilters((prev) => ({ ...prev, [key]: prev[key] === "true" ? "" : "true" }));

  const removeFilter = (key: keyof FilterState) =>
    setFilters((prev) => ({ ...prev, [key]: "" }));

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const getFilterLabel = (key: keyof FilterState, value: string): string => {
    const map: Record<string, string> = {
      make: t("filters.make"), model: t("filters.model"), city: t("filters.city"),
      fuelType: t("filters.fuelType"), transmission: t("filters.transmission"),
      condition: t("filters.condition"), bodyType: t("filters.bodyType"),
      minPrice: t("filters.minPrice"), maxPrice: t("filters.maxPrice"),
      minYear: t("filters.from"), maxYear: t("filters.to"),
      minMileage: t("filters.minMileage"), maxMileage: t("filters.maxMileage"),
      sort: t("filters.sortBy"), negotiable: t("filters.priceNegotiable"),
      warrantyRemaining: t("filters.hasWarranty"), noAccidents: t("filters.noAccidents"),
      sourceCountry: t("filters.sourceCountry"), specOrigin: t("filters.specOrigin"),
      importStatus: t("filters.importStatus"), hasSalvageTitle: t("filters.hasSalvageTitle"),
      gccSpecs: t("specOrigin.gcc"),
    };
    return map[key] ?? key;
  };

  const getFilterDisplayValue = (key: keyof FilterState, value: string): string => {
    if (["condition","negotiable","warrantyRemaining","noAccidents","hasSalvageTitle","gccSpecs"].includes(key)) return "";
    if (key === "minPrice" || key === "maxPrice") return Number(value).toLocaleString() + " SAR";
    if (key === "minMileage" || key === "maxMileage") return Number(value).toLocaleString() + ` ${t("browse.kmUnit")}`;
    if (key === "sort") { const sk = SORT_KEYS.find((o) => o.value === value); return sk ? t(sk.key) : value; }
    if (key === "sourceCountry") return t(`countries.${value}`);
    if (key === "specOrigin") return t(`specOrigin.${value}`);
    if (key === "importStatus") return t(`importStatus.${value}`);
    return value;
  };

  const activeFilters = (Object.entries(filters) as Array<[keyof FilterState, string]>).filter(
    ([, v]) => v !== ""
  );

  const BoolChip = ({ label, fieldKey }: { label: string; fieldKey: keyof FilterState }) => (
    <button
      type="button"
      onClick={() => toggleBool(fieldKey)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
        filters[fieldKey] === "true"
          ? "bg-accent text-white border-accent"
          : "bg-white text-slate-700 border-slate-200 hover:border-accent"
      }`}
    >
      {filters[fieldKey] === "true" ? (
        <CheckSquare className="w-4 h-4 flex-shrink-0" />
      ) : (
        <Square className="w-4 h-4 flex-shrink-0" />
      )}
      <span>{label}</span>
    </button>
  );

  const selectCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 text-sm";
  const inputCls  = "w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 bg-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 text-sm";
  const labelCls  = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";
  const sectionCls = "space-y-1.5";

  const FilterContent = () => (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">{t("browse.filters")}</h3>
          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-accent hover:text-accent-700 font-semibold">
              {t("filters.clearAll", { count: activeFiltersCount })}
            </button>
          )}
        </div>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map(([k, v]) => {
              const label = getFilterLabel(k, v);
              const dv = getFilterDisplayValue(k, v);
              return (
                <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-medium">
                  {label}{dv ? `: ${dv}` : ""}
                  <button onClick={() => removeFilter(k)} className="p-0.5 hover:bg-accent/20 rounded-full">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SORT ── */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.sortBy")}</label>
        <select value={filters.sort} onChange={(e) => updateFilter("sort", e.target.value)} className={selectCls}>
          <option value="">{t("filters.default")}</option>
          {SORT_KEYS.map((o) => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
        </select>
      </div>

      <div className="border-t border-slate-100" />

      {/* ── IMPORT FILTERS (top — most relevant) ── */}
      <p className="text-[11px] font-bold text-accent uppercase tracking-widest">{t("filters.importFilters")}</p>

      {/* Source Country */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.sourceCountry")}</label>
        <select value={filters.sourceCountry} onChange={(e) => updateFilter("sourceCountry", e.target.value)} className={selectCls}>
          <option value="">{t("filters.allCountries")}</option>
          {SOURCE_COUNTRY_KEYS.map((k) => <option key={k} value={k}>{t(`countries.${k}`)} {SOURCE_FLAGS[k]}</option>)}
        </select>
      </div>

      {/* Import Status */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.importStatus")}</label>
        <select value={filters.importStatus} onChange={(e) => updateFilter("importStatus", e.target.value)} className={selectCls}>
          <option value="">{t("filters.allStatuses")}</option>
          {IMPORT_STATUS_KEYS.map((k) => <option key={k} value={k}>{t(`importStatus.${k}`)}</option>)}
        </select>
      </div>

      {/* Spec Origin */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.specOrigin")}</label>
        <select value={filters.specOrigin} onChange={(e) => updateFilter("specOrigin", e.target.value)} className={selectCls}>
          <option value="">{t("filters.allSpecs")}</option>
          {SPEC_ORIGIN_KEYS.map((k) => <option key={k} value={k}>{t(`specOrigin.${k}`)}</option>)}
        </select>
      </div>

      {/* Bool import flags */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.importOptions")}</label>
        <div className="flex flex-col gap-2">
          <BoolChip fieldKey="gccSpecs"        label={t("filters.gccSpecsOnly")} />
          <BoolChip fieldKey="hasSalvageTitle" label={t("filters.hasSalvageTitle")} />
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* ── STANDARD FILTERS ── */}
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("filters.carFilters")}</p>

      {/* Make */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.make")}</label>
        <select value={filters.make} onChange={(e) => updateFilter("make", e.target.value)} className={selectCls}>
          <option value="">{t("filters.allMakes")}</option>
          {carMakes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Model */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.model")}</label>
        <input
          type="text" value={filters.model}
          onChange={(e) => updateFilter("model", e.target.value)}
          placeholder={t("filters.modelPlaceholder")}
          className={inputCls}
        />
      </div>

      {/* Body Type */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.bodyType")}</label>
        <select value={filters.bodyType} onChange={(e) => updateFilter("bodyType", e.target.value)} className={selectCls}>
          <option value="">{t("filters.allTypes")}</option>
          {bodyTypes.map((bt) => <option key={bt} value={bt.toLowerCase()}>{t(`filters.${bt.toLowerCase()}`)}</option>)}
        </select>
      </div>

      {/* Price Range */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.finalPrice")}</label>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder={t("filters.min")} value={filters.minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            className={inputCls} />
          <input type="number" placeholder={t("filters.max")} value={filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            className={inputCls} />
        </div>
      </div>

      {/* Year Range */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.year")}</label>
        <div className="grid grid-cols-2 gap-2">
          <select value={filters.minYear} onChange={(e) => updateFilter("minYear", e.target.value)} className={selectCls}>
            <option value="">{t("filters.from")}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filters.maxYear} onChange={(e) => updateFilter("maxYear", e.target.value)} className={selectCls}>
            <option value="">{t("filters.to")}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Mileage Range */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.mileageKm")}</label>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder={t("filters.min")} value={filters.minMileage}
            onChange={(e) => updateFilter("minMileage", e.target.value)}
            className={inputCls} />
          <input type="number" placeholder={t("filters.max")} value={filters.maxMileage}
            onChange={(e) => updateFilter("maxMileage", e.target.value)}
            className={inputCls} />
        </div>
      </div>

      {/* Fuel Type */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.fuelType")}</label>
        <select value={filters.fuelType} onChange={(e) => updateFilter("fuelType", e.target.value)} className={selectCls}>
          <option value="">{t("filters.allFuelTypes")}</option>
          {fuelTypes.map((f) => <option key={f} value={f}>{t(`filters.${f.toLowerCase()}`)}</option>)}
        </select>
      </div>

      {/* Transmission */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.transmission")}</label>
        <select value={filters.transmission} onChange={(e) => updateFilter("transmission", e.target.value)} className={selectCls}>
          <option value="">{t("filters.allTransmissions")}</option>
          {transmissions.map((tr) => <option key={tr} value={tr}>{t(`filters.${tr.toLowerCase()}`)}</option>)}
        </select>
      </div>

      {/* Condition */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.condition")}</label>
        <div className="flex gap-2">
          {conditions.map((c) => (
            <button key={c} type="button"
              onClick={() => updateFilter("condition", filters.condition === c ? "" : c)}
              className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold transition-colors capitalize border ${
                filters.condition === c
                  ? "bg-accent text-white border-accent"
                  : "bg-white text-slate-700 border-slate-200 hover:border-accent"
              }`}>
              {c === "new" ? t("filters.new") : c === "used" ? t("filters.used") : t("filters.certified")}
            </button>
          ))}
        </div>
      </div>

      {/* City */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.city")}</label>
        <input
          type="text" value={filters.city}
          onChange={(e) => updateFilter("city", e.target.value)}
          placeholder={t("filters.cityPlaceholder")}
          className={inputCls}
        />
      </div>

      {/* Boolean Extras */}
      <div className={sectionCls}>
        <label className={labelCls}>{t("filters.moreOptions")}</label>
        <div className="flex flex-col gap-2">
          <BoolChip fieldKey="negotiable"       label={t("filters.priceNegotiable")}  />
          <BoolChip fieldKey="warrantyRemaining" label={t("filters.hasWarranty")}      />
          <BoolChip fieldKey="noAccidents"      label={t("filters.noAccidents")}       />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-accent text-white rounded-full shadow-lg hover:bg-accent-600"
      >
        <SlidersHorizontal className="w-5 h-5" />
        <span className="font-semibold text-sm">{t("browse.filters")}</span>
        {activeFiltersCount > 0 && (
          <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">{activeFiltersCount}</span>
        )}
      </button>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white p-6 overflow-y-auto shadow-2xl">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700">
              <X className="w-6 h-6" />
            </button>
            <FilterContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
          <FilterContent />
        </div>
      </div>
    </>
  );
}
