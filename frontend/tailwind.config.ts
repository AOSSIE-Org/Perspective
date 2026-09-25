import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./i18n/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      maxWidth: {
        '150': '37.5rem',
      },
      colors: {
        background: {
          DEFAULT: "var(--background)",
          secondary: "var(--background-secondary)",
        },
        foreground: {
          DEFAULT: "var(--foreground)",
          muted: "var(--foreground-muted)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
          border: "var(--card-border)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        border: "var(--border)",
        input: {
          DEFAULT: "var(--input)",
          bg: "var(--input-bg)",
        },
        ring: "var(--ring)",
        guide: {
          border: "var(--guide-border)",
          bg: "var(--guide-bg)",
          pointer: "var(--guide-pointer)",
        },
        topic: {
          border: "var(--topic-border)",
          "border-soft": "var(--topic-border-soft)",
          "border-soft-hover": "var(--topic-border-soft-hover)",
          bg: "var(--topic-bg)",
        },
        search: {
          bg: "var(--search-bg)",
          border: "var(--search-border)",
          placeholder: "var(--search-placeholder)",
        },
        brand: {
          border: "var(--brand-border)",
        },
        nav: {
          muted: "var(--nav-muted)",
        },
        pulse: {
          ping: "var(--pulse-ping)",
          dot: "var(--pulse-dot)",
        },
        ticker: {
          bg: "var(--ticker-bg)",
          text: "var(--ticker-text)",
          star: "var(--ticker-star)",
        },
        switcher: {
          bg: "var(--switcher-bg)",
          hover: "var(--switcher-hover)",
        },
        hover: "var(--hover)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out"
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
