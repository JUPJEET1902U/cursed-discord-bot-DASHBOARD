import type { Config } from "tailwindcss";

// CURSED design tokens
// void   #0A0A0F  primary background
// ink    #131318  card / surface background
// steel  #1C1C24  raised surface / borders
// violet #7C3AED  primary accent (neon purple)
// crimson#DC143C  secondary accent (neon crimson)
// ash    #8B8B96  muted / secondary text
// fog    #E7E7EC  primary text on dark

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0A0A0F",
        ink: "#131318",
        steel: "#1C1C24",
        violet: {
          DEFAULT: "#7C3AED",
          dim: "#5B21B6",
          bright: "#A855F7",
        },
        crimson: {
          DEFAULT: "#DC143C",
          dim: "#9F0F2C",
          bright: "#FF3860",
        },
        ash: "#8B8B96",
        fog: "#E7E7EC",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "cursed-glow":
          "radial-gradient(60% 50% at 50% 0%, rgba(124,58,237,0.25) 0%, rgba(220,20,60,0.08) 45%, transparent 80%)",
        "cursed-grid":
          "linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      boxShadow: {
        "glow-violet": "0 0 40px rgba(124,58,237,0.35)",
        "glow-crimson": "0 0 40px rgba(220,20,60,0.35)",
        glass: "0 8px 32px rgba(0,0,0,0.45)",
      },
      keyframes: {
        glitch: {
          "0%, 100%": { transform: "translate(0,0)" },
          "20%": { transform: "translate(-2px,1px)" },
          "40%": { transform: "translate(2px,-1px)" },
          "60%": { transform: "translate(-1px,-1px)" },
          "80%": { transform: "translate(1px,1px)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        glitch: "glitch 0.3s ease-in-out",
        scanline: "scanline 3s linear infinite",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
