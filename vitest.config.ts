import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // The vite/vitest plugin type mismatch on @vitejs/plugin-react is a known
  // upstream issue; the runtime shape is correct.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any],
  test: {
    environment: "node",
    globals: true,
    setupFiles: [],
    // Vitest 5 forces `isolate: false` for vmForks, which lets module mocks
    // leak between files. The forks pool preserves file-level isolation.
    pool: "forks",
    teardownTimeout: 5000,
    include: ["tests/**/*.test.ts", "scripts/__tests__/**/*.test.ts"],
    watch: false,
    fileParallelism: false,
    server: {
      deps: {
        inline: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(configDir, "./src"),
    },
  },
});
