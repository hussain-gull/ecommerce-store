import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // React-compiler checks flag a few pre-existing patterns; surfaced as
      // warnings until those components are refactored.
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // shadcn/ui primitives and the data table export variants/helpers next to
    // components by design; fast-refresh granularity isn't worth splitting them.
    files: ["src/components/ui/**", "src/components/data-table.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },
]);
