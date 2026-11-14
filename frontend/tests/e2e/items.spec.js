import { expect, test } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000";

// Nomes unicos por execucao: o banco e o mesmo da aplicacao e o nome e unico.
const prefixo = `e2e-${Date.now()}`;
let contador = 0;
function nomeUnico(base) {
  contador += 1;
  return `${prefixo}-${contador} ${base}`;
}

function linhaDoItem(page, nome) {
  return page.getByRole("listitem").filter({ hasText: nome });
}

async function cadastrar(page, nome, descricao = "") {
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("Descrição").fill(descricao);
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(linhaDoItem(page, nome)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Carregando itens...")).toBeHidden();
});

// Apaga pela API o que estes testes criaram, para nao acumular no banco.
test.afterEach(async ({ request }) => {
  const resposta = await request.get(`${API_URL}/items?limit=100`);
  const itens = await resposta.json();
  for (const item of itens.filter((i) => i.name.startsWith(prefixo))) {
    await request.delete(`${API_URL}/items/${item.id}`);
  }
});

test("carrega a lista da API sem erro de conexão ou de CORS", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "Gerenciador de Itens" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("cadastra um item e ele continua lá depois de recarregar", async ({
  page,
}) => {
  const nome = nomeUnico("Notebook");

  await cadastrar(page, nome, "14 polegadas");
  await page.reload();

  await expect(linhaDoItem(page, nome)).toContainText("14 polegadas");
});

test("mostra o erro da API ao repetir um nome", async ({ page }) => {
  const nome = nomeUnico("Mouse");
  await cadastrar(page, nome);

  await page.getByLabel("Nome").fill(nome);
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "Já existe um item com esse nome.",
  );
  await expect(linhaDoItem(page, nome)).toHaveCount(1);
});

test("valida o nome antes de chamar a API", async ({ page }) => {
  let chamouApi = false;
  page.on("request", (req) => {
    if (req.method() === "POST") chamouApi = true;
  });

  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("alert")).toHaveText("O nome é obrigatório.");
  expect(chamouApi).toBe(false);
});

test("edita um item e a alteração fica salva", async ({ page }) => {
  const nome = nomeUnico("Teclado");
  await cadastrar(page, nome, "ABNT");

  await page.getByRole("button", { name: `Editar ${nome}` }).click();
  await expect(page.getByLabel("Descrição")).toHaveValue("ABNT");
  await page.getByLabel("Descrição").fill("ABNT2 sem fio");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(linhaDoItem(page, nome)).toContainText("ABNT2 sem fio");

  await page.reload();
  await expect(linhaDoItem(page, nome)).toContainText("ABNT2 sem fio");
});

test("exclui um item e ele não volta depois de recarregar", async ({
  page,
}) => {
  const nome = nomeUnico("Monitor");
  await cadastrar(page, nome);

  await page.getByRole("button", { name: `Excluir ${nome}` }).click();
  await expect(linhaDoItem(page, nome)).toHaveCount(0);

  await page.reload();
  await expect(page.getByText("Carregando itens...")).toBeHidden();
  await expect(linhaDoItem(page, nome)).toHaveCount(0);
});
