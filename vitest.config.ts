import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // The vite/vitest plugin type mismatch on @vitejs/plugin-react is a known
  // upstream issue; the runtime shape is correct.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any],
  test: {
    environment: "node",
    globals: true,
    setupFiles: [],
    pool: "vmForks",
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
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
