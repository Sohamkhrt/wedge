/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Signal-box paintwork: the room is green, plates are enamel cream.
        box: {
          950: "#0E1F16",
          900: "#132A1E",
          800: "#1A3326",
          700: "#24432F",
          600: "#2F5240",
          500: "#4A6D58",
        },
        enamel: {
          DEFAULT: "#F1E9D2",
          dim: "#CFC6AC",
          deep: "#E2D7B8",
          ink: "#16241B",
          soft: "#45503F",
        },
        // Aspects. Red = danger / stop, amber = caution, lamp = clear.
        aspect: {
          red: "#D7261E",
          redlit: "#FF4A3D",
          amber: "#E8B21A",
          lamp: "#3FD08A",
        },
        lever: {
          black: "#151815",
          blue: "#2A4C9C",
        },
      },
      fontFamily: {
        sign: ['"Big Shoulders Display"', '"Archivo"', "sans-serif"],
        sans: ['"Archivo"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        plate: "0 6px 14px -6px rgba(0,0,0,0.55)",
        lamp: "0 0 0 2px rgba(0,0,0,0.35) inset, 0 0 18px 2px currentColor",
        well: "0 2px 6px rgba(0,0,0,0.45) inset",
      },
      keyframes: {
        slidein: { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        rise: { from: { opacity: "0.001", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        blink: { "0%,55%": { opacity: "1" }, "56%,100%": { opacity: "0.25" } },
      },
      animation: {
        slidein: "slidein 260ms cubic-bezier(0.16,1,0.3,1)",
        rise: "rise 420ms cubic-bezier(0.16,1,0.3,1) both",
        blink: "blink 1.1s steps(1,end) infinite",
      },
    },
  },
  plugins: [],
};
