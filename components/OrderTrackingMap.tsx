"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------------------------
// Port coordinate databases
// ---------------------------------------------------------------------------

type LatLng = [number, number];

const ORIGIN_PORTS: Record<string, LatLng> = {
  "los angeles, california, usa": [33.74, -118.27],
  "los angeles, usa":             [33.74, -118.27],
  "los angeles":                  [33.74, -118.27],
  "long beach, usa":              [33.76, -118.19],
  "new york, usa":                [40.67, -74.04],
  "new york":                     [40.67, -74.04],
  "baltimore, usa":               [39.27, -76.58],
  "houston, usa":                 [29.73, -95.27],
  "tokyo, japan":                 [35.45, 139.68],
  "yokohama, japan":              [35.44, 139.64],
  "nagoya, japan":                [35.06, 136.88],
  "osaka, japan":                 [34.65, 135.46],
  "busan, korea":                 [35.10, 129.04],
  "busan, south korea":           [35.10, 129.04],
  "incheon, korea":               [37.46, 126.62],
  "dubai, uae":                   [25.27,  55.29],
  "jebel ali, uae":               [25.01,  55.06],
  "abu dhabi, uae":               [24.47,  54.37],
  "hamburg, germany":             [53.54,   9.93],
  "bremerhaven, germany":         [53.59,   8.57],
  "southampton, uk":              [50.89,  -1.39],
  "rotterdam, netherlands":       [51.89,   4.49],
  "antwerp, belgium":             [51.25,   4.40],
  "zeebrugge, belgium":           [51.34,   3.20],
};

const SAUDI_PORTS: Record<string, { coord: LatLng; name: string }> = {
  king_abdulaziz_port_dammam:  { coord: [26.48, 50.21], name: "King Abdulaziz Port, Dammam" },
  jeddah_islamic_port:          { coord: [21.48, 39.17], name: "Jeddah Islamic Port" },
  jubail_port:                  { coord: [27.01, 49.66], name: "Jubail Commercial Port" },
};

// Fallback for Dammam if port_of_entry not specified
const DEFAULT_SAUDI_PORT = SAUDI_PORTS["king_abdulaziz_port_dammam"];

// ---------------------------------------------------------------------------
// Route waypoint builder
// ---------------------------------------------------------------------------

function buildWaypoints(origin: LatLng, destKey: string): LatLng[] {
  const dest = (SAUDI_PORTS[destKey] ?? DEFAULT_SAUDI_PORT).coord;
  const [oLat, oLng] = origin;
  const isJeddah = destKey === "jeddah_islamic_port";

  // ── USA West Coast
  if (oLng < -100 && oLat > 30) {
    if (isJeddah) {
      return [
        origin,
        [10.0, -79.5],   // Panama Canal
        [15.0, -68.0],   // Caribbean
        [20.0, -40.0],   // Mid-Atlantic
        [36.0, -5.6],    // Gibraltar
        [35.0, 15.0],    // Mediterranean
        [30.5, 32.3],    // Suez Canal
        [22.0, 38.0],    // Red Sea – Jeddah side
        dest,
      ];
    }
    return [
      origin,
      [10.0, -79.5],   // Panama Canal
      [15.0, -68.0],   // Caribbean
      [20.0, -40.0],   // Mid-Atlantic
      [36.0, -5.6],    // Gibraltar
      [35.0, 15.0],    // Mediterranean
      [30.5, 32.3],    // Suez Canal
      [20.0, 38.5],    // Red Sea
      [18.0, 55.0],    // Arabian Sea
      dest,
    ];
  }

  // ── USA East Coast / Gulf
  if (oLng < -60 && oLat > 20) {
    if (isJeddah) {
      return [
        origin,
        [36.0, -5.6],    // Gibraltar
        [35.0, 15.0],    // Mediterranean
        [30.5, 32.3],    // Suez Canal
        [22.0, 38.0],    // Red Sea – Jeddah side
        dest,
      ];
    }
    return [
      origin,
      [36.0, -5.6],    // Gibraltar
      [35.0, 15.0],    // Mediterranean
      [30.5, 32.3],    // Suez Canal
      [20.0, 38.5],    // Red Sea
      [18.0, 55.0],    // Arabian Sea
      dest,
    ];
  }

  // ── Japan / Korea
  if (oLng > 120 && oLat > 25) {
    if (isJeddah) {
      return [
        origin,
        [15.0, 115.0],  // South China Sea
        [2.0,  103.0],  // Malacca Strait
        [8.0,   75.0],  // Indian Ocean
        [12.0,  45.0],  // Gulf of Aden
        [16.0,  41.0],  // Red Sea entry
        [22.0,  38.0],  // Mid Red Sea – Jeddah side
        dest,
      ];
    }
    return [
      origin,
      [15.0, 115.0],   // South China Sea
      [2.0,  103.0],   // Malacca Strait
      [8.0,   75.0],   // Indian Ocean
      [18.0,  55.0],   // Arabian Sea
      dest,
    ];
  }

  // ── UAE / Gulf
  if (oLng > 50 && oLng < 60 && oLat < 30) {
    return [
      origin,
      [26.5, 56.2],    // Strait of Hormuz
      [24.0, 57.5],    // Gulf of Oman entry
      dest,
    ];
  }

  // ── Europe (North Sea / Atlantic)
  if (oLat > 45 && oLng < 15) {
    if (isJeddah) {
      return [
        origin,
        [50.0, -1.0],    // English Channel
        [36.0, -5.6],    // Gibraltar
        [35.0, 15.0],    // Mediterranean
        [30.5, 32.3],    // Suez Canal
        [22.0, 38.0],    // Red Sea – Jeddah side
        dest,
      ];
    }
    return [
      origin,
      [50.0, -1.0],    // English Channel
      [36.0, -5.6],    // Gibraltar
      [35.0, 15.0],    // Mediterranean
      [30.5, 32.3],    // Suez Canal
      [20.0, 38.5],    // Red Sea
      [18.0, 55.0],    // Arabian Sea
      dest,
    ];
  }

  // Fallback straight line
  return [origin, dest];
}

