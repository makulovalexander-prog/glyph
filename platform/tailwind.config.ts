import type { Config } from "tailwindcss";

// Tailwind drives the app *chrome* only (dashboard, buttons, layout).
// The Tessera card face is styled by hand-tuned CSS in globals.css — see invariant
// notes in src/components/TesseraCard.tsx. Do not Tailwind-ify the card face.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0E0E10",
        panel: "#161618",
        line: "#2A2A2D",
        ink: "#ECEAE3",
        soft: "#8A8880",
        accent: "#C9A876",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
      },
      boxShadow: {
        pop: "0 12px 32px rgba(0,0,0,.5)",
        modal: "0 24px 64px rgba(0,0,0,.55)",
      },
    },
  },
  plugins: [],
};

export default config;
