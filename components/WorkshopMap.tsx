"use client";

import { MapPin, ExternalLink, Star, Navigation } from "lucide-react";
import { Workshop } from "@/lib/workshops";

interface WorkshopMapProps {
  workshops: Workshop[];
  selectedWorkshop: Workshop | null;
  onMarkerClick: (workshop: Workshop) => void;
}

export default function WorkshopMap({
  workshops,
  selectedWorkshop,
  onMarkerClick,
}: WorkshopMapProps) {
  // Saudi Arabia center (roughly Riyadh)
  const defaultLat = 24.7136;
  const defaultLng = 46.6753;

  // Use selected workshop location or default
  const mapLat = selectedWorkshop?.lat ?? defaultLat;
  const mapLng = selectedWorkshop?.lng ?? defaultLng;
  
  // Zoom level - closer when workshop selected (15 = street level)
  const zoom = selectedWorkshop ? 15 : 6;

  // Create a unique timestamp for cache busting
  const timestamp = selectedWorkshop ? Date.now() : 0;
  
  // Google Maps embed URL - using search format which shows a red pin marker
  // Adding timestamp to prevent browser caching
  const mapUrl = `https://maps.google.com/maps?q=${mapLat},${mapLng}&t=m&z=${zoom}&output=embed&iwloc=near&_t=${timestamp}`;
  
  // Google Maps link for "View larger map"
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${mapLat},${mapLng}`;

  // Create a unique key to FORCE iframe element recreation
  const iframeKey = `map-${selectedWorkshop?.id || 'default'}-${timestamp}`;

  // Handle workshop selection from the list
  const handleSelectWorkshop = (workshop: Workshop) => {
    console.log("[WorkshopMap] Selecting workshop:", workshop.name);
    console.log("[WorkshopMap] Coordinates:", workshop.lat, workshop.lng);
    onMarkerClick(workshop);
  };

  return (
    <div className="w-full h-full bg-gray-100 rounded-2xl overflow-hidden relative">
      {/* Map iframe - key forces reload when selection changes */}
      <iframe
        key={iframeKey}
        src={mapUrl}
        className="absolute inset-0 w-full h-full"
        style={{ border: 0 }}
        allowFullScreen
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
        title="Workshop Location Map"
      />

      {/* Workshop quick select overlay */}
      <div 
        className="absolute top-3 left-3 right-3 z-30"
        style={{ pointerEvents: "auto" }}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-200 max-h-52 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600">
              {workshops.length} workshops
            </p>
            {selectedWorkshop && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Pin active
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {workshops.map((workshop) => {
              const isSelected = selectedWorkshop?.id === workshop.id;
              return (
                <button
                  key={workshop.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectWorkshop(workshop);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400"
                      : "bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-100 hover:border-emerald-300"
                  }`}
                >
                  <div className={`p-1 rounded-full ${isSelected ? "bg-white/20" : "bg-emerald-100"}`}>
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{workshop.name}</span>
                    <span className={`text-xs ${isSelected ? "text-emerald-100" : "text-gray-500"}`}>
                      {workshop.city}
                    </span>
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${isSelected ? "text-amber-200" : "text-amber-600"}`}>
                    <Star className="w-3 h-3 fill-current" />
                    <span>{workshop.rating}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected workshop info panel - shows when a workshop is pinned */}
      {selectedWorkshop && (
        <div 
          className="absolute bottom-3 left-3 right-3 z-30"
          style={{ pointerEvents: "auto" }}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border-2 border-emerald-400">
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Showing pin for:
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-base">
                  {selectedWorkshop.name}
                </h4>
                <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">{selectedWorkshop.city} - {selectedWorkshop.address}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Coordinates: {Number(selectedWorkshop.lat || 0).toFixed(4)}, {Number(selectedWorkshop.lng || 0).toFixed(4)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 bg-amber-100 px-2.5 py-1 rounded-lg">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-amber-700">{selectedWorkshop.rating}</span>
                </div>
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  title="Open in Google Maps"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