// ---------------------------------------------------------------------------
// Progress along route
// ---------------------------------------------------------------------------

const STATUS_PROGRESS: Record<string, number> = {
  pending:            0,
  deposit_requested:  0,
  deposit_paid:       0,
  confirmed:          0,
  sourcing:           0,
  purchased:          0.05,
  preparing_shipment: 0.1,
  shipped:            0.25,
  arrived_port:       1,
  in_customs:         1,
  customs_cleared:    1,
  inspection:         1,
  ready:              1,
  delivered:          1,
  completed:          1,
};

function interpolate(waypoints: LatLng[], t: number): LatLng {
  if (t <= 0) return waypoints[0];
  if (t >= 1) return waypoints[waypoints.length - 1];

  // Compute total path length
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [y1, x1] = waypoints[i];
    const [y2, x2] = waypoints[i + 1];
    const d = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
    segs.push(d);
    total += d;
  }

  let target = t * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i]) {
      const frac = target / segs[i];
      const [y1, x1] = waypoints[i];
      const [y2, x2] = waypoints[i + 1];
      return [y1 + frac * (y2 - y1), x1 + frac * (x2 - x1)];
    }
    target -= segs[i];
  }
  return waypoints[waypoints.length - 1];
}

// ---------------------------------------------------------------------------
// Fit bounds helper component
// ---------------------------------------------------------------------------
function FitBounds({ waypoints }: { waypoints: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (waypoints.length < 2) return;
    const bounds = L.latLngBounds(waypoints.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, waypoints]);
  return null;
}

// ---------------------------------------------------------------------------
// Custom icons
// ---------------------------------------------------------------------------

