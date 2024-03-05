const withMT = require("@material-tailwind/react/utils/withMT");

/** @type {import('tailwindcss').Config} */
module.exports = withMT({
  important: true,
  darkMode: "media",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        materialBlue: {
          normal: "rgb(63 131 248)"
        },
        lightGray: {
          normal: "#f7f7f7"
        }
      }
    }
  },
  plugins: [require("flowbite/plugin"), require("@tailwindcss/line-clamp")]
});
