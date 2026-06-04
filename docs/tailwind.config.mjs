/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0B1422",
          blue: "#3b82f6",
          card: "#111C2D",
          muted: "rgba(255,255,255,0.6)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "background-shine": "background-shine 2s linear infinite",
        "border-width": "border-width 3s infinite alternate",
        "spin-slow": "spin 4s linear infinite",
        "glow-pulse": "glow-pulse 6s ease-in-out infinite alternate",
      },
      keyframes: {
        "background-shine": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "border-width": {
          from: { width: "10px", opacity: "0" },
          to: { width: "100px", opacity: "1" },
        },
        "glow-pulse": {
          "0%": { transform: "translate(0, 0) scale(1)", opacity: "0.3" },
          "100%": { transform: "translate(30px, -20px) scale(1.2)", opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
