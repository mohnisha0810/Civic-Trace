/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Official CivicTrace Logo Color Palette
        navy: {
          DEFAULT: '#103533', // Deep Logo Forest Spruce Teal
          deep: '#0A2322',    // Deepest Spruce
          dark: '#071918',    // Near-black Spruce
          surface: '#164240', // Elevated Spruce Surface
          muted: '#23534F',   // Muted Spruce
          light: '#2E6864',   // Light Spruce Accent
        },
        spruce: {
          DEFAULT: '#103533',
          deep: '#0A2322',
          dark: '#071918',
          surface: '#164240',
          muted: '#23534F',
          light: '#EBF2F1',
          border: '#D0DFD7',
        },
        terracotta: {
          DEFAULT: '#D86230', // Vibrant Logo Civic Orange / Terracotta
          hover: '#C15324',
          dark: '#B0481B',
          surface: '#FDF1EB',
          light: '#FAE7DC',
          border: '#F6CEBF',
          accent: '#E66E3C',
        },
        teal: {
          DEFAULT: '#164E4A',
          deep: '#103533',
          hover: '#0D2E2C',
          accent: '#D86230',
          light: '#EBF2F1',
          surface: '#F5F9F8',
        },
        coral: {
          DEFAULT: '#D86230',
          hover: '#C15324',
          light: '#FDF1EB',
        },
        forest: {
          DEFAULT: '#103533',
          deep: '#0A2322',
          hover: '#164240',
          dark: '#071918',
        },
        burnt: {
          DEFAULT: '#D86230',
          hover: '#C15324',
          light: '#FDF1EB',
        },
        ivory: {
          DEFAULT: '#FAF7EF', // Warm Logo Canvas
          canvas: '#FAF7EF',
          card: '#FFFFFF',
          subtle: '#F3EFE6',
          border: '#E7E1D4',
          dark: '#EFEAE0',
        },
        softwhite: '#FFFDF8',
        sage: {
          DEFAULT: '#E2EDE7',
          border: '#D0DFD7',
          dark: '#B8CEC2',
        },
        peach: '#FDF1EB',
        charcoal: {
          DEFAULT: '#103533',
          muted: '#526865',
        },
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 58, 54, 0.04), 0 1px 2px -1px rgba(15, 58, 54, 0.04)',
        'card': '0 2px 8px -2px rgba(15, 58, 54, 0.06), 0 1px 4px -1px rgba(15, 58, 54, 0.04)',
        'elevated': '0 12px 32px -8px rgba(15, 58, 54, 0.12), 0 4px 12px -2px rgba(15, 58, 54, 0.06)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
