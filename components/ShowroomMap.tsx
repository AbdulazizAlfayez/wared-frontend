"use client";

import { MapPin, ExternalLink, Star, Navigation } from "lucide-react";

// Showroom type for the map
interface Showroom {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  services: string[];
  rating: number;
  cars: Array<{
    id: string;
    title: string;
    priceSar: number;
    year: number;
    make: string;
    model: string;
    image: string;
  }>;
}

interface ShowroomMapProps {
  showrooms: Showroom[];
  selectedShowroom: Showroom | null;
  onMarkerClick: (showroom: Showroom) => void;
}

export default function ShowroomMap({
  showrooms,
  selectedShowroom,
  onMarkerClick,
}: ShowroomMapProps) {
  // Saudi Arabia center (roughly Riyadh)
  const defaultLat = 24.7136;
  const defaultLng = 46.6753;

  // Use selected showroom location or default
  const mapLat = selectedShowroom?.lat ?? defaultLat;
  const mapLng = selectedShowroom?.lng ?? defaultLng;
  
  // Zoom level - closer when showroom selected (15 = street level)
  const zoom = selectedShowroom ? 15 : 6;

  // Create a unique timestamp for cache busting
  const timestamp = selectedShowroom ? Date.now() : 0;
  
  // Google Maps embed URL - using search format which shows a red pin marker
  // Adding timestamp to prevent browser caching
  const mapUrl = `https://maps.google.com/maps?q=${mapLat},${mapLng}&t=m&z=${zoom}&output=embed&iwloc=near&_t=${timestamp}`;
  
  // Google Maps link for "View larger map"
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${mapLat},${mapLng}`;

  // Create a unique key to FORCE iframe element recreation
  const iframeKey = `map-${selectedShowroom?.id || 'default'}-${timestamp}`;

  // Handle showroom selection from the list
  const handleSelectShowroom = (showroom: Showroom) => {
    console.log("[ShowroomMap] Selecting showroom:", showroom.name);
    console.log("[ShowroomMap] Coordinates:", showroom.lat, showroom.lng);
    onMarkerClick(showroom);
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
        title="Showroom Location Map"
      />

      {/* Showroom quick select overlay */}
      <div 
        className="absolute top-3 left-3 right-3 z-30"
        style={{ pointerEvents: "auto" }}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-200 max-h-52 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600">
              {showrooms.length} showrooms
            </p>
            {selectedShowroom && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Pin active
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {showrooms.map((showroom) => {
              const isSelected = selectedShowroom?.id === showroom.id;
              return (
                <button
                  key={showroom.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectShowroom(showroom);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-400"
                      : "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-100 hover:border-blue-300"
                  }`}
                >
                  <div className={`p-1 rounded-full ${isSelected ? "bg-white/20" : "bg-blue-100"}`}>
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-blue-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{showroom.name}</span>
                    <span className={`text-xs ${isSelected ? "text-blue-100" : "text-gray-500"}`}>
                      {showroom.city}
                    </span>
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${isSelected ? "text-amber-200" : "text-amber-600"}`}>
                    <Star className="w-3 h-3 fill-current" />
                    <span>{showroom.rating}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected showroom info panel - shows when a showroom is pinned */}
      {selectedShowroom && (
        <div 
          className="absolute bottom-3 left-3 right-3 z-30"
          style={{ pointerEvents: "auto" }}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border-2 border-blue-400">
            <div className="flex items-center gap-2 text-blue-600 text-xs font-medium mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Showing pin for:
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-base">
                  {selectedShowroom.name}
                </h4>
                <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{selectedShowroom.city} - {selectedShowroom.address}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Coordinates: {selectedShowroom.lat != null ? Number(selectedShowroom.lat).toFixed(4) : "—"}, {selectedShowroom.lng != null ? Number(selectedShowroom.lng).toFixed(4) : "—"}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 bg-amber-100 px-2.5 py-1 rounded-lg">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-amber-700">{selectedShowroom.rating}</span>
                </div>
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
