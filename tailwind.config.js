/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chrome': {
          blue: '#4285F4',
          red: '#EA4335',
          yellow: '#FBBC05',
          green: '#34A853',
        },
        'surface': {
          dark: '#202124',
          DEFAULT: '#292B2F',
        }
      },
      boxShadow: {
        'chrome': '0 1px 3px 0 rgb(60 64 67 / 0.3)',
      }
    },
  },
  plugins: [],
}