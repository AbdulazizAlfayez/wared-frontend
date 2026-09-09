"use client";

import { memo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import type { CountryAggregate } from "@/types/source-country";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// world-atlas uses numeric ISO 3166-1 codes in feature.id
const numericToCode: Record<string, string> = {
  "840": "usa",
  "392": "japan",
  "410": "korea",
  "784": "uae",
  "276": "germany",
  "124": "canada",
  "826": "gbr",
};

function heatColor(total: number): string {
  if (total >= 30) return "#1E3A8A";
  if (total >= 16) return "#2563EB";
  if (total >= 6) return "#60A5FA";
  if (total >= 1) return "#DBEAFE";
  return "#E5E7EB";
}

interface WorldMapProps {
  countries: CountryAggregate[];
  selectedCode: string | null;
  onCountryClick: (code: string) => void;
}

function MapLegend() {
  const items = [
    { color: "#DBEAFE", label: "1–5" },
    { color: "#60A5FA", label: "6–15" },
    { color: "#2563EB", label: "16–30" },
    { color: "#1E3A8A", label: "30+" },
  ];
  return (
    <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
      <span className="font-medium">Cars:</span>
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ background: color }}
          />
          {label}
        </div>
      ))}
    </div>
  );
}

function WorldMapInner({
  countries,
  selectedCode,
  onCountryClick,
}: WorldMapProps) {
  const [tooltip, setTooltip] = useState<{
    name: string;
    flag: string;
    total: number;
    x: number;
    y: number;
  } | null>(null);

  const countryByCode = new Map(countries.map((c) => [c.code, c]));

  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="aspect-[2/1] w-full">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 130, center: [30, 20] }}
          className="w-full h-full"
        >
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const code = numericToCode[geo.id];
                  const country = code ? countryByCode.get(code) : undefined;
                  const total = country?.total_cars ?? 0;
                  const isSelected = code === selectedCode;
                  const isClickable = total > 0;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => {
                        if (isClickable && code) onCountryClick(code);
                      }}
                      onMouseEnter={(e) => {
                        if (!country) return;
                        const rect = (
                          e.target as SVGElement
                        ).closest("svg")?.getBoundingClientRect();
                        setTooltip({
                          name: country.name_en,
                          flag: country.flag_emoji,
                          total,
                          x: e.clientX - (rect?.left ?? 0),
                          y: e.clientY - (rect?.top ?? 0) - 40,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill: heatColor(total),
                          stroke: isSelected ? "#0A0A0A" : "#fff",
                          strokeWidth: isSelected ? 2 : 0.5,
                          outline: "none",
                          cursor: isClickable ? "pointer" : "default",
                        },
                        hover: {
                          fill: isClickable ? heatColor(total) : "#E5E7EB",
                          stroke: "#0A0A0A",
                          strokeWidth: 1.5,
                          outline: "none",
                          opacity: isClickable ? 0.85 : 1,
                          cursor: isClickable ? "pointer" : "default",
                        },
                        pressed: {
                          fill: heatColor(total),
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-20 bg-white border border-slate-200 shadow-lg rounded-lg px-3 py-2 text-sm"
            style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
          >
            <span className="mr-1">{tooltip.flag}</span>
            <span className="font-semibold text-slate-900">{tooltip.name}</span>
            <span className="text-slate-500 ml-2">{tooltip.total} cars</span>
          </div>
        )}
      </div>
      <MapLegend />
    </div>
  );
}

export default memo(WorldMapInner);
