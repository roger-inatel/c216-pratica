import { expect, test } from "@playwright/test";

// Sem mocks: navegador -> React -> FastAPI -> PostgreSQL. Nomes unicos por
// execucao, para os testes nao dependerem do que ja esta no banco.
const execucao = Date.now();
let contador = 0;
function unico(base) {
  contador += 1;
  return `${base} ${execucao}-${contador}`;
}

async function esperarCarregar(page, texto = "Carregando pedidos...") {
  await expect(page.getByText(texto)).toBeHidden();
}

async function abrirClientes(page) {
  await page.getByRole("button", { name: "Clientes" }).click();
  await esperarCarregar(page, "Carregando clientes...");
}

async function abrirPedidos(page) {
  await page.getByRole("button", { name: "Pedidos" }).click();
  await esperarCarregar(page);
}

async function cadastrarCliente(page, nome) {
  await abrirClientes(page);
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("Endereço").fill("Rua das Flores, 100");
  await page.getByRole("button", { name: "Cadastrar cliente" }).click();
  await expect(page.getByRole("status")).toHaveText(
    `Cliente ${nome} cadastrado.`,
  );
}

async function registrarPedido(page, cliente, descricao, valor) {
  await abrirPedidos(page);
  await page.getByLabel("Cliente").selectOption({ label: cliente });
  await page.getByLabel("Descrição").fill(descricao);
  await page.getByLabel("Valor (R$)").fill(valor);
  await page.getByRole("button", { name: "Registrar pedido" }).click();
  await expect(page.getByRole("status")).toContainText("registrado");
}

function linhaDoPedido(page, descricao) {
  return page.getByRole("listitem").filter({ hasText: descricao });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await esperarCarregar(page);
});

test("carrega a interface com dados da API, sem erro de conexão ou de CORS", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "Controle de Entregas" }),
  ).toBeVisible();
  await expect(page.getByText("Valor entregue")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("pedido vai de aberto a entregue e continua salvo depois de recarregar", async ({
  page,
}) => {
  const cliente = unico("Mercado E2E");
  const descricao = unico("Fardos de refrigerante");
  await cadastrarCliente(page, cliente);
  await registrarPedido(page, cliente, descricao, "389,90");

  const pedido = linhaDoPedido(page, descricao);
  await expect(pedido).toContainText(cliente);
  await expect(pedido).toContainText("Aberto");

  await pedido.getByRole("button", { name: "Saiu para entrega" }).click();
  await expect(pedido).toContainText("Em rota");
  await pedido.getByRole("button", { name: "Marcar entregue" }).click();
  await expect(pedido).toContainText("Entregue");

  await page.reload();
  await esperarCarregar(page);
  await expect(linhaDoPedido(page, descricao)).toContainText("Entregue");
  await expect(linhaDoPedido(page, descricao)).toContainText("R$ 389,90");
});

test("edita e exclui um pedido aberto, e a mudança fica no banco", async ({
  page,
}) => {
  const cliente = unico("Padaria E2E");
  const descricao = unico("Sacos de farinha");
  await cadastrarCliente(page, cliente);
  await registrarPedido(page, cliente, descricao, "100,00");

  await linhaDoPedido(page, descricao)
    .getByRole("button", { name: "Editar" })
    .click();
  await expect(page.getByLabel("Valor (R$)")).toHaveValue("100,00");
  await page.getByLabel("Valor (R$)").fill("150,50");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(linhaDoPedido(page, descricao)).toContainText("R$ 150,50");

  await page.reload();
  await esperarCarregar(page);
  await expect(linhaDoPedido(page, descricao)).toContainText("R$ 150,50");

  await linhaDoPedido(page, descricao)
    .getByRole("button", { name: "Excluir" })
    .click();
  await expect(linhaDoPedido(page, descricao)).toHaveCount(0);
  await page.reload();
  await esperarCarregar(page);
  await expect(linhaDoPedido(page, descricao)).toHaveCount(0);
});

test("não deixa excluir cliente que tem pedidos", async ({ page }) => {
  const cliente = unico("Açougue E2E");
  await cadastrarCliente(page, cliente);
  await registrarPedido(page, cliente, unico("Carne"), "50");

  await abrirClientes(page);
  await page.getByRole("button", { name: `Excluir ${cliente}` }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "Este cliente tem pedidos e não pode ser excluído.",
  );
  await expect(
    page.getByRole("button", { name: `Excluir ${cliente}` }),
  ).toBeVisible();
});