function makeCircleIcon(color: string, ring?: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 14px; height: 14px;
        background: ${color};
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        ${ring ? `outline: 2px solid ${ring}; outline-offset: 2px;` : ""}
      "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

function makeShipIcon(isAtPort: boolean) {
  if (isAtPort) {
    return L.divIcon({
      className: "",
      html: `
        <div style="position:relative; width:20px; height:20px;">
          <div style="
            position:absolute; inset:0;
            background:#0a0a0a; border-radius:50%;
            border:2.5px solid white;
            box-shadow:0 1px 4px rgba(0,0,0,0.25);
          "></div>
        </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -12],
    });
  }
  return L.divIcon({
    className: "",
    html: `
      <div class="ship-pulse-wrapper" style="position:relative; width:22px; height:22px;">
        <div class="ship-pulse-ring" style="
          position:absolute; inset:-4px;
          background:#0a0a0a; border-radius:50%; opacity:0.35;
          animation: shipPulse 1.8s ease-out infinite;
        "></div>
        <div style="
          position:absolute; inset:0;
          background:#0a0a0a; border-radius:50%;
          border:2.5px solid white;
          box-shadow:0 0 0 3px rgba(10,10,10,0.20), 0 2px 6px rgba(0,0,0,0.3);
          display:flex; align-items:center; justify-content:center;
        ">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M20 21l-8-3-8 3V5l8-3 8 3z"/>
          </svg>
        </div>
      </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -13],
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface OrderTrackingMapProps {
  portOfOrigin:  string | null | undefined;
  portOfEntry:   string | null | undefined;
  currentStatus: string;
  vesselName:    string | null | undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function OrderTrackingMap({
  portOfOrigin,
  portOfEntry,
  currentStatus,
  vesselName,
}: OrderTrackingMapProps) {

  // Inject pulse keyframe once
  useEffect(() => {
    const id = "order-map-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = `
        @keyframes shipPulse {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(2.8); opacity: 0;   }
        }
        .leaflet-container { font-family: inherit; }
        .leaflet-popup-content-wrapper {
          border-radius: 10px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
          padding: 2px 4px;
        }
        .leaflet-popup-content { margin: 8px 12px !important; font-size: 12px; }
        .leaflet-popup-tip-container { display: none; }
      `;
      document.head.appendChild(s);
    }
  }, []);

  // Resolve origin coordinates
  const originKey = portOfOrigin?.toLowerCase().trim() ?? "";
  let originCoord: LatLng | null = null;
  for (const [k, v] of Object.entries(ORIGIN_PORTS)) {
    if (originKey.includes(k) || k.includes(originKey)) {
      originCoord = v;
      break;
    }
  }
  if (!originCoord) {
    // Try partial match on city name
    const firstPart = originKey.split(",")[0].trim();
    for (const [k, v] of Object.entries(ORIGIN_PORTS)) {
      if (k.startsWith(firstPart)) { originCoord = v; break; }
    }
  }

  // Resolve destination
  const destKey = portOfEntry?.trim() ?? "king_abdulaziz_port_dammam";
  const destInfo = SAUDI_PORTS[destKey] ?? DEFAULT_SAUDI_PORT;
  const destCoord = destInfo.coord;
  const destName  = destInfo.name;

  // Fallback origin to USA West Coast if not found
  if (!originCoord) originCoord = [33.74, -118.27];

  const waypoints  = buildWaypoints(originCoord, destKey);
  const progress   = STATUS_PROGRESS[currentStatus] ?? 0;
  const shipPos    = interpolate(waypoints, progress);
  const isAtPort   = progress >= 1;

  // Split route into completed/remaining
  const completedFraction = progress;
  const completedWaypoints: LatLng[] = [];
  const remainingWaypoints: LatLng[] = [];

  // Build completed + remaining segments
  {
    const segs: number[] = [];
    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const d = Math.sqrt(
        (waypoints[i + 1][0] - waypoints[i][0]) ** 2 +
        (waypoints[i + 1][1] - waypoints[i][1]) ** 2
      );
      segs.push(d);
      total += d;
    }

    let target = completedFraction * total;
    completedWaypoints.push(waypoints[0]);
    remainingWaypoints.push(waypoints[0]);

    for (let i = 0; i < segs.length; i++) {
      if (target > 0 && target >= segs[i]) {
        completedWaypoints.push(waypoints[i + 1]);
        target -= segs[i];
      } else if (target > 0 && target < segs[i]) {
        const frac = target / segs[i];
        const mid: LatLng = [
          waypoints[i][0] + frac * (waypoints[i + 1][0] - waypoints[i][0]),
          waypoints[i][1] + frac * (waypoints[i + 1][1] - waypoints[i][1]),
        ];
        completedWaypoints.push(mid);
        remainingWaypoints.push(mid);
        for (let j = i + 1; j < waypoints.length; j++) remainingWaypoints.push(waypoints[j]);
        target = 0;
        break;
      } else {
        for (let j = i; j < waypoints.length; j++) remainingWaypoints.push(waypoints[j]);
        break;
      }
    }
    if (completedFraction >= 1) {
      remainingWaypoints.length = 0;
    }
  }

  const displayedVessel = vesselName || "Vessel";

  return (
    <div style={{ isolation: "isolate", position: "relative", zIndex: 0 }}>
    <div className="rounded-xl overflow-hidden shadow-sm border border-slate-100" style={{ height: 300 }}>
      <MapContainer
        center={shipPos}
        zoom={3}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Full route — dashed gray */}
        <Polyline
          positions={waypoints}
          pathOptions={{ color: "#cbd5e1", weight: 2, dashArray: "8 8", opacity: 0.7 }}
        />

        {/* Completed portion — solid black */}
        {completedWaypoints.length > 1 && (
          <Polyline
            positions={completedWaypoints}
            pathOptions={{ color: "#0a0a0a", weight: 3, opacity: 0.9 }}
          />
        )}

        {/* Origin marker — green */}
        <Marker position={originCoord} icon={makeCircleIcon("#22c55e")}>
          <Popup>
            <div className="font-semibold text-slate-800">Port of Origin</div>
            <div className="text-slate-500">{portOfOrigin || "—"}</div>
          </Popup>
        </Marker>

        {/* Destination marker — black */}
        <Marker position={destCoord} icon={makeCircleIcon("#0a0a0a", "#404040")}>
          <Popup>
            <div className="font-semibold text-slate-800">Destination Port</div>
            <div className="text-slate-500">{destName}</div>
          </Popup>
        </Marker>

        {/* Ship / current position marker */}
        <Marker position={shipPos} icon={makeShipIcon(isAtPort)}>
          <Popup>
            <div className="font-semibold text-slate-800">{displayedVessel}</div>
            <div className="text-slate-500 capitalize">
              {isAtPort ? "At port" : "In transit"}
            </div>
          </Popup>
        </Marker>

        <FitBounds waypoints={waypoints} />
      </MapContainer>
    </div>
    </div>
  );
}
