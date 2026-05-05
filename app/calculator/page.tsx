"use client";

import { useState } from "react";
import { Calculator, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { CostEstimate } from "@/lib/types";

const COUNTRIES = [
  { value: "usa",    label: "USA 🇺🇸",         currency: "USD" },
  { value: "uae",    label: "UAE 🇦🇪",         currency: "AED" },
  { value: "japan",  label: "Japan 🇯🇵",       currency: "JPY" },
  { value: "korea",  label: "South Korea 🇰🇷", currency: "KRW" },
  { value: "europe", label: "Europe 🇪🇺",      currency: "EUR" },
  { value: "canada", label: "Canada 🇨🇦",      currency: "CAD" },
  { value: "qatar",  label: "Qatar 🇶🇦",       currency: "QAR" },
  { value: "other",  label: "Other 🌐",          currency: "USD" },
];

function fmt(v: string | number | null | undefined) {
  if (!v) return "—";
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(Number(v));
}

export default function CalculatorPage() {
  const [country, setCountry]   = useState("usa");
  const [carValue, setCarValue] = useState("");
  const [year, setYear]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<CostEstimate | null>(null);
  const [error, setError]       = useState("");

  const selected = COUNTRIES.find((c) => c.value === country) ?? COUNTRIES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carValue || isNaN(Number(carValue)) || Number(carValue) <= 0) {
      setError("Please enter a valid car price.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams({
        source_country: country,
        car_value: carValue,
        ...(year ? { year } : {}),
      });
      const data = await api.get<CostEstimate>(
        `/api/calculator/estimate/?${params}`
      );
      setResult(data);
    } catch {
      setError("Failed to fetch estimate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 text-accent mb-4">
            <Calculator className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
            Import Cost Calculator
          </h1>
          <p className="text-slate-500 text-lg">
            See the full SAR cost before you commit — car price, shipping, customs,
            VAT, and port fees all included.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6"
        >
          {/* Country */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Source Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            >
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Car Value */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Car Price in {selected.currency}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                {selected.currency}
              </span>
              <input
                type="number"
                value={carValue}
                onChange={(e) => setCarValue(e.target.value)}
                placeholder="e.g. 16000"
                className="w-full pl-16 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                min="1"
                required
              />
            </div>
          </div>

          {/* Year (optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Model Year{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2021"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              min="1990"
              max="2030"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-accent hover:bg-accent-600 disabled:opacity-60 text-white font-bold text-base transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Calculate Total Cost
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-1">
              Full Cost Breakdown
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {selected.currency} {Number(result.car_value).toLocaleString()} ×{" "}
              {result.exchange_rate} = {fmt(result.car_price_sar)} SAR
            </p>

            {result.age_restriction_warning && (
              <div className="flex items-start gap-2 p-3 mb-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {result.age_restriction_warning}
              </div>
            )}

            <div className="space-y-1">
              {Object.values(result.breakdown).map(({ label, amount }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {label.includes("low") || label.includes("high")
                      ? fmt(amount)
                      : fmt(amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total row */}
            <div className="mt-5 pt-5 border-t-2 border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-900">Total Estimate</span>
              <div className="text-right">
                <div className="text-2xl font-black text-accent">
                  {fmt(result.total_estimate_low)}
                </div>
                <div className="text-xs text-slate-400">
                  to {fmt(result.total_estimate_high)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
