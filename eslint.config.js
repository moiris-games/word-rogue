const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

// The engine core: framework-free TypeScript that must run identically
// under Hermes, under Node in tools/, and in the test runner (TEC-007).
const ENGINE_CORE = ["lib/engine/**", "lib/run/**", "lib/rng/**"];

// Direction-relative layout only, outside the explicitly-LTR islands
// and the i18n helpers themselves (TEC-063).
const PHYSICAL_EDGE_PROPS = [
  "marginLeft",
  "marginRight",
  "paddingLeft",
  "paddingRight",
  "borderLeftWidth",
  "borderRightWidth",
  "left",
  "right",
];

module.exports = defineConfig([
  expoConfig,

  { ignores: ["dist/*", "android/*", "ios/*", ".expo/*"] },

  // ---- TEC-010: all randomness comes from the seeded streams in lib/rng.
  {
    files: ["**/*.{js,ts,tsx}"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message:
            "TEC-010: use a named seeded stream from lib/rng. Math.random() makes runs unreplayable.",
        },
      ],
    },
  },

  // ---- TEC-007 / TEC-008 / TEC-026: engine core purity.
  {
    files: ENGINE_CORE,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react/*",
                "react-native",
                "react-native/*",
                "react-native-*",
                "expo",
                "expo-*",
                "@expo/*",
                "@react-native-*",
                "@tanstack/*",
                "node:*",
                "fs",
                "path",
                "crypto",
                "os",
                "process",
              ],
              message:
                "TEC-007: the engine core imports no framework and no Node built-in. It must run unchanged under Hermes, Node and Vitest.",
            },
            {
              group: ["../../*"],
              message:
                "TEC-008: use the @/ or @engine/ alias instead of reaching across top-level folders.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        {
          name: "Intl",
          message:
            "TEC-026: locale-dependent APIs are non-deterministic across platforms.",
        },
        {
          name: "Date",
          message:
            "TEC-026 / ENG-004: the engine reads no wall-clock time. Pass any needed value in.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[property.name=/^(toLocaleString|toLocaleDateString|toLocaleTimeString|localeCompare)$/]",
          message:
            "TEC-026: locale-dependent formatting and collation are non-deterministic.",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/ban-ts-comment": "error",
    },
  },

  // ---- TEC-063: no physical edges in screen or component styles.
  {
    files: ["app/**/*.tsx", "components/**/*.tsx"],
    ignores: ["components/ltr/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Property[key.name=/^(${PHYSICAL_EDGE_PROPS.join("|")})$/]`,
          message:
            "TEC-063: use the direction-relative property (marginStart, paddingEnd, start, end). Physical edges do not mirror under RTL.",
        },
      ],
    },
  },
]);
