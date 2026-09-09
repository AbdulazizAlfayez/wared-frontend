"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, X, Loader2, GitCompare, Gauge, Fuel, Calendar, MapPin, Car, Palette, Tag, CheckCircle } from "lucide-react";
import { getCompareIds, removeFromCompare, clearCompare } from "@/lib/compare";
import { sampleCars, type SampleCar } from "@/components/CarGrid";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import type { Listing } from "@/lib/types";

function listingToCompareCar(listing: Listing): SampleCar {
  const primary = listing.images?.find((img) => img.is_primary) ?? listing.images?.[0];
  return {
    id: String(listing.id),
    title: listing.title || `${listing.year} ${listing.make} ${listing.model}`,
    make: listing.make,
    model: listing.model,
    year: listing.year,
    city: listing.city,
    priceSar: listing.price,
    mileageKm: listing.mileage,
    fuelType: listing.fuel_type,
    transmission: listing.transmission,
    condition: listing.condition,
    color: listing.color || "Unknown",
    description: listing.description || "",
    imageUrl: listing.primary_image || primary?.image_url || getImageUrl(primary?.image),
    sellerPhone: listing.owner?.phone || undefined,
    sellerEmail: undefined,
  };
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareCars, setCompareCars] = useState<SampleCar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize compare IDs from URL or localStorage
  useEffect(() => {
    const idsFromUrl = searchParams.get("ids");
    if (idsFromUrl) {
      setCompareIds(idsFromUrl.split(",").filter(Boolean));
    } else {
      setCompareIds(getCompareIds());
    }
  }, [searchParams]);

  // Listen for compare updates
  useEffect(() => {
    const handleCompareUpdate = () => {
      setCompareIds(getCompareIds());
    };

    window.addEventListener("compareUpdated", handleCompareUpdate);
    window.addEventListener("storage", handleCompareUpdate);

    return () => {
      window.removeEventListener("compareUpdated", handleCompareUpdate);
      window.removeEventListener("storage", handleCompareUpdate);
    };
  }, []);

  // Fetch listings from Django for each compareId
  useEffect(() => {
    if (compareIds.length === 0) {
      setIsLoading(false);
      setCompareCars([]);
      return;
    }

    setIsLoading(true);
    Promise.all(
      compareIds.map((id) =>
        api.get<Listing>(`/api/listings/${id}/`).catch(() => null)
      )
    )
      .then((results) => {
        const valid = results.filter((r): r is Listing => r !== null);
        if (valid.length > 0) {
          setCompareCars(valid.map(listingToCompareCar));
        } else {
          // Fallback to sample cars if no Django listings found
          setCompareCars(sampleCars.filter((car) => compareIds.includes(car.id)));
        }
      })
      .catch(() => {
        setCompareCars(sampleCars.filter((car) => compareIds.includes(car.id)));
      })
      .finally(() => setIsLoading(false));
  }, [compareIds]);

  const handleRemoveCar = useCallback((id: string) => {
    removeFromCompare(id);
    setCompareIds((prev) => prev.filter((cid) => cid !== id));
    setCompareCars((prev) => prev.filter((car) => car.id !== id));
  }, []);

  const handleClearAll = () => {
    clearCompare();
    setCompareIds([]);
    setCompareCars([]);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat("en-SA").format(mileage) + " km";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (compareIds.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <GitCompare className="w-10 h-10 text-slate-300" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              No cars to compare
            </h1>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Select 2-4 cars from the browse page to compare them side by side.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors"
            >
              <span>Browse Cars</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (compareCars.length < 2) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
              <GitCompare className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Need at least 2 cars
            </h1>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              You need to select at least 2 cars to compare. Currently selected: {compareCars.length}
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors"
            >
              <span>Add More Cars</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Comparison attributes
  const comparisonRows = [
    { label: "Price", getValue: (car: SampleCar) => formatPrice(car.priceSar), icon: Tag },
    { label: "Year", getValue: (car: SampleCar) => car.year.toString(), icon: Calendar },
    { label: "Make", getValue: (car: SampleCar) => car.make, icon: Car },
    { label: "Model", getValue: (car: SampleCar) => car.model, icon: Car },
    { label: "City", getValue: (car: SampleCar) => car.city, icon: MapPin },
    { label: "Mileage", getValue: (car: SampleCar) => formatMileage(car.mileageKm), icon: Gauge },
    { label: "Fuel Type", getValue: (car: SampleCar) => car.fuelType, icon: Fuel },
    { label: "Transmission", getValue: (car: SampleCar) => car.transmission, icon: Car },
    { label: "Condition", getValue: (car: SampleCar) => car.condition === "new" ? "New" : "Used", icon: CheckCircle },
    { label: "Color", getValue: (car: SampleCar) => car.color, icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center space-x-2 text-slate-500 hover:text-slate-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
              Compare Cars
            </h1>
            <p className="text-slate-500">
              Comparing {compareCars.length} cars side by side
            </p>
          </div>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-slate-500 hover:text-red-600 font-medium transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          {/* Car Images and Titles */}
          <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: `200px repeat(${compareCars.length}, 1fr)` }}>
            <div className="p-4 bg-slate-50 flex items-center">
              <span className="font-semibold text-slate-700">Car</span>
            </div>
            {compareCars.map((car) => (
              <div key={car.id} className="p-4 border-l border-slate-100">
                <div className="relative">
                  <button
                    onClick={() => handleRemoveCar(car.id)}
                    className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                    aria-label="Remove from comparison"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 mb-3">
                    <Image
                      src={car.imageUrl}
                      alt={car.title}
                      fill
                      className="object-cover"
                    />
                    {/* Condition Badge */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          car.condition === "new"
                            ? "bg-green-500 text-white"
                            : "bg-slate-700 text-white"
                        }`}
                      >
                        {car.condition === "new" ? "New" : "Used"}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{car.title}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Rows */}
          {comparisonRows.map((row, index) => {
            const Icon = row.icon;
            return (
              <div
                key={row.label}
                className={`grid ${index !== comparisonRows.length - 1 ? 'border-b border-slate-100' : ''}`}
                style={{ gridTemplateColumns: `200px repeat(${compareCars.length}, 1fr)` }}
              >
                <div className="p-4 bg-slate-50 flex items-center space-x-2">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">{row.label}</span>
                </div>
                {compareCars.map((car) => (
                  <div key={car.id} className="p-4 border-l border-slate-100 flex items-center">
                    <span className={`text-slate-900 ${row.label === 'Price' ? 'font-bold text-accent' : ''}`}>
                      {row.getValue(car)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Mobile Horizontal Scroll Hint */}
        <div className="mt-4 text-center text-sm text-slate-400 sm:hidden">
          Scroll horizontally to see all cars →
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/browse"
            className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors text-center"
          >
            Add More Cars
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
