"use client";

import CountryCard from "./CountryCard";
import type { CountryAggregate } from "@/types/source-country";

interface CountryCardGridProps {
  countries: CountryAggregate[];
  selectedCode: string | null;
  onCountryClick: (code: string) => void;
}

export default function CountryCardGrid({
  countries,
  selectedCode,
  onCountryClick,
}: CountryCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {countries.map((country) => (
        <CountryCard
          key={country.code}
          country={country}
          isSelected={country.code === selectedCode}
          onClick={() => onCountryClick(country.code)}
        />
      ))}
    </div>
  );
}
