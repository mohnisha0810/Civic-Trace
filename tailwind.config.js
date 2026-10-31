/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B192C',
          deep: '#071220',
          dark: '#050D17',
          surface: '#112239',
          muted: '#1E293B',
          light: '#233857',
        },
        teal: {
          DEFAULT: '#0D9488',
          deep: '#0F766E',
          hover: '#115E59',
          accent: '#14B8A6',
          light: '#CCFBF1',
          surface: '#F0FDFA',
        },
        coral: {
          DEFAULT: '#E11D48',
          hover: '#BE123C',
          light: '#FFE4E6',
        },
        forest: {
          DEFAULT: '#0F3A36',
          deep: '#0F3A36',
          hover: '#1D534D',
          dark: '#082320',
        },
        burnt: {
          DEFAULT: '#E05B2D',
          hover: '#C84C21',
          light: '#FAE7DC',
        },
        ivory: {
          DEFAULT: '#F9F6EE',
          dark: '#F0EAD6',
        },
        softwhite: '#FFFDF8',
        sage: {
          DEFAULT: '#E2EDE7',
          border: '#D0DFD7',
          dark: '#B8CEC2',
        },
        peach: '#FAE7DC',
        charcoal: {
          DEFAULT: '#1C2B29',
          muted: '#67756F',
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
