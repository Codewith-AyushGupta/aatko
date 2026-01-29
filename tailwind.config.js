/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Advocate Cloud Solutions Brand Colors (from logo)
        acs: {
          blue: '#004bac',      // Primary blue from logo
          navy: '#003366',      // Dark navy for backgrounds
          gray: '#6B7B8A',      // Gray from logo
          light: '#4A90D9',     // Lighter blue for hover states
        },
        // Keep sf aliases for compatibility
        sf: {
          blue: '#004bac',
          navy: '#003366',
          cloud: '#4A90D9',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
