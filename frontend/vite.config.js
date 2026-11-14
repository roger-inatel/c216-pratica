import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// No Git Bash, /r/... chega ao Node como "r:\" minusculo e o Vitest carrega a si
// mesmo duas vezes ("failed to find the current suite"). A letra maiuscula evita isso.
const root = fileURLToPath(new URL(".", import.meta.url)).replace(
  /^[a-z]:/,
  (drive) => drive.toUpperCase(),
);

export default defineConfig({
  root,
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    include: [
      "tests/unit/**/*.test.{js,jsx}",
      "tests/integration/**/*.test.{js,jsx}",
    ],
  },
});
