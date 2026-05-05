"use client";

// ---------------------------------------------------------------------------
// HeroJourneyVisual — SVG world map + phone mockup for hero right column
// ---------------------------------------------------------------------------

export default function HeroJourneyVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Outer frame */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          borderRadius: 28,
          background: "radial-gradient(ellipse at 60% 40%, #F7F2E8 0%, #FBFAF7 55%, #EFE7D4 100%)",
          minHeight: 640,
          boxShadow: "0 2px 0 rgba(255,255,255,0.9) inset, 0 24px 80px rgba(10,21,32,0.10), 0 4px 16px rgba(10,21,32,0.06)",
          border: "1px solid #E8ECEF",
        }}
      >
        {/* Dot-grid texture overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.35] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotgrid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#C8B89A" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotgrid)" />
        </svg>

        {/* ── SVG World Map (abstract blobs) ── */}
        <svg
          viewBox="0 0 700 420"
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.92 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Saudi glow */}
            <radialGradient id="saudiGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0a0a0a" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0" />
            </radialGradient>
            {/* Active route gradient */}
            <linearGradient id="usaRoute" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0a0a0a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0.5" />
            </linearGradient>
            {/* Continent fill */}
            <linearGradient id="landFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#DDD0BA" />
              <stop offset="100%" stopColor="#C8B89A" />
            </linearGradient>
          </defs>

          {/* Saudi Arabia glow */}
          <ellipse cx="395" cy="230" rx="72" ry="58" fill="url(#saudiGlow)" />

          {/* ── Continent blobs ── */}

          {/* USA */}
          <g>
            <ellipse cx="110" cy="185" rx="68" ry="44" fill="url(#landFill)" opacity="0.85" />
            <ellipse cx="90" cy="195" rx="22" ry="14" fill="#C8B89A" opacity="0.6" />
          </g>

          {/* UK */}
          <ellipse cx="250" cy="130" rx="22" ry="28" fill="url(#landFill)" opacity="0.75" />

          {/* Germany / Europe */}
          <g>
            <ellipse cx="295" cy="145" rx="40" ry="32" fill="url(#landFill)" opacity="0.8" />
            <ellipse cx="310" cy="158" rx="18" ry="12" fill="#C8B89A" opacity="0.5" />
          </g>

          {/* Saudi Arabia */}
          <ellipse cx="395" cy="232" rx="52" ry="38" fill="#C8C8C0" opacity="0.9" />
          <ellipse cx="398" cy="234" rx="32" ry="22" fill="#B0B0A8" opacity="0.7" />

          {/* Japan */}
          <g>
            <ellipse cx="580" cy="148" rx="18" ry="32" fill="url(#landFill)" opacity="0.78" />
            <ellipse cx="572" cy="155" rx="8" ry="14" fill="#C8B89A" opacity="0.55" />
          </g>

          {/* Korea */}
          <ellipse cx="555" cy="165" rx="14" ry="22" fill="url(#landFill)" opacity="0.72" />

          {/* ── Shipping routes (dashed) ── */}

          {/* USA → Saudi (ACTIVE) */}
          <path
            d="M 155 185 C 200 140, 290 120, 340 170 C 365 195, 380 215, 395 232"
            fill="none" stroke="#0a0a0a" strokeWidth="2.2" strokeDasharray="6 5"
            opacity="0.95"
          />
          {/* Animated dot on USA route */}
          <circle r="4.5" fill="#0a0a0a">
            <animateMotion
              dur="4s" repeatCount="indefinite"
              path="M 155 185 C 200 140, 290 120, 340 170 C 365 195, 380 215, 395 232"
            />
          </circle>
          <circle r="3" fill="white" opacity="0.8">
            <animateMotion
              dur="4s" repeatCount="indefinite" begin="0.3s"
              path="M 155 185 C 200 140, 290 120, 340 170 C 365 195, 380 215, 395 232"
            />
          </circle>

          {/* Germany → Saudi */}
          <path
            d="M 295 165 C 320 190, 355 210, 395 232"
            fill="none" stroke="#0A1520" strokeWidth="1.6" strokeDasharray="5 5"
            opacity="0.30"
          />
          <circle r="3.5" fill="#0A1520" opacity="0.4">
            <animateMotion dur="7s" repeatCount="indefinite" begin="1.2s"
              path="M 295 165 C 320 190, 355 210, 395 232" />
          </circle>

          {/* UK → Saudi */}
          <path
            d="M 255 148 C 290 175, 340 200, 395 232"
            fill="none" stroke="#0A1520" strokeWidth="1.4" strokeDasharray="5 5"
            opacity="0.22"
          />
          <circle r="3" fill="#0A1520" opacity="0.35">
            <animateMotion dur="8s" repeatCount="indefinite" begin="2.1s"
              path="M 255 148 C 290 175, 340 200, 395 232" />
          </circle>

          {/* Japan → Saudi */}
          <path
            d="M 578 165 C 540 200, 490 225, 450 230 C 430 231, 415 232, 395 232"
            fill="none" stroke="#0A1520" strokeWidth="1.6" strokeDasharray="5 5"
            opacity="0.28"
          />
          <circle r="3.5" fill="#0A1520" opacity="0.4">
            <animateMotion dur="6s" repeatCount="indefinite" begin="0.8s"
              path="M 578 165 C 540 200, 490 225, 450 230 C 430 231, 415 232, 395 232" />
          </circle>

          {/* Korea → Saudi */}
          <path
            d="M 555 178 C 520 210, 478 228, 440 231 C 420 232, 408 232, 395 232"
            fill="none" stroke="#0A1520" strokeWidth="1.4" strokeDasharray="5 5"
            opacity="0.22"
          />
          <circle r="3" fill="#0A1520" opacity="0.35">
            <animateMotion dur="9s" repeatCount="indefinite" begin="3s"
              path="M 555 178 C 520 210, 478 228, 440 231 C 420 232, 408 232, 395 232" />
          </circle>

          {/* Saudi destination pin */}
          <circle cx="395" cy="232" r="16" fill="#0a0a0a" opacity="0.10">
            <animate attributeName="r" values="14;22;14" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.10;0;0.10" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="395" cy="232" r="8" fill="#0a0a0a" opacity="0.20">
            <animate attributeName="r" values="7;12;7" dur="2.2s" repeatCount="indefinite" begin="0.4s" />
            <animate attributeName="opacity" values="0.20;0.04;0.20" dur="2.2s" repeatCount="indefinite" begin="0.4s" />
          </circle>
          <circle cx="395" cy="232" r="5" fill="#0a0a0a" />
          <circle cx="395" cy="232" r="2.5" fill="white" />
        </svg>

        {/* ── Country chips ── */}
        <div className="absolute" style={{ top: "10%", left: "9%" }}>
          <CountryChip flag="🇺🇸" name="USA" code="US" />
        </div>
        <div className="absolute" style={{ top: "17%", left: "33%" }}>
          <CountryChip flag="🇬🇧" name="UK" code="UK" />
        </div>
        <div className="absolute" style={{ top: "22%", left: "40%" }}>
          <CountryChip flag="🇩🇪" name="Germany" code="DE" />
        </div>
        <div className="absolute" style={{ top: "20%", right: "14%" }}>
          <CountryChip flag="🇯🇵" name="Japan" code="JP" />
        </div>
        <div className="absolute" style={{ top: "30%", right: "18%" }}>
          <CountryChip flag="🇰🇷" name="Korea" code="KR" />
        </div>

        {/* Saudi label */}
        <div className="absolute" style={{ top: "56%", left: "52%", transform: "translateX(-50%)" }}>
          <div className="text-center">
            <div className="text-xs font-bold text-[#0A1520] tracking-wide">Saudi Arabia</div>
            <div className="text-[9px] font-semibold text-[#5B6B7A] tracking-widest uppercase mt-0.5">
              Riyadh · Jeddah · Dammam
            </div>
          </div>
        </div>

        {/* ── Checkpoint cards ── */}
        <div className="absolute" style={{ top: "12%", left: "22%" }}>
          <CheckpointCard label="Departed Los Angeles" status="done" />
        </div>
        <div className="absolute" style={{ top: "38%", left: "42%" }}>
          <CheckpointCard label="Indian Ocean" status="active" />
        </div>
        <div className="absolute" style={{ bottom: "22%", left: "54%" }}>
          <CheckpointCard label="Jeddah Islamic Port" status="pending" />
        </div>

        {/* ── Phone mockup ── */}
        <div
          className="absolute bottom-0 left-1/2"
          style={{ transform: "translateX(-50%)", width: 210, zIndex: 10 }}
        >
          <PhoneMockup />
        </div>

        {/* ── Floating notification cards ── */}
        <div className="absolute" style={{ bottom: "28%", right: "3%" }}>
          <NotifCard
            title="Abdullah received his car"
            sub="Lexus LX 600 · 12 min ago"
            avatar="A"
          />
        </div>
        <div className="absolute" style={{ top: "8%", right: "4%" }}>
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{
              background: "white",
              boxShadow: "0 2px 12px rgba(10,21,32,0.10)",
              border: "1px solid #E8ECEF",
              minWidth: 140,
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: "linear-gradient(135deg,#34D399,#059669)" }}>
              🌐
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#0A1520]">22 countries</div>
              <div className="text-[9px] text-[#5B6B7A]">source markets</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CountryChip({ flag, name, code }: { flag: string; name: string; code: string }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{
        background: "white",
        boxShadow: "0 1px 8px rgba(10,21,32,0.10)",
        border: "1px solid #E8ECEF",
        fontSize: 11,
        whiteSpace: "nowrap",
      }}
    >
      <span className="text-sm leading-none">{flag}</span>
      <span className="font-semibold text-[#0A1520]">{name}</span>
      <span className="text-[#94A2B0] font-medium">{code}</span>
    </div>
  );
}

