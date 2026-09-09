"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { sampleCars } from "@/components/CarGrid";
import { useTranslation } from "@/lib/i18n";

// Car makes stay in English - only the "All Makes" label gets translated
const carMakes = [
  "Toyota",
  "Honda",
  "Nissan",
  "Hyundai",
  "Kia",
  "Ford",
  "Chevrolet",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Lexus",
  "GMC",
  "Jeep",
  "Land Rover",
  "Porsche",
];

// Build a map of make -> models from sample cars
const modelsByMake: Record<string, string[]> = {};
sampleCars.forEach((car) => {
  if (!modelsByMake[car.make]) {
    modelsByMake[car.make] = [];
  }
  if (!modelsByMake[car.make].includes(car.model)) {
    modelsByMake[car.make].push(car.model);
  }
});

interface SearchBoxProps {
  variant?: "hero" | "compact";
  className?: string;
}

export default function SearchBox({ variant = "hero", className = "" }: SearchBoxProps) {
  const router = useRouter();
  const { t, dir } = useTranslation();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Get available models for the selected make
  const availableModels = useMemo(() => {
    if (!make) return [];
    return modelsByMake[make] || [];
  }, [make]);

  // Handle make change - reset model when make changes
  const handleMakeChange = (newMake: string) => {
    setMake(newMake);
    setModel(""); // Reset model when make changes
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    router.push(`/browse?${params.toString()}`);
  };

  if (variant === "compact") {
    return (
      <form onSubmit={handleSearch} className={`flex items-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""} ${className}`}>
        <select
          value={make}
          onChange={(e) => handleMakeChange(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-accent"
        >
          <option value="">{t("search.allMakes")}</option>
          {carMakes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!make}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{t("search.allModels")}</option>
          {availableModels.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="p-2 bg-accent hover:bg-accent-600 text-white rounded-lg"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className={`w-full max-w-5xl ${className}`}>
      <div 
        className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-2xl"
        style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.1)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Make */}
          <div className="space-y-2">
            <label className="text-white/90 text-sm font-medium">{t("search.make")}</label>
            <select
              value={make}
              onChange={(e) => handleMakeChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white focus:border-white/60 focus:ring-1 focus:ring-white/30 focus:bg-white/25 transition-all"
            >
              <option value="" className="bg-slate-900 text-white">{t("search.allMakes")}</option>
              {carMakes.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <label className="text-white/90 text-sm font-medium">{t("search.model")}</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!make}
              className="w-full px-4 py-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white focus:border-white/60 focus:ring-1 focus:ring-white/30 focus:bg-white/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" className="bg-slate-900 text-white">{t("search.allModels")}</option>
              {availableModels.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div className="space-y-2">
            <label className="text-white/90 text-sm font-medium">{t("search.minPrice")}</label>
            <input
              type="number"
              placeholder={t("search.minPricePlaceholder")}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-4 py-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:border-white/60 focus:ring-1 focus:ring-white/30 focus:bg-white/25 transition-all"
            />
          </div>

          {/* Max Price */}
          <div className="space-y-2">
            <label className="text-white/90 text-sm font-medium">{t("search.maxPrice")}</label>
            <input
              type="number"
              placeholder={t("search.maxPricePlaceholder")}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-4 py-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:border-white/60 focus:ring-1 focus:ring-white/30 focus:bg-white/25 transition-all"
            />
          </div>

          {/* Search Button */}
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              type="submit"
              className={`w-full px-6 py-3 bg-white/90 hover:bg-white text-accent rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${dir === "rtl" ? "flex-row-reverse" : ""}`}
            >
              <Search className="w-5 h-5" />
              <span>{t("common.search")}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
