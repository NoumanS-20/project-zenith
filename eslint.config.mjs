import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated / vendored assets that must never be linted (Cesium build is
    // tens of MB of minified JS and OOMs ESLint).
    "public/**",
    "test-results/**",
    "playwright-report/**",
    "coverage/**",
  ]),
  {
    rules: {
      // We intentionally read wall-clock time (Date.now()) during render for
      // live telemetry ages, time-machine buckets, and "now"-based pass
      // predictions. The React Compiler is not enabled, so this purity rule
      // (new in the Next 16 config) produces false positives here.
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
