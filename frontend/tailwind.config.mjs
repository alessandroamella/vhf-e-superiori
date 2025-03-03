import withMT from "@material-tailwind/react/utils/withMT";
import flowbite from "flowbite-react/tailwind";

/** @type {import('tailwindcss').Config} */
module.exports = withMT({
    important: true,
    darkMode: "class",
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
        "node_modules/@material-tailwind/react/components/**/*.{js,ts,jsx,tsx}",
        "node_modules/@material-tailwind/react/theme/components/**/*.{js,ts,jsx,tsx}",
        flowbite.content()
    ],
    theme: {
        extend: {
            colors: {
                materialBlue: {
                    normal: "#3f83f8"
                },
                lightGray: {
                    normal: "#f7f7f7"
                }
            }
        }
    },
    plugins: [flowbite.plugin()]
});
