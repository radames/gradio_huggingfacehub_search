const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
export default {
  important: ".custom-component",
  // content: ["./**/*.{html,js,svelte,ts}"],

  content: ["./src/**/*.{html,js,svelte,ts}", "./*.{html,js,svelte,ts}"],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem" },
    },
    extend: {
      zIndex: {
        100: "100",
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "spin-slower": "spin 5s linear infinite",
      },
      colors: {
        green: colors.emerald,
        yellow: colors.amber,
        purple: colors.violet,
        gray: {
          350: "#b3bcc9",

          850: "#141c2e",
          925: "#101623",
          950: "#0b0f19",
        },
      },
      maxWidth: {
        "2xs": "16rem",
      },
      gridTemplateRows: {
        full: "100%",
      },
      fontFamily: {
        sans: ["Source Sans Pro", ...defaultTheme.fontFamily.sans],
        mono: ["IBM Plex Mono", ...defaultTheme.fontFamily.mono],
        serif: ["Charter", ...defaultTheme.fontFamily.serif],
      },
      fontSize: {
        smd: "0.94rem",
      },
      typography: (theme) => ({
        light: {
          css: [
            {
              color: theme("colors.gray.350"),
              '[class~="lead"]': {
                color: theme("colors.gray.300"),
              },
              a: {
                color: theme("colors.gray.300"),
              },
              strong: {
                color: theme("colors.gray.300"),
              },
              "ol > li::before": {
                color: theme("colors.gray.400"),
              },
              "ul > li::before": {
                backgroundColor: theme("colors.gray.600"),
              },
              hr: {
                borderColor: theme("colors.gray.200"),
              },
              blockquote: {
                color: theme("colors.gray.200"),
                borderLeftColor: theme("colors.gray.600"),
              },
              h1: {
                color: theme("colors.gray.200"),
              },
              h2: {
                color: theme("colors.gray.200"),
              },
              h3: {
                color: theme("colors.gray.200"),
              },
              h4: {
                color: theme("colors.gray.200"),
              },
              "figure figcaption": {
                color: theme("colors.gray.400"),
              },
              code: {
                color: theme("colors.gray.300"),
              },
              "a code": {
                color: theme("colors.gray.300"),
              },
              pre: {
                color: theme("colors.gray.300"),
                backgroundColor: theme("colors.gray.925"),
              },
              thead: {
                color: theme("colors.gray.200"),
                borderBottomColor: theme("colors.gray.400"),
              },
              th: {
                color: theme("colors.gray.300"),
              },
              "tbody tr": {
                borderBottomColor: theme("colors.gray.600"),
              },
            },
          ],
        },
        DEFAULT: {
          css: {
            color: colors.gray[600],
            maxWidth: "100%",
            fontSize: "1.05rem",
            h1: {
              fontSize: "1.25rem",
              color: theme("colors.gray.700"),
              marginBottom: "1.7rem",
              fontWeight: 600,
            },
            h2: {
              fontSize: "1.16rem",
              color: theme("colors.gray.700"),
              marginBottom: "1.45rem",
              fontWeight: 600,
            },

            h3: {
              fontSize: "1.10rem",
              color: theme("colors.gray.700"),
              marginBottom: "1.3rem",
              fontWeight: 600,
            },
            h4: {
              fontSize: "1.05rem",
              color: theme("colors.gray.700"),
              marginBottom: "1.2rem",
              fontWeight: 600,
            },
            pre: {
              color: "currentColor",
              backgroundColor: theme("colors.gray.50"),
            },
          },
        },
      }),
      zIndex: {
        5: "5",
        2: "2",
        1: "1",
        "-1": "-1",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "base",
    }),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
