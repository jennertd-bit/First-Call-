import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--brand-primary)",
          accent: "var(--brand-accent)",
          "accent-dark": "var(--brand-accent-dark)",
        },
        navy: "var(--navy)",
        ink: "var(--ink)",
        gray: "var(--gray)",
        faint: "var(--faint)",
        teal: { DEFAULT: "var(--teal)", dark: "var(--teal-dark)" },
        amber: "var(--amber)",
        red: "var(--red)",
        paper: "var(--paper)",
        card: "var(--card)",
        wash: "var(--wash)",
      },
      borderColor: {
        line: "var(--line)",
        line2: "var(--line2)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
      },
      borderRadius: {
        card: "16px",
        control: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