function CheckpointCard({ label, status }: { label: string; status: "done" | "active" | "pending" }) {
  const dot =
    status === "done"
      ? "bg-emerald-500"
      : status === "active"
      ? "bg-[#0a0a0a]"
      : "bg-[#94A2B0]";

  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 2px 10px rgba(10,21,32,0.09)",
        border: "1px solid #E8ECEF",
        fontSize: 11,
        whiteSpace: "nowrap",
      }}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`}>
        {status === "active" && (
          <span className="block w-2 h-2 rounded-full bg-[#0a0a0a] animate-ping opacity-40" />
        )}
      </span>
      <span className="font-semibold text-[#0A1520]">{label}</span>
    </div>
  );
}

function NotifCard({ title, sub, avatar }: { title: string; sub: string; avatar: string }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
      style={{
        background: "white",
        boxShadow: "0 2px 12px rgba(10,21,32,0.10)",
        border: "1px solid #E8ECEF",
        minWidth: 180,
      }}
    >
      <div className="w-8 h-8 rounded-full bg-[#0a0a0a] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
        {avatar}
      </div>
      <div>
        <div className="text-[11px] font-bold text-[#0A1520] leading-tight">{title}</div>
        <div className="text-[9px] text-[#5B6B7A] mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phone mockup — pure CSS/SVG, no image
// ---------------------------------------------------------------------------
function PhoneMockup() {
  return (
    <div
      style={{
        width: 210,
        height: 430,
        background: "#0A1520",
        borderRadius: 32,
        padding: "10px 6px 6px",
        boxShadow: "0 32px 80px rgba(10,21,32,0.40), 0 0 0 1px rgba(255,255,255,0.08) inset",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Notch */}
      <div style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
        width: 64, height: 18, background: "#0A1520", borderRadius: 10, zIndex: 10,
      }} />

      {/* Screen */}
      <div style={{
        width: "100%", height: "100%", background: "#FAFAF8",
        borderRadius: 26, overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        {/* Status bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 16px 6px", fontSize: 9, fontWeight: 600, color: "#0A1520",
        }}>
          <span>9:41</span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
              <rect x="0" y="3" width="3" height="6" rx="0.5" fill="#0A1520" opacity="0.4" />
              <rect x="4" y="2" width="3" height="7" rx="0.5" fill="#0A1520" opacity="0.6" />
              <rect x="8" y="0" width="3" height="9" rx="0.5" fill="#0A1520" />
              <rect x="12" y="1" width="2" height="7" rx="1" fill="none" stroke="#0A1520" strokeWidth="0.8" />
              <rect x="12.4" y="2.8" width="1" height="3.4" rx="0.2" fill="#0A1520" />
            </svg>
          </div>
        </div>

        {/* App header */}
        <div style={{ padding: "4px 14px 8px" }}>
          <div style={{ fontSize: 9, color: "#5B6B7A", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Tracking · IMP-2026-00142
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0A1520", marginTop: 2, lineHeight: 1.3 }}>
            2024 Toyota Land Cruiser VXR
          </div>
        </div>

        {/* Car illustration tile */}
        <div style={{
          margin: "0 10px 10px",
          borderRadius: 14,
          background: "linear-gradient(135deg, #EFE7D4 0%, #F7F2E8 100%)",
          height: 72, display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
        }}>
          <svg viewBox="0 0 140 50" width="130" height="46" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Car body */}
            <rect x="10" y="24" width="120" height="18" rx="5" fill="#C8B89A" />
            <path d="M28 24 C32 14 48 10 65 10 C82 10 98 14 112 24Z" fill="#B8A888" />
            {/* Windows */}
            <rect x="33" y="13" width="22" height="11" rx="3" fill="rgba(10,21,32,0.15)" />
            <rect x="58" y="13" width="22" height="11" rx="3" fill="rgba(10,21,32,0.15)" />
            <rect x="83" y="15" width="16" height="9" rx="2" fill="rgba(10,21,32,0.12)" />
            {/* Wheels */}
            <circle cx="38" cy="42" r="8" fill="#0A1520" />
            <circle cx="38" cy="42" r="4" fill="#C8B89A" />
            <circle cx="100" cy="42" r="8" fill="#0A1520" />
            <circle cx="100" cy="42" r="4" fill="#C8B89A" />
            {/* Headlights */}
            <rect x="124" y="28" width="6" height="5" rx="2" fill="#F5F5F5" opacity="0.9" />
            <rect x="8" y="28" width="6" height="5" rx="2" fill="#FFD700" opacity="0.7" />
          </svg>
          {/* Flag badge */}
          <div style={{
            position: "absolute", top: 6, right: 8,
            background: "rgba(255,255,255,0.8)", borderRadius: 6,
            padding: "2px 5px", fontSize: 9, fontWeight: 700, color: "#0A1520",
          }}>🇯🇵 JPN</div>
        </div>

        {/* Tracking steps */}
        <div style={{ padding: "0 14px", flex: 1 }}>
          <TrackStep
            label="Quality check in Tokyo"
            time="Jan 12, 2026"
            status="done"
            isLast={false}
          />
          <TrackStep
            label="At sea — Indian Ocean"
            time="Active now"
            status="active"
            isLast={false}
          />
          <TrackStep
            label="Jeddah Islamic Port"
            time="Est. Apr 28"
            status="pending"
            isLast={true}
          />
        </div>

        {/* Bottom CTA */}
        <div style={{
          margin: "8px 10px 10px",
          borderRadius: 14,
          background: "#0A1520",
          padding: "10px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Delivered price</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "white", marginTop: 1 }}>SAR 389,500</div>
          </div>
          <div style={{
            background: "#0a0a0a", borderRadius: 8, padding: "5px 9px",
            fontSize: 9, fontWeight: 700, color: "white",
          }}>Details →</div>
        </div>
      </div>
    </div>
  );
}

function TrackStep({
  label, time, status, isLast,
}: {
  label: string; time: string; status: "done" | "active" | "pending"; isLast: boolean;
}) {
  const dotColor =
    status === "done" ? "#22C55E" : status === "active" ? "#0a0a0a" : "#D1D5DB";
  const textColor = status === "pending" ? "#94A2B0" : "#0A1520";

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: isLast ? 0 : 4 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 14 }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%", background: dotColor, flexShrink: 0,
          marginTop: 2,
          boxShadow: status === "active" ? `0 0 0 4px ${dotColor}30` : "none",
        }} />
        {!isLast && (
          <div style={{ flex: 1, width: 1.5, background: status === "done" ? "#22C55E" : "#E8ECEF", marginTop: 2 }} />
        )}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: textColor, lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 8.5, color: "#94A2B0", marginTop: 1 }}>{time}</div>
      </div>
    </div>
  );
}
