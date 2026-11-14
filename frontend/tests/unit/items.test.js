import { afterEach, describe, expect, it, vi } from "vitest";
import { API_URL, ApiError } from "../../src/services/api";
import {
  createItem,
  deleteItem,
  getItem,
  LIST_LIMIT,
  listItems,
  replaceItem,
  updateItem,
} from "../../src/services/items";

function respostaJson(status, corpo) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function simularFetch(resposta) {
  const fetch = vi.fn().mockResolvedValue(resposta);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("serviço de itens", () => {
  it("lista os itens pedindo o limite máximo da API", async () => {
    const fetch = simularFetch(
      respostaJson(200, [{ id: 1, name: "Notebook", description: null }]),
    );

    const itens = await listItems();

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/items?limit=${LIST_LIMIT}`,
      {},
    );
    expect(itens).toEqual([{ id: 1, name: "Notebook", description: null }]);
  });

  it("busca um item pelo id", async () => {
    const fetch = simularFetch(respostaJson(200, { id: 7, name: "Mouse" }));

    await getItem(7);

    expect(fetch).toHaveBeenCalledWith(`${API_URL}/items/7`, {});
  });

  it.each([
    [
      "cria com POST",
      () => createItem({ name: "Mouse", description: "Sem fio" }),
      "/items",
      "POST",
      { name: "Mouse", description: "Sem fio" },
    ],
    [
      "substitui com PUT",
      () => replaceItem(3, { name: "Mouse", description: "" }),
      "/items/3",
      "PUT",
      { name: "Mouse", description: "" },
    ],
    [
      "atualiza só os campos enviados com PATCH",
      () => updateItem(3, { description: "USB" }),
      "/items/3",
      "PATCH",
      { description: "USB" },
    ],
  ])("%s, enviando JSON", async (_nome, chamar, caminho, method, corpo) => {
    const fetch = simularFetch(respostaJson(200, { id: 3, ...corpo }));

    await chamar();

    const [url, opcoes] = fetch.mock.calls[0];
    expect(url).toBe(`${API_URL}${caminho}`);
    expect(opcoes.method).toBe(method);
    expect(opcoes.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(opcoes.body)).toEqual(corpo);
  });

  it("remove com DELETE e devolve null no 204", async () => {
    const fetch = simularFetch(new Response(null, { status: 204 }));

    const resultado = await deleteItem(3);

    expect(fetch).toHaveBeenCalledWith(`${API_URL}/items/3`, {
      method: "DELETE",
    });
    expect(resultado).toBeNull();
  });

  it.each([
    [409, "Já existe um item com esse nome."],
    [404, "Item não encontrado. Ele pode ter sido excluído."],
  ])("traduz o %i para uma mensagem da tela", async (status, mensagem) => {
    simularFetch(respostaJson(status, { detail: "texto do backend" }));

    await expect(
      createItem({ name: "Mouse", description: "" }),
    ).rejects.toEqual(new ApiError(mensagem, status));
  });

  it("usa o detail do backend nos outros erros", async () => {
    simularFetch(respostaJson(400, { detail: "Requisicao invalida" }));

    await expect(getItem(1)).rejects.toEqual(
      new ApiError("Requisicao invalida", 400),
    );
  });

  it("traduz o 422, que vem com detail em lista", async () => {
    simularFetch(respostaJson(422, { detail: [{ msg: "Field required" }] }));

    const erro = await createItem({ name: "", description: "" }).catch(
      (e) => e,
    );

    expect(erro.status).toBe(422);
    expect(erro.message).toBe("A API recusou os dados enviados.");
  });

  it("avisa erro do servidor quando a resposta não é JSON", async () => {
    simularFetch(new Response("Internal Server Error", { status: 500 }));

    const erro = await listItems().catch((e) => e);

    expect(erro.status).toBe(500);
    expect(erro.message).toBe("Erro no servidor. Tente novamente.");
  });

  it("avisa quando não consegue conectar na API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    const erro = await listItems().catch((e) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(0);
    expect(erro.message).toMatch("Não foi possível conectar à API");
  });
});
