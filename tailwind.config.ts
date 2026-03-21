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
        card: "0 12px 40px rgba(15, 23, 42, 0.07)",
        soft: "0 8px 24px rgba(15, 23, 42, 0.06)",
        lift: "0 2px 8px rgba(15, 23, 42, 0.04)",
        premium:
          "0 1px 0 rgba(15, 23, 42, 0.04), 0 4px 6px -2px rgba(15, 23, 42, 0.04), 0 22px 56px -18px rgba(15, 23, 42, 0.14)",
        "premium-sm": "0 1px 0 rgba(15, 23, 42, 0.05), 0 12px 32px -14px rgba(15, 23, 42, 0.1)",
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
      keyframes: {
        "login-enter": {
          "0%": { opacity: "0", transform: "translateY(22px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "login-shimmer": {
          "0%, 100%": { opacity: "0.2", transform: "translateX(-30%) skewX(-15deg)" },
          "50%": { opacity: "0.45", transform: "translateX(50%) skewX(-15deg)" },
        },
        "login-orb": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(5%, -5%) scale(1.06)" },
          "66%": { transform: "translate(-4%, 4%) scale(0.94)" },
        },
      },
      animation: {
        "login-enter": "login-enter 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
        "login-shimmer": "login-shimmer 10s ease-in-out infinite",
        "login-orb": "login-orb 20s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

