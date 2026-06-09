/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        paper: "#f7f4ff",
        ink: "#25243b",
        muted: "#746f8a",
        violetDeep: "#4b2fc9",
        violet: "#6f4df6",
        violetSoft: "#eee9ff",
        lavender: "#d9cffc",
        mint: "#c8f1df",
        mintDark: "#14965f",
        lemon: "#fff2c2",
        coral: "#ffd8cc",
        skySoft: "#dff3ff"
      }
    }
  },
  plugins: []
};
