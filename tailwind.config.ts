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
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
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
        /** SaaS compacto (~6–10px), estilo painel clínico */
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(15, 23, 42, 0.045)",
        soft: "0 4px 14px rgba(15, 23, 42, 0.04)",
        lift: "0 1px 3px rgba(15, 23, 42, 0.035)",
        premium:
          "0 1px 0 rgba(15, 23, 42, 0.025), 0 1px 2px rgba(15, 23, 42, 0.03), 0 8px 24px -10px rgba(15, 23, 42, 0.07)",
        "premium-sm":
          "0 1px 0 rgba(15, 23, 42, 0.03), 0 4px 12px -6px rgba(15, 23, 42, 0.05)",
      },
      fontSize: {
        h1: ["1.5rem", { lineHeight: "1.875rem", fontWeight: "600" }], // 24px — título de página grande
        h1Bold: ["1.5rem", { lineHeight: "1.875rem", fontWeight: "700" }],
        h2: ["1.375rem", { lineHeight: "1.625rem", fontWeight: "600" }], // 22px
        h3: ["1.25rem", { lineHeight: "1.5rem", fontWeight: "600" }], // 20px
        h4: ["1.125rem", { lineHeight: "1.5rem", fontWeight: "600" }], // 18px — título de card
        h4Extra: ["1.125rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        h5: ["1.0625rem", { lineHeight: "1.375rem", fontWeight: "600" }], // 17px
        title18: ["1.125rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        title16: ["1rem", { lineHeight: "1.375rem", fontWeight: "600" }],
        title14: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "500" }],
        body16: ["0.9375rem", { lineHeight: "1.45rem", fontWeight: "400" }], // 15px
        body16Semi: ["0.9375rem", { lineHeight: "1.45rem", fontWeight: "600" }],
        body14: ["0.8125rem", { lineHeight: "1.3rem", fontWeight: "400" }], // 13px — corpo denso
        body14Semi: ["0.8125rem", { lineHeight: "1.3rem", fontWeight: "600" }],
        small12: ["0.75rem", { lineHeight: "1rem", fontWeight: "400" }], // 12px — labels
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

