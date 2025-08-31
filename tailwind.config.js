/** @type {import('tailwindcss').Config} */
  const plugin = require('tailwindcss/plugin');
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Perfect DOS VGA 437", system-ui, sans-serif'], // Customize sans-serif stack
        mono: ['monospace'], // Customize monospace stack
      },
    },
  },
  plugins: [
    plugin(function({ addBase }) {
          addBase({
            'html': { fontSize: '20px' },
          });
        }),
  ],
}

