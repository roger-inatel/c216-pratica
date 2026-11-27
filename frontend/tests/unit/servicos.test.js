import { afterEach, describe, expect, it, vi } from "vitest";
import { API_URL, ApiError } from "../../src/services/api";
import {
  createCliente,
  deleteCliente,
  listClientes,
  updateCliente,
} from "../../src/services/clientes";
import {
  createPedido,
  getResumo,
  listPedidos,
  mudarStatus,
  updatePedido,
} from "../../src/services/pedidos";

function respostaJson(status, corpo) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function simularFetch(resposta = respostaJson(200, [])) {
  const fetch = vi.fn().mockResolvedValue(resposta);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("montagem das requisições", () => {
  it.each([
    [() => listClientes(), "/clientes"],
    [() => listClientes("pad"), "/clientes?busca=pad"],
    [() => listPedidos(), "/pedidos"],
    [() => listPedidos({ status: "em_rota" }), "/pedidos?status=em_rota"],
    [
      () => listPedidos({ status: "aberto", clienteId: 4 }),
      "/pedidos?status=aberto&cliente_id=4",
    ],
    [() => getResumo(), "/pedidos/resumo"],
  ])("GET %#", async (chamar, caminho) => {
    const fetch = simularFetch();

    await chamar();

    expect(fetch).toHaveBeenCalledWith(`${API_URL}${caminho}`, {});
  });

  it.each([
    [() => createCliente({ nome: "A" }), "/clientes", "POST", { nome: "A" }],
    [
      () => updateCliente(2, { nome: "B" }),
      "/clientes/2",
      "PUT",
      { nome: "B" },
    ],
    [
      () => createPedido({ cliente_id: 1, descricao: "x", valor: 9.9 }),
      "/pedidos",
      "POST",
      { cliente_id: 1, descricao: "x", valor: 9.9 },
    ],
    [() => updatePedido(5, { valor: 1 }), "/pedidos/5", "PATCH", { valor: 1 }],
    [
      () => mudarStatus(5, "em_rota"),
      "/pedidos/5/status",
      "PATCH",
      { status: "em_rota" },
    ],
  ])("%#: envia JSON", async (chamar, caminho, method, corpo) => {
    const fetch = simularFetch(respostaJson(200, {}));

    await chamar();

    const [url, opcoes] = fetch.mock.calls[0];
    expect(url).toBe(`${API_URL}${caminho}`);
    expect(opcoes.method).toBe(method);
    expect(opcoes.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(opcoes.body)).toEqual(corpo);
  });

  it("DELETE devolve null no 204", async () => {
    simularFetch(new Response(null, { status: 204 }));

    await expect(deleteCliente(3)).resolves.toBeNull();
  });
});

describe("tratamento de erros", () => {
  it("usa a mensagem que o backend mandou", async () => {
    simularFetch(
      respostaJson(409, { detail: "Só pedidos abertos podem ser alterados." }),
    );

    await expect(updatePedido(1, { valor: 2 })).rejects.toEqual(
      new ApiError("Só pedidos abertos podem ser alterados.", 409),
    );
  });

  it("traduz o 422, que vem com detail em lista", async () => {
    simularFetch(respostaJson(422, { detail: [{ msg: "Field required" }] }));

    const erro = await createCliente({}).catch((e) => e);

    expect(erro.status).toBe(422);
    expect(erro.message).toMatch("Dados inválidos");
  });

  it("avisa erro do servidor quando a resposta não é JSON", async () => {
    simularFetch(new Response("Internal Server Error", { status: 500 }));

    const erro = await listPedidos().catch((e) => e);

    expect(erro.message).toMatch("Erro no servidor");
  });

  it("avisa quando não consegue falar com a API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("x")));

    const erro = await listClientes().catch((e) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(0);
    expect(erro.message).toMatch("Não foi possível conectar à API");
  });
});
