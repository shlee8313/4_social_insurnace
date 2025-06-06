// File: postcss.config.js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // tailwindcss: {},
    "@tailwindcss/postcss": {}, // This is the crucial line
    autoprefixer: {},
  },
};

module.exports = config;
