
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
      borderRadius: { 
        lg: 'var(--radius)', 
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)', 
        '2xl': 'calc(var(--radius) + 8px)', 
        '3xl': 'calc(var(--radius) + 16px)', 
      },
      boxShadow: { 
        'glow-primary': '0 0 18px 3px hsl(var(--primary) / 0.55)', /* Increased intensity for dark theme */
        'glow-accent': '0 0 18px 3px hsl(var(--accent) / 0.45)', /* Increased intensity */
        'soft-lg': '0 8px 16px -4px rgba(0, 0, 0, 0.2), 0 3px 6px -3px rgba(0, 0, 0, 0.2)', /* Adjusted for dark theme visibility */
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
          '50%': { opacity: '0.6', transform: 'scale(0.95)' }, /* Adjusted for dark */
        },
        heartbeat: {
          '0%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.2)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.2)' },
          '70%': { transform: 'scale(1)' }
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(25px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "hue-rotate-glow": { /* Adjusted for more visible glow on dark */
          "0%": { filter: "hue-rotate(0deg) drop-shadow(0 0 8px hsl(var(--primary) / 0.7))" },
          "50%": { filter: "hue-rotate(12deg) drop-shadow(0 0 14px hsl(var(--primary) / 0.8))" },
          "100%": { filter: "hue-rotate(0deg) drop-shadow(0 0 8px hsl(var(--primary) / 0.7))" },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.25s ease-out',
        'accordion-up': 'accordion-up 0.25s ease-out',
        'pulse-spinner': 'pulseSpinner 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1.1s ease-in-out infinite',
        "fade-in": "fade-in 0.4s ease-out forwards",
        "fade-out": "fade-out 0.4s ease-in forwards",
        "slide-in-from-bottom": "slide-in-from-bottom 0.5s ease-out forwards",
        "hue-rotate-glow": "hue-rotate-glow 2.5s ease-in-out infinite",
      },
      backgroundImage: { 
        'gradient-primary-accent': 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))',
        'gradient-secondary-muted': 'linear-gradient(to right, hsl(var(--secondary)), hsl(var(--muted)))',
        'gradient-header': 'linear-gradient(110deg, hsl(var(--primary) / 0.85) 0%, hsl(var(--secondary) / 0.85) 50%, hsl(var(--accent) / 0.85) 100%)', /* Darker, richer gradient for header on black theme */
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
