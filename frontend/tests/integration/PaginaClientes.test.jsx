import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";
import { PaginaClientes } from "../../src/components/PaginaClientes";
import { criarApiFalsa } from "../helpers/apiFalsa";

let api;

function usarApi(dados) {
  api = criarApiFalsa(dados);
  vi.stubGlobal("fetch", vi.fn(api.fetch));
}

async function renderizar() {
  const user = userEvent.setup();
  render(<PaginaClientes />);
  await waitFor(() =>
    expect(
      screen.queryByText("Carregando clientes..."),
    ).not.toBeInTheDocument(),
  );
  return user;
}

async function preencher(user, { nome = "", telefone = "", endereco = "" }) {
  for (const [rotulo, valor] of [
    ["Nome", nome],
    ["Telefone (opcional)", telefone],
    ["Endereço", endereco],
  ]) {
    const campo = screen.getByLabelText(rotulo);
    await user.clear(campo);
    if (valor) await user.type(campo, valor);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PaginaClientes", () => {
  it("cadastra um cliente pela API", async () => {
    usarApi();
    const user = await renderizar();

    await preencher(user, { nome: "Mercado", endereco: "Rua A, 10" });
    await user.click(screen.getByRole("button", { name: "Cadastrar cliente" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Cliente Mercado cadastrado.",
    );
    expect(api.banco.clientes[0]).toMatchObject({
      nome: "Mercado",
      telefone: null,
    });
    expect(screen.getByLabelText("Nome")).toHaveValue("");
  });

  it("mostra o 409 do telefone e mantém o que foi digitado", async () => {
    usarApi({
      clientes: [
        { id: 1, nome: "Mercado", telefone: "3599990000", endereco: "Rua A" },
      ],
    });
    const user = await renderizar();

    await preencher(user, {
      nome: "Outro",
      telefone: "3599990000",
      endereco: "Rua B",
    });
    await user.click(screen.getByRole("button", { name: "Cadastrar cliente" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe um cliente com esse telefone.",
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("Outro");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("edita com PUT e volta para o cadastro", async () => {
    usarApi({ clientes: [{ id: 1, nome: "Mercado", endereco: "Rua A" }] });
    const user = await renderizar();

    await user.click(screen.getByRole("button", { name: "Editar Mercado" }));
    await screen.findByRole("heading", { name: "Editando Mercado" });
    await preencher(user, { nome: "Mercado", endereco: "Av. Brasil, 200" });
    fetch.mockClear();
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await screen.findByText("Cliente Mercado atualizado.");
    expect(fetch.mock.calls[0][1].method).toBe("PUT");
    expect(screen.getByText("Av. Brasil, 200")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Novo cliente" }),
    ).toBeInTheDocument();
  });

  it("exclui cliente sem pedidos", async () => {
    usarApi({ clientes: [{ id: 1, nome: "Mercado", endereco: "Rua A" }] });
    const user = await renderizar();

    await user.click(screen.getByRole("button", { name: "Excluir Mercado" }));

    expect(
      await screen.findByText("Cliente Mercado excluído."),
    ).toBeInTheDocument();
    expect(screen.getByText("Nenhum cliente encontrado.")).toBeInTheDocument();
  });

  it("não exclui cliente que tem pedidos", async () => {
    usarApi({
      clientes: [{ id: 1, nome: "Mercado", endereco: "Rua A" }],
      pedidos: [{ id: 5, cliente_id: 1, descricao: "Leite", valor: 10 }],
    });
    const user = await renderizar();

    await user.click(screen.getByRole("button", { name: "Excluir Mercado" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Este cliente tem pedidos e não pode ser excluído.",
    );
    expect(screen.getByText("Mercado")).toBeInTheDocument();
  });

  it("busca pelo nome", async () => {
    usarApi({
      clientes: [
        { id: 1, nome: "Mercado", endereco: "Rua A" },
        { id: 2, nome: "Padaria", endereco: "Rua B" },
      ],
    });
    const user = await renderizar();

    await user.type(screen.getByLabelText("Buscar cliente"), "pad");

    await waitFor(() =>
      expect(screen.getAllByRole("listitem")).toHaveLength(1),
    );
    expect(
      within(screen.getByRole("listitem")).getByText("Padaria"),
    ).toBeInTheDocument();
  });
});

describe("App", () => {
  it("troca entre as abas de pedidos e clientes", async () => {
    usarApi();
    const user = userEvent.setup();
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Novo pedido" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clientes" }));

    expect(
      await screen.findByRole("heading", { name: "Novo cliente" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clientes" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
