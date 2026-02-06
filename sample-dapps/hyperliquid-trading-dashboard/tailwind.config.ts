import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        qn: {
          // Grey scale
          "grey-50": "#F5F5F5",
          "grey-100": "#E8E8E8",
          "grey-200": "#DBDBDB",
          "grey-300": "#CCCCCC",
          "grey-400": "#BDBDBD",
          "grey-500": "#767474",
          "grey-600": "#6B605F",
          "grey-700": "#4C4848",
          "grey-800": "#292929",
          "grey-900": "#131313",
          "grey-950": "#000000",
          
          // Purple scale
          "purple-50": "#F7F5FF",
          "purple-100": "#F0EAFF",
          "purple-200": "#E7DEFF",
          "purple-300": "#CCB9F9",
          "purple-400": "#9F79FF",
          "purple-500": "#7C53EC",
          "purple-600": "#7646E7",  // QN Purple
          "purple-700": "#5A39B7",
          "purple-800": "#452C8C",
          "purple-900": "#31B93",
          "purple-950": "#2BC4F",
          
          // Lime Green scale
          "green-50": "#E3FEE4",
          "green-100": "#D1FCD4",
          "green-200": "#B2F8C2",
          "green-300": "#9DFFA3",
          "green-400": "#6CFF75",
          "green-500": "#3EE148",  // QN Green (primary)
          "green-600": "#2AC533",
          "green-700": "#209626",
          "green-800": "#1C7121",
          "green-900": "#064D11",
          "green-950": "#08360B",
          
          // Turquoise
          "turquoise": "#9CDC50",
          
          // Semantic
          "white": "#FFFFFF",
          "black": "#000000",
        }
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      borderRadius: {
        "xl": "12px",
        "2xl": "16px",
        "3xl": "20px",
        "full": "9999px"
      },
      boxShadow: {
        "sm": "0 1px 2px rgba(0, 0, 0, 0.04)",
        "md": "0 2px 8px rgba(0, 0, 0, 0.04)",
        "lg": "0 4px 16px rgba(0, 0, 0, 0.06)",
      }
    }
  },
  plugins: []
};

export default config;