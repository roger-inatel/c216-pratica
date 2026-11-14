import { defineConfig, devices } from "@playwright/test";

// Os testes rodam contra a aplicacao inteira no ar (make docker-up), e nao
// contra um Vite isolado: e o que prova a integracao com a API e o banco.
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./tests/e2e",
  // Os testes dividem o mesmo banco; um de cada vez evita um apagar o item do outro.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
