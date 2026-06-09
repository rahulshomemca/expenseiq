import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/currency.ts",
        "src/lib/budget.ts",
        "src/lib/actions/**/*.ts",
        "src/lib/validations/**/*.ts",
      ],
      exclude: ["src/generated/**", "src/**/*.test.ts"],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
      reporter: ["text", "lcov"],
    },
    server: {
      deps: {
        // Process next-auth and @auth/* through Vite so the alias below
        // resolves "next/server" → "next/server.js" inside those packages.
        inline: ["next-auth", "@auth/core", "@auth/prisma-adapter"],
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // next-auth (ESM) imports "next/server" without an extension, which
      // Node ESM cannot resolve as a directory.  Map it to the actual file.
      "next/server": resolve(__dirname, "node_modules/next/server.js"),
    },
  },
});
