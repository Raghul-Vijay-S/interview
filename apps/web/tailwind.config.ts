import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "Inter", "sans-serif"]
      },
      colors: {
        void: "#030712",
        primary: "#7C3AED",
        secondary: "#00E5FF",
        accent: "#22D3EE"
      },
      boxShadow: {
        neon: "0 0 42px rgba(34, 211, 238, 0.26)",
        violet: "0 0 56px rgba(124, 58, 237, 0.25)"
      },
      keyframes: {
        aurora: {
          "0%, 100%": { transform: "translate3d(-8%, -4%, 0) scale(1)", opacity: "0.72" },
          "50%": { transform: "translate3d(8%, 6%, 0) scale(1.08)", opacity: "0.95" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" }
        },
        blink: {
          "0%, 92%, 100%": { transform: "scaleY(1)" },
          "95%": { transform: "scaleY(0.12)" }
        },
        grid: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(42px)" }
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 32px rgba(34, 211, 238, 0.35)" },
          "50%": { boxShadow: "0 0 72px rgba(124, 58, 237, 0.55)" }
        }
      },
      animation: {
        aurora: "aurora 14s ease-in-out infinite",
        float: "float 5s ease-in-out infinite",
        blink: "blink 5s infinite",
        grid: "grid 2.4s linear infinite",
        pulseGlow: "pulseGlow 3s ease-in-out infinite"
      }
    }
  },
  plugins: []
} satisfies Config;
