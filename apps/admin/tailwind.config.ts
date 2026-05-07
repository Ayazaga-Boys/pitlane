import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "pit-red": "#E63946",
        "pit-red-deep": "#B72836",
        "pit-red-soft": "#FFD9DC",
        "surface-0": "#0F0F1A",
        "surface-1": "#1A1A2E",
        "surface-2": "#16213E",
        "surface-3": "#1F2A4A",
        "surface-overlay": "rgba(15,15,26,0.65)",
        "text-primary": "#FFFFFF",
        "text-secondary": "#B0B0B0",
        "text-tertiary": "#6B6B7B",
        "text-on-brand": "#FFFFFF",
        success: "#06D6A0",
        warning: "#FFB703",
        error: "#EF476F",
        info: "#4CC9F0",
      },
      spacing: {
        "2xs": "0.125rem",
        xs: "0.25rem",
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
        "3xl": "3rem",
      },
      borderRadius: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        pill: "999px",
      },
      boxShadow: {
        "elev-1": "0 1px 2px rgba(0,0,0,0.20)",
        "elev-2": "0 4px 8px rgba(0,0,0,0.25)",
        "elev-3": "0 8px 16px rgba(0,0,0,0.30)",
        "elev-pin": "0 2px 6px rgba(230,57,70,0.40)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        "panel-grid":
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
