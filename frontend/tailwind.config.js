/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066CC',
          50: '#E6F0FF',
          100: '#CCE0FF',
          200: '#99C2FF',
          300: '#66A3FF',
          400: '#3385FF',
          500: '#0066CC',
          600: '#0052A3',
          700: '#003D7A',
          800: '#002952',
          900: '#001429',
        },
        secondary: {
          DEFAULT: '#00A86B',
          50: '#E6F7F0',
          100: '#CCEFE0',
          200: '#99DFC2',
          300: '#66CFA3',
          400: '#33BF85',
          500: '#00A86B',
          600: '#008656',
          700: '#006540',
          800: '#00432B',
          900: '#002215',
        },
        accent: {
          DEFAULT: '#FF6B35',
          50: '#FFE9E1',
          100: '#FFD3C3',
          200: '#FFA788',
          300: '#FF7B4C',
          400: '#FF6B35',
          500: '#FF4F1A',
          600: '#E63E0F',
          700: '#B3300B',
          800: '#802208',
          900: '#4D1504',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
