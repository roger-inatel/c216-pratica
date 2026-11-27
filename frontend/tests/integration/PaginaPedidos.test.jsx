import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PaginaPedidos } from "../../src/components/PaginaPedidos";
import { criarApiFalsa } from "../helpers/apiFalsa";

const CLIENTES = [
  { id: 1, nome: "Mercado Bom Preço", endereco: "Rua A" },
  { id: 2, nome: "Padaria Pão Quente", endereco: "Rua B" },
];

let api;

function usarApi(dados = { clientes: CLIENTES }) {
  api = criarApiFalsa(dados);
  vi.stubGlobal("fetch", vi.fn(api.fetch));
}

async function renderizar() {
  const user = userEvent.setup();
  render(<PaginaPedidos />);
  await waitFor(() =>
    expect(screen.queryByText("Carregando pedidos...")).not.toBeInTheDocument(),
  );
  return user;
}

const pedido = (texto) => screen.getByRole("listitem", { name: texto });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PaginaPedidos", () => {
  it("mostra o carregamento e depois a lista vazia", async () => {
    usarApi();
    render(<PaginaPedidos />);

    expect(screen.getByText("Carregando pedidos...")).toBeInTheDocument();
    expect(
      await screen.findByText("Nenhum pedido encontrado."),
    ).toBeInTheDocument();
  });

  it("pede para cadastrar cliente quando não há nenhum", async () => {
    usarApi({ clientes: [] });
    await renderizar();

    expect(
      screen.getByText(/Cadastre um cliente na aba Clientes/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Cliente")).not.toBeInTheDocument();
  });

  it("registra um pedido e atualiza lista e resumo", async () => {
    usarApi();
    const user = await renderizar();

    await user.selectOptions(screen.getByLabelText("Cliente"), "2");
    await user.type(screen.getByLabelText("Descrição"), "5 sacos de farinha");
    await user.type(screen.getByLabelText("Valor (R$)"), "612,50");
    await user.click(screen.getByRole("button", { name: "Registrar pedido" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Pedido #100 registrado.",
    );
    expect(pedido("Pedido 100")).toHaveTextContent("Padaria Pão Quente");
    expect(pedido("Pedido 100")).toHaveTextContent("R$ 612,50");
    expect(api.banco.pedidos[0]).toMatchObject({ cliente_id: 2, valor: 612.5 });
    expect(
      screen.getByText("Aberto", { selector: "dt" }).nextSibling,
    ).toHaveTextContent("1");
  });

  it("não chama a API com o formulário inválido", async () => {
    usarApi();
    const user = await renderizar();
    fetch.mockClear();

    await user.click(screen.getByRole("button", { name: "Registrar pedido" }));

    expect(screen.getByText("Escolha o cliente.")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("leva o pedido até a entrega e mostra os botões certos", async () => {
    usarApi({
      clientes: CLIENTES,
      pedidos: [{ id: 7, cliente_id: 1, descricao: "Leite", valor: 100 }],
    });
    const user = await renderizar();

    await user.click(
      within(pedido("Pedido 7")).getByRole("button", {
        name: "Saiu para entrega",
      }),
    );
    await screen.findByText("Pedido #7 agora está em rota.");
    expect(
      within(pedido("Pedido 7")).queryByRole("button", { name: "Editar" }),
    ).not.toBeInTheDocument();

    await user.click(
      within(pedido("Pedido 7")).getByRole("button", {
        name: "Marcar entregue",
      }),
    );
    await screen.findByText("Pedido #7 agora está entregue.");
    expect(within(pedido("Pedido 7")).queryAllByRole("button")).toHaveLength(0);
    expect(
      screen.getByText("R$ 100,00", { selector: "dd" }),
    ).toBeInTheDocument();
  });

  it("edita um pedido aberto enviando só o que mudou", async () => {
    usarApi({
      clientes: CLIENTES,
      pedidos: [{ id: 7, cliente_id: 1, descricao: "Leite", valor: 100 }],
    });
    const user = await renderizar();

    await user.click(
      within(pedido("Pedido 7")).getByRole("button", { name: "Editar" }),
    );
    const valor = await screen.findByDisplayValue("100,00");
    expect(screen.getByLabelText("Cliente")).toBeDisabled();
    await user.clear(valor);
    await user.type(valor, "120");
    fetch.mockClear();
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await screen.findByText("Pedido #7 alterado.");
    const [url, opcoes] = fetch.mock.calls[0];
    expect(url).toMatch(/\/pedidos\/7$/);
    expect(opcoes.method).toBe("PATCH");
    expect(JSON.parse(opcoes.body)).toEqual({ valor: 120 });
  });

  it("mostra o erro da API quando a regra é violada", async () => {
    usarApi({
      clientes: CLIENTES,
      pedidos: [{ id: 7, cliente_id: 1, descricao: "Leite", valor: 100 }],
    });
    const user = await renderizar();
    api.banco.pedidos[0].status = "entregue";

    await user.click(
      within(pedido("Pedido 7")).getByRole("button", { name: "Cancelar" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Um pedido entregue não pode passar para cancelado.",
    );
  });

  it("exclui um pedido aberto", async () => {
    usarApi({
      clientes: CLIENTES,
      pedidos: [{ id: 7, cliente_id: 1, descricao: "Leite", valor: 100 }],
    });
    const user = await renderizar();

    await user.click(
      within(pedido("Pedido 7")).getByRole("button", { name: "Excluir" }),
    );

    expect(await screen.findByText("Pedido #7 excluído.")).toBeInTheDocument();
    expect(screen.getByText("Nenhum pedido encontrado.")).toBeInTheDocument();
  });

  it("filtra pela situação do pedido", async () => {
    usarApi({
      clientes: CLIENTES,
      pedidos: [
        { id: 7, cliente_id: 1, descricao: "Leite", valor: 1 },
        {
          id: 8,
          cliente_id: 2,
          descricao: "Farinha",
          valor: 1,
          status: "em_rota",
        },
      ],
    });
    const user = await renderizar();

    await user.selectOptions(
      screen.getByLabelText("Filtrar por status"),
      "em_rota",
    );

    await waitFor(() =>
      expect(screen.getAllByRole("listitem")).toHaveLength(1),
    );
    expect(pedido("Pedido 8")).toBeInTheDocument();
  });

  it("avisa quando a API está fora do ar e tenta de novo", async () => {
    usarApi();
    api.derrubar();
    const user = userEvent.setup();
    render(<PaginaPedidos />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar à API",
    );

    api.religar();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(
      await screen.findByText("Nenhum pedido encontrado."),
    ).toBeInTheDocument();
  });
});
