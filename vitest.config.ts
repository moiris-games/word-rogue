import { defineConfig } from "vitest/config";

// The engine core is framework-free (TEC-007), so it runs in plain Node with
// no React Native transform. Component tests are out of v1 scope (TEC-056).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@engine": new URL("./lib/engine", import.meta.url).pathname,
      "@": new URL(".", import.meta.url).pathname,
    },
  },
});
