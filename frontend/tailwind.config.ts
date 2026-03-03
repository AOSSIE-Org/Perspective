import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          blue: "#2B75FF",
          dark: "#0E34BD",
          darker: "#041EA7",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom Perspective Colors
        "background-dark": "#0B0F16",
        "background-card": "#1B1F24",
        "background-button": "#232830",
        "border-light": "rgba(255, 255, 255, 0.2)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "22.339px",
        button: "15px",
        search: "40px",
        nav: "30px",
      },
      fontFamily: {
        sora: ["Sora", "sans-serif"],
      },
      fontSize: {
        hero: "64px",
        section: "40px",
        subsection: "32px",
        card: "14.361px",
        body: "16px",
        small: "11.967px",
      },
      letterSpacing: {
        tight: "-1.8px",
        tighter: "-1.2px",
        normal: "0",
      },
      boxShadow: {
        card: "inset -3.989px -7.18px 8.776px 0px rgba(0,0,0,0.15), inset 0.798px 0.798px 0.798px 0px rgba(255,255,255,0.1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "landing-page": "radial-gradient(106.64% 52.61% at 50% 1.95%, #2B75FF 0%, rgba(43, 117, 255, 0.85) 38.18%, rgba(4, 30, 167, 0.95) 65.11%, #0B0F16 100%)",
        "hero-gradient":
          "url('data:image/svg+xml;utf8,<svg viewBox=\"0 0 1440 2048\" xmlns=\"http://www.w3.org/2000/svg\" preserveAspectRatio=\"none\"><rect x=\"0\" y=\"0\" height=\"100%\" width=\"100%\" fill=\"url(%23grad)\" opacity=\"1\"/><defs><radialGradient id=\"grad\" gradientUnits=\"userSpaceOnUse\" cx=\"0\" cy=\"0\" r=\"10\" gradientTransform=\"matrix(-0.0000044459 107.75 -153.56 -0.0000063361 720 40)\"><stop stop-color=\"rgba(43,117,255,1)\" offset=\"0\"/><stop stop-color=\"rgba(43,117,255,0.85)\" offset=\"0.38183\"/><stop stop-color=\"rgba(24,74,211,0.9)\" offset=\"0.51648\"/><stop stop-color=\"rgba(14,52,189,0.925)\" offset=\"0.58381\"/><stop stop-color=\"rgba(4,30,167,0.95)\" offset=\"0.65113\"/><stop stop-color=\"rgba(6,26,131,0.9625)\" offset=\"0.73835\"/><stop stop-color=\"rgba(8,23,95,0.975)\" offset=\"0.82557\"/><stop stop-color=\"rgba(9,19,58,0.9875)\" offset=\"0.91278\"/><stop stop-color=\"rgba(10,17,40,0.99375)\" offset=\"0.95639\"/><stop stop-color=\"rgba(11,15,22,1)\" offset=\"1\"/></radialGradient></defs></svg>')",
        "card-gradient":
          "linear-gradient(146.985deg, rgb(36, 41, 48) 2.1855%, rgb(19, 24, 31) 92.514%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
