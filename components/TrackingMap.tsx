"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------------------------
// Fix Leaflet's default icon path issue in Next.js / webpack
// ---------------------------------------------------------------------------
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ---------------------------------------------------------------------------
// Custom pin icons
// ---------------------------------------------------------------------------
const greenPin = L.divIcon({
  className: "",
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#10b981;border:2px solid #fff;
    box-shadow:0 0 0 3px rgba(16,185,129,0.25);
  "></div>`,
  iconAnchor: [7, 7],
});

const tealPulsePin = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:20px;height:20px">
    <div style="
      position:absolute;inset:0;border-radius:50%;
      background:rgba(10,10,10,0.15);
      animation:pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite;
    "></div>
    <div style="
      position:absolute;top:3px;left:3px;width:14px;height:14px;
      border-radius:50%;background:#0a0a0a;border:2px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>
  </div>
  <style>
    @keyframes pulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.6);opacity:.3}}
  </style>`,
  iconAnchor: [10, 10],
});

const darkTealPin = L.divIcon({
  className: "",
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#404040;border:2px solid #fff;
    box-shadow:0 0 0 3px rgba(64,64,64,0.25);
  "></div>`,
  iconAnchor: [7, 7],
});

// ---------------------------------------------------------------------------
// Route coordinates
// ---------------------------------------------------------------------------
const ORIGIN:   [number, number] = [34.0522,  -118.2437]; // Los Angeles
const SHIP:     [number, number] = [28.0,      -38.0];    // Mid-Atlantic
const DEST:     [number, number] = [26.4207,    50.0888]; // Dammam

// Great-circle-ish waypoints for a natural curved arc
const ROUTE: [number, number][] = [
  ORIGIN,
  [36.0,  -100.0],
  [38.0,   -75.0],
  [35.0,   -55.0],
  SHIP,
  [30.0,   -20.0],
  [25.0,     5.0],
  [20.0,    30.0],
  [15.0,    43.0],  // Gulf of Aden / Red Sea approach
  [22.0,    48.0],
  DEST,
];

// ---------------------------------------------------------------------------
// Auto-fit bounds helper
// ---------------------------------------------------------------------------
function FitBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.latLngBounds([ORIGIN, SHIP, DEST]).pad(0.15));
  }, [map]);
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TrackingMap() {
  return (
    <div style={{ isolation: "isolate", position: "relative", zIndex: 0 }}>
    <MapContainer
      center={[25, -35]}
      zoom={2}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      style={{ height: "220px", width: "100%", borderRadius: "0.75rem" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Route line — completed portion */}
      <Polyline
        positions={ROUTE.slice(0, ROUTE.indexOf(SHIP) + 1)}
        pathOptions={{ color: "#0a0a0a", weight: 2.5, opacity: 0.9 }}
      />
      {/* Route line — upcoming portion */}
      <Polyline
        positions={ROUTE.slice(ROUTE.indexOf(SHIP))}
        pathOptions={{ color: "#0a0a0a", weight: 2, opacity: 0.4, dashArray: "8 6" }}
      />

      {/* Markers */}
      <Marker position={ORIGIN} icon={greenPin} />
      <Marker position={SHIP}   icon={tealPulsePin} />
      <Marker position={DEST}   icon={darkTealPin} />

      <FitBounds />
    </MapContainer>
    </div>
  );
}
