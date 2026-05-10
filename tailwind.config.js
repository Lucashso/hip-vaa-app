/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Inter"', "sans-serif"],
        sans: ['"Inter"', '"Helvetica Neue"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        hv: {
          ink: "hsl(var(--hv-ink))",
          "ink-2": "hsl(var(--hv-ink-2))",
          navy: "hsl(var(--hv-navy))",
          blue: "hsl(var(--hv-blue))",
          cyan: "hsl(var(--hv-cyan))",
          foam: "hsl(var(--hv-foam))",
          sand: "hsl(var(--hv-sand))",
          coral: "hsl(var(--hv-coral))",
          leaf: "hsl(var(--hv-leaf))",
          amber: "hsl(var(--hv-amber))",
          text: "hsl(var(--hv-text))",
          "text-2": "hsl(var(--hv-text-2))",
          "text-3": "hsl(var(--hv-text-3))",
          surface: "hsl(var(--hv-surface))",
          line: "hsl(var(--hv-line))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
      borderRadius: {
        sm: "0.625rem",
        DEFAULT: "0.875rem",
        md: "0.875rem",
        lg: "1.375rem",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--hv-cyan) / 0.4)" },
          "50%": { boxShadow: "0 0 0 6px hsl(var(--hv-cyan) / 0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
        "slide-up": "slide-up 240ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "pulse-ring": "pulse-ring 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
