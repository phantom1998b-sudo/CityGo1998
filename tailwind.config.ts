import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./auth/**/*.html", "./admin/**/*.html", "./src/**/*.{ts,js}"],
  theme: {
    extend: {
      fontFamily: { cairo: ["Cairo", "Tajawal", "system-ui", "sans-serif"] },
      colors: {
        brand: { DEFAULT: "#0ea5e9", dark: "#0369a1" },
        surface: "#0f172a",
        card: "#1e293b",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.9rem" }],
        "xs": ["0.75rem", { lineHeight: "1.1rem" }],
        "sm": ["0.875rem", { lineHeight: "1.35rem" }],
        "base": ["1rem", { lineHeight: "1.65rem" }],
        "lg": ["1.125rem", { lineHeight: "1.85rem" }],
        "xl": ["1.25rem", { lineHeight: "2rem" }],
        "2xl": ["1.5rem", { lineHeight: "2.3rem" }],
      },
    },
  },
} satisfies Config;
