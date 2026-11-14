// Imita as rotas /items do backend em memoria, para os testes do Vitest
// exercitarem a tela sem depender da API de verdade.
export function criarApiFalsa(itensIniciais = []) {
  let itens = itensIniciais.map((item) => ({ ...item }));
  let proximoId = Math.max(0, ...itens.map((item) => item.id)) + 1;
  let foraDoAr = false;

  function responder(status, corpo) {
    return Promise.resolve(
      new Response(corpo === undefined ? null : JSON.stringify(corpo), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  function nomeRepetido(nome, ignorarId) {
    return itens.some((item) => item.name === nome && item.id !== ignorarId);
  }

  const fetch = async (url, opcoes = {}) => {
    if (foraDoAr) throw new TypeError("Failed to fetch");

    const { pathname } = new URL(url);
    const method = opcoes.method ?? "GET";
    const corpo = opcoes.body ? JSON.parse(opcoes.body) : null;
    const id = Number(pathname.split("/")[2]);
    const item = itens.find((atual) => atual.id === id);

    if (pathname === "/items" && method === "GET") return responder(200, itens);

    if (pathname === "/items" && method === "POST") {
      if (nomeRepetido(corpo.name)) {
        return responder(409, {
          detail: `Ja existe um item com o nome ${corpo.name}`,
        });
      }
      const novo = { id: proximoId++, ...corpo };
      itens.push(novo);
      return responder(201, novo);
    }

    if (!item) return responder(404, { detail: `Item ${id} nao encontrado` });

    if (method === "GET") return responder(200, item);
    if (method === "PATCH" || method === "PUT") {
      if (corpo.name && nomeRepetido(corpo.name, id)) {
        return responder(409, {
          detail: `Ja existe um item com o nome ${corpo.name}`,
        });
      }
      Object.assign(item, corpo);
      return responder(200, item);
    }
    if (method === "DELETE") {
      itens = itens.filter((atual) => atual.id !== id);
      return responder(204);
    }
    return responder(405, { detail: "Method Not Allowed" });
  };

  return {
    fetch,
    get itens() {
      return itens;
    },
    removerPorFora(idRemovido) {
      itens = itens.filter((item) => item.id !== idRemovido);
    },
    derrubar() {
      foraDoAr = true;
    },
    religar() {
      foraDoAr = false;
    },
  };
}
