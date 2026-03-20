import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--color-primary))",
          foreground: "rgb(var(--color-on-primary))",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary))",
          foreground: "rgb(var(--color-on-secondary))",
        },
        yellow: "rgb(var(--color-yellow))",
        orange: "rgb(var(--color-orange))",
        neutral: {
          50: "rgb(var(--color-neutral-50))",
          100: "rgb(var(--color-neutral-100))",
          200: "rgb(var(--color-neutral-200))",
          300: "rgb(var(--color-neutral-300))",
          400: "rgb(var(--color-neutral-400))",
          500: "rgb(var(--color-neutral-500))",
          600: "rgb(var(--color-neutral-600))",
          700: "rgb(var(--color-neutral-700))",
          800: "rgb(var(--color-neutral-800))",
          900: "rgb(var(--color-neutral-900))",
        },
        bg: {
          0: "rgb(var(--color-bg-0))",
          1: "rgb(var(--color-bg-1))",
          2: "rgb(var(--color-bg-2))",
        },
        text: {
          primary: "rgb(var(--color-text-primary))",
          secondary: "rgb(var(--color-text-secondary))",
          muted: "rgb(var(--color-text-muted))",
        },
        ring: "rgb(var(--color-ring))",
      },
      borderRadius: {
        sm: "10px",
        md: "14px",
        lg: "16px",
        xl: "22px",
      },
      boxShadow: {
        card: "0 10px 30px rgba(16, 24, 40, 0.06)",
        soft: "0 6px 18px rgba(16, 24, 40, 0.06)",
      },
      fontSize: {
        h1: ["2rem", { lineHeight: "2.25rem", fontWeight: "600" }], // 32px
        h1Bold: ["2rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        h2: ["1.75rem", { lineHeight: "2.125rem", fontWeight: "700" }], // 28px
        h3: ["1.625rem", { lineHeight: "2rem", fontWeight: "700" }], // 26px
        h4: ["1.5rem", { lineHeight: "1.875rem", fontWeight: "700" }], // 24px
        h4Extra: ["1.5rem", { lineHeight: "1.875rem", fontWeight: "800" }],
        h5: ["1.375rem", { lineHeight: "1.75rem", fontWeight: "700" }], // 22px
        title18: ["1.125rem", { lineHeight: "1.5rem", fontWeight: "600" }], // 18px
        title16: ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }], // 16px
        title14: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "600" }], // 14px
        body16: ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        body16Semi: ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        body14: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "400" }],
        body14Semi: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "600" }],
        small12: ["0.75rem", { lineHeight: "1rem", fontWeight: "400" }],
      },
      ringColor: {
        DEFAULT: "rgb(var(--color-ring))",
      },
    },
  },
  plugins: [],
};

export default config;

