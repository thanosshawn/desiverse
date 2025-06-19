import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: { 
      center: true,
      padding: "1rem", 
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        '18': '4.5rem', 
      },
      fontFamily: {
        body: ['var(--font-hind)', 'sans-serif'], 
        headline: ['var(--font-baloo-bhai-2)', 'cursive'], 
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: { // Enhanced borderRadius for softer UI
        lg: 'var(--radius)', 
        md: 'calc(var(--radius) - 2px)', // Softer than before
        sm: 'calc(var(--radius) - 4px)', // Softer than before
        xl: 'calc(var(--radius) + 6px)', // More pronounced large radius
        '2xl': 'calc(var(--radius) + 12px)', // Even more
        '3xl': 'calc(var(--radius) + 20px)', // For very rounded elements like profile cards
      },
      boxShadow: { // Adding some playful shadows
        'glow-primary': '0 0 15px 2px hsl(var(--primary) / 0.5)',
        'glow-accent': '0 0 15px 2px hsl(var(--accent) / 0.4)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.07)', // Softer large shadow
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        pulseSpinner: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.95)' },
        },
        heartbeat: {
          '0%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.15)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.15)' },
          '70%': { transform: 'scale(1)' }
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "hue-rotate-glow": {
          "0%": { filter: "hue-rotate(0deg) drop-shadow(0 0 5px hsl(var(--primary)))" },
          "50%": { filter: "hue-rotate(15deg) drop-shadow(0 0 10px hsl(var(--primary)))" },
          "100%": { filter: "hue-rotate(0deg) drop-shadow(0 0 5px hsl(var(--primary)))" },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.3s ease-out',
        'accordion-up': 'accordion-up 0.3s ease-out',
        'pulse-spinner': 'pulseSpinner 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1.2s ease-in-out infinite',
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-out": "fade-out 0.5s ease-in forwards",
        "slide-in-from-bottom": "slide-in-from-bottom 0.6s ease-out forwards",
        "hue-rotate-glow": "hue-rotate-glow 3s ease-in-out infinite",
      },
      backgroundImage: { // Adding gradients for playful touches
        'gradient-primary-accent': 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))',
        'gradient-secondary-muted': 'linear-gradient(to right, hsl(var(--secondary)), hsl(var(--muted)))',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
