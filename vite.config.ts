import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { runApiPlugin } from "./src/dev/runApiMiddleware";

export default defineConfig({
  plugins: [react(), runApiPlugin()],
  test: {
    css: true,
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts"
  }
});
