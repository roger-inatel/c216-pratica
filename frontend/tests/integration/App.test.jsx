import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";
import { criarApiFalsa } from "../helpers/fakeApi";

let api;

function usarApi(itens = []) {
  api = criarApiFalsa(itens);
  vi.stubGlobal("fetch", vi.fn(api.fetch));
}

async function renderizarCarregado() {
  const user = userEvent.setup();
  render(<App />);
  await waitFor(() =>
    expect(screen.queryByText("Carregando itens...")).not.toBeInTheDocument(),
  );
  return user;
}

async function cadastrar(user, name, description = "") {
  await user.type(screen.getByLabelText("Nome"), name);
  if (description) {
    await user.type(screen.getByLabelText("Descrição"), description);
  }
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
}

beforeEach(() => usarApi());

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("mostra o carregamento e depois a lista vazia", async () => {
    render(<App />);

    expect(screen.getByText("Carregando itens...")).toBeInTheDocument();
    expect(
      await screen.findByText("Nenhum item cadastrado."),
    ).toBeInTheDocument();
  });

  it("lista os itens que já estão na API", async () => {
    usarApi([
      { id: 1, name: "Notebook", description: "14 polegadas" },
      { id: 2, name: "Mouse", description: null },
    ]);
    render(<App />);

    const linhas = await screen.findAllByRole("listitem");
    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toHaveTextContent("Notebook");
    expect(linhas[1]).toHaveTextContent("Mouse");
  });

  it("avisa quando a API está fora do ar e tenta de novo", async () => {
    usarApi([{ id: 1, name: "Notebook", description: null }]);
    api.derrubar();
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar à API",
    );

    api.religar();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Notebook")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("cadastra pela API e mostra o item na lista", async () => {
    const user = await renderizarCarregado();

    await cadastrar(user, "Notebook", "14 polegadas");

    expect(await screen.findByText("Notebook")).toBeInTheDocument();
    expect(screen.getByText("14 polegadas")).toBeInTheDocument();
    expect(api.itens).toEqual([
      { id: 1, name: "Notebook", description: "14 polegadas" },
    ]);
  });

  it("não chama a API quando o formulário é inválido", async () => {
    const user = await renderizarCarregado();
    fetch.mockClear();

    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "O nome é obrigatório.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("mostra o 409 da API e não duplica o item", async () => {
    usarApi([{ id: 1, name: "Notebook", description: null }]);
    const user = await renderizarCarregado();

    await cadastrar(user, "Notebook");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe um item com esse nome.",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByLabelText("Nome")).toHaveValue("Notebook");
  });

  it("avisa quando a API cai no meio do cadastro", async () => {
    const user = await renderizarCarregado();
    api.derrubar();

    await cadastrar(user, "Notebook");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar à API",
    );
    expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
  });

  it("edita buscando o item na API e enviando só o que mudou", async () => {
    usarApi([{ id: 1, name: "Mouse", description: "Com fio" }]);
    const user = await renderizarCarregado();

    await user.click(screen.getByRole("button", { name: "Editar Mouse" }));
    const descricao = await screen.findByDisplayValue("Com fio");
    await user.clear(descricao);
    await user.type(descricao, "Sem fio");
    fetch.mockClear();
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("Sem fio")).toBeInTheDocument();
    const [url, opcoes] = fetch.mock.calls[0];
    expect(url).toMatch(/\/items\/1$/);
    expect(opcoes.method).toBe("PATCH");
    expect(JSON.parse(opcoes.body)).toEqual({ description: "Sem fio" });
    expect(screen.getByRole("heading", { name: "Novo item" })).toBeVisible();
  });

  it("cancela a edição sem mudar nada", async () => {
    usarApi([{ id: 1, name: "Mouse", description: null }]);
    const user = await renderizarCarregado();

    await user.click(screen.getByRole("button", { name: "Editar Mouse" }));
    await screen.findByRole("heading", { name: "Editando Mouse" });
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByRole("heading", { name: "Novo item" })).toBeVisible();
    expect(screen.getByLabelText("Nome")).toHaveValue("");
  });

  it("exclui pela API e tira o item da lista", async () => {
    usarApi([
      { id: 1, name: "Notebook", description: null },
      { id: 2, name: "Mouse", description: null },
    ]);
    const user = await renderizarCarregado();

    await user.click(screen.getByRole("button", { name: "Excluir Notebook" }));

    const lista = await screen.findByRole("list");
    expect(await within(lista).findAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByText("Notebook")).not.toBeInTheDocument();
    expect(api.itens.map((item) => item.name)).toEqual(["Mouse"]);
  });

  it("avisa quando o item já tinha sido excluído por outra pessoa", async () => {
    usarApi([{ id: 1, name: "Mouse", description: null }]);
    const user = await renderizarCarregado();
    api.removerPorFora(1);

    await user.click(screen.getByRole("button", { name: "Editar Mouse" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Item não encontrado. Ele pode ter sido excluído.",
    );
    expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
  });
});
