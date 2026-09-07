import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolves the `@/*` path alias from tsconfig.json.
  plugins: [tsconfigPaths()],
  test: {
    // Unit tests run in Node — we test server actions and utilities, never
    // components or React Server Components.
    environment: "node",
    include: ["src/actions/**/*.test.ts", "src/lib/**/*.test.ts"],
    clearMocks: true,
  },
});
