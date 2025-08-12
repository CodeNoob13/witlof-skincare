/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./layout/*.liquid",
    "./sections/*.liquid",
    "./snippets/*.liquid",
    "./templates/*.liquid",
    "./templates/customers/*.liquid",
  ],
  theme: {
    extend: {},
  },
  important: true,
  prefix: "tw-", // This will prevent conflicts with existing classes
  plugins: [],
};
