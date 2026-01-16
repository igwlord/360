/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tilo Theme (Default)
        tilo: {
          bg: "#AEB8A8",
          card: "#80917D",
          accent: "#EEA83B",
        },
        // Deep Theme (Dark)
        deep: {
          bg: "#0f172a",
          card: "#1e293b",
          accent: "#FCA311",
        },
        // Lirio Theme (High Contrast)
        lirio: {
          bg: "#E6DCD3",
          card: "#58181F",
          accent: "#D4AF37",
        },
      },
    },
  },
  plugins: [],
};
