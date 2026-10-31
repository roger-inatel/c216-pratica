import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("carrega a interface vazia", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Gerenciador de Itens" }),
  ).toBeVisible();
  await expect(page.getByText("Nenhum item cadastrado.")).toBeVisible();
});

test("cadastra um item e o exibe na listagem", async ({ page }) => {
  await page.getByLabel("Nome").fill("Notebook");
  await page.getByLabel("Descrição").fill("14 polegadas");
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("listitem")).toContainText("Notebook");
  await expect(page.getByRole("listitem")).toContainText("14 polegadas");
  await expect(page.getByText("Nenhum item cadastrado.")).toBeHidden();
  await expect(page.getByLabel("Nome")).toHaveValue("");
});

test("mostra erro ao enviar sem nome", async ({ page }) => {
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("alert")).toHaveText("O nome é obrigatório.");
  await expect(page.getByRole("listitem")).toHaveCount(0);
});

test("os itens somem ao recarregar a página", async ({ page }) => {
  await page.getByLabel("Nome").fill("Notebook");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(1);

  await page.reload();

  await expect(page.getByText("Nenhum item cadastrado.")).toBeVisible();
});
