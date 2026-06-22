import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutral base — warm off-white to near-black
        sage: {
          50: "#f6f7f6",
          100: "#e3e7e3",
          200: "#c7d0c7",
          300: "#a3b1a3",
          400: "#7d8f7d",
          500: "#617361",
          600: "#4d5c4d",
          700: "#404b40",
          800: "#363f36",
          900: "#2d352d",
          950: "#1a1f1a",
        },
        forest: {
          DEFAULT: "#2d5a3d",
          50: "#f0f7f2",
          100: "#dbeddf",
          200: "#b9dbc3",
          300: "#8cc29d",
          400: "#5da374",
          500: "#3d8556",
          600: "#2d5a3d",
          700: "#264d34",
          800: "#213e2b",
          900: "#1c3425",
          950: "#0e1d14",
        },
        // Primary brand — monochrome (replaces teal/cyan)
        accent: {
          DEFAULT: "#0a0a0a",
          50:  "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#0a0a0a",
        },
        // WARED brand tokens
        brand: {
          DEFAULT: "#0a0a0a",
          hover: "#1a1a1a",
          silver: {
            light: "#c0c0c0",
            dark: "#808080",
          },
        },
        // Warm gold — premium/Saudi accent
        gold: {
          DEFAULT: "#C9973A",
          50:  "#FDF6E7",
          100: "#FAE9C3",
          200: "#F5D48A",
          300: "#F0C86A",
          400: "#D4A843",
          500: "#C9973A",
          600: "#B07F2A",
          700: "#8C641E",
          800: "#6A4A14",
          900: "#4A3309",
        },
        // Ink — rich near-black for text
        ink: {
          DEFAULT: "#0D1117",
          50:  "#F5F6F7",
          100: "#E8EAED",
          200: "#C9CDD2",
          300: "#9AA0A9",
          400: "#6B7380",
          500: "#4A5260",
          600: "#2D3748",
          700: "#1A2333",
          800: "#111827",
          900: "#0D1117",
          950: "#060A0F",
        },
        // Keep navy as alias for backward compat
        navy: {
          50: "#f6f7f6",
          100: "#e3e7e3",
          200: "#c7d0c7",
          300: "#a3b1a3",
          400: "#7d8f7d",
          500: "#617361",
          600: "#4d5c4d",
          700: "#404b40",
          800: "#363f36",
          900: "#2d352d",
          950: "#1a1f1a",
        },
      },
      fontFamily: {
        sans:    ["var(--font-body)", "Outfit", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Bricolage Grotesque", "system-ui", "sans-serif"],
        geist:   ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono:    ["monospace"],
        arabic:  ["Tajawal", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card:       "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 6px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.12)",
        "card-elevated": "0 4px 6px rgba(0,0,0,0.05), 0 20px 48px rgba(0,0,0,0.14)",
        accent:     "0 8px 32px rgba(0, 0, 0, 0.20)",
        "accent-sm": "0 4px 16px rgba(0, 0, 0, 0.12)",
        gold:       "0 8px 32px rgba(201, 151, 58, 0.25)",
        "gold-sm":  "0 4px 16px rgba(201, 151, 58, 0.18)",
        inner:      "inset 0 2px 6px rgba(0,0,0,0.06)",
        "inner-sm": "inset 0 1px 3px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        "2.5xl": "20px",
        "3xl":   "24px",
        "4xl":   "32px",
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight:   "-0.02em",
        normal:  "0",
        wide:    "0.03em",
        wider:   "0.06em",
        widest:  "0.12em",
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(ellipse 80% 60% at 20% 40%, rgba(0,0,0,0.04) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(201,151,58,0.12) 0%, transparent 55%), linear-gradient(160deg, #0D1117 0%, #161B22 100%)",
        "card-shimmer":
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
        "gold-shine":
          "linear-gradient(135deg, #C9973A 0%, #F0C86A 50%, #C9973A 100%)",
        "silver-shine":
          "linear-gradient(135deg, #c0c0c0 0%, #808080 50%, #c0c0c0 100%)",
      },
      animation: {
        "float":      "float 4s ease-in-out infinite",
        "spin-slow":  "spin 12s linear infinite",
        "reveal":     "reveal 0.6s cubic-bezier(0.32,0,0.16,1) both",
        "scale-in":   "scale-in 0.35s cubic-bezier(0.32,0,0.16,1) both",
        "shimmer":    "shimmer 1.4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        reveal: {
          from: { opacity: "0", transform: "translateY(32px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.92)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          from: { backgroundPosition: "-400px 0" },
          to:   { backgroundPosition: "400px 0" },
        },
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.32, 0, 0.16, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
