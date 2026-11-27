// Imita /clientes e /pedidos do backend em memoria, com as mesmas regras e
// mensagens, para o Vitest testar as telas sem depender da API de verdade.
const TRANSICOES = {
  aberto: ["em_rota", "cancelado"],
  em_rota: ["entregue", "cancelado"],
  entregue: [],
  cancelado: [],
};
const NOMES = {
  aberto: "aberto",
  em_rota: "em rota",
  entregue: "entregue",
  cancelado: "cancelado",
};

export function criarApiFalsa({ clientes = [], pedidos = [] } = {}) {
  const banco = {
    clientes: clientes.map((c) => ({ telefone: null, ...c })),
    pedidos: pedidos.map((p) => ({ status: "aberto", ...p })),
  };
  let proximoId = 100;
  let foraDoAr = false;

  const responder = (status, corpo) =>
    new Response(corpo === undefined ? null : JSON.stringify(corpo), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  const erro = (status, detail) => responder(status, { detail });
  const comNome = (pedido) => ({
    ...pedido,
    cliente_nome: banco.clientes.find((c) => c.id === pedido.cliente_id).nome,
  });
  const telefoneOcupado = (telefone, ignorarId) =>
    telefone &&
    banco.clientes.some((c) => c.telefone === telefone && c.id !== ignorarId);

  function rotaClientes(method, id, corpo, query) {
    if (!id && method === "GET") {
      const busca = (query.get("busca") ?? "").toLowerCase();
      return responder(
        200,
        banco.clientes.filter((c) => c.nome.toLowerCase().includes(busca)),
      );
    }
    if (!id && method === "POST") {
      if (telefoneOcupado(corpo.telefone)) {
        return erro(409, "Já existe um cliente com esse telefone.");
      }
      const novo = { id: proximoId++, ...corpo };
      banco.clientes.push(novo);
      return responder(201, novo);
    }
    const cliente = banco.clientes.find((c) => c.id === id);
    if (!cliente) return erro(404, "Cliente não encontrado.");
    if (method === "GET") return responder(200, cliente);
    if (method === "PUT") {
      if (telefoneOcupado(corpo.telefone, id)) {
        return erro(409, "Já existe um cliente com esse telefone.");
      }
      Object.assign(cliente, corpo);
      return responder(200, cliente);
    }
    if (method === "DELETE") {
      if (banco.pedidos.some((p) => p.cliente_id === id)) {
        return erro(409, "Este cliente tem pedidos e não pode ser excluído.");
      }
      banco.clientes = banco.clientes.filter((c) => c.id !== id);
      return responder(204);
    }
    return erro(405, "Method Not Allowed");
  }

  function rotaPedidos(method, id, sub, corpo, query) {
    if (id === "resumo") {
      const por_status = { aberto: 0, em_rota: 0, entregue: 0, cancelado: 0 };
      for (const p of banco.pedidos) por_status[p.status] += 1;
      const valor_entregue = banco.pedidos
        .filter((p) => p.status === "entregue")
        .reduce((soma, p) => soma + p.valor, 0);
      return responder(200, {
        total: banco.pedidos.length,
        por_status,
        valor_entregue,
      });
    }
    if (!id && method === "GET") {
      const status = query.get("status");
      const lista = banco.pedidos
        .filter((p) => !status || p.status === status)
        .sort((a, b) => b.id - a.id);
      return responder(200, lista.map(comNome));
    }
    if (!id && method === "POST") {
      if (!banco.clientes.some((c) => c.id === corpo.cliente_id)) {
        return erro(404, "Cliente não encontrado.");
      }
      const novo = { id: proximoId++, status: "aberto", ...corpo };
      banco.pedidos.push(novo);
      return responder(201, comNome(novo));
    }
    const pedido = banco.pedidos.find((p) => p.id === id);
    if (!pedido) return erro(404, "Pedido não encontrado.");
    if (method === "GET") return responder(200, comNome(pedido));
    if (method === "PATCH" && sub === "status") {
      if (!TRANSICOES[pedido.status].includes(corpo.status)) {
        return erro(
          409,
          `Um pedido ${NOMES[pedido.status]} não pode passar para ${NOMES[corpo.status]}.`,
        );
      }
      pedido.status = corpo.status;
      return responder(200, comNome(pedido));
    }
    if (method === "PATCH") {
      if (pedido.status !== "aberto") {
        return erro(409, "Só pedidos abertos podem ser alterados.");
      }
      Object.assign(pedido, corpo);
      return responder(200, comNome(pedido));
    }
    if (method === "DELETE") {
      if (["em_rota", "entregue"].includes(pedido.status)) {
        return erro(
          409,
          "Pedidos em rota ou entregues não podem ser excluídos.",
        );
      }
      banco.pedidos = banco.pedidos.filter((p) => p.id !== id);
      return responder(204);
    }
    return erro(405, "Method Not Allowed");
  }

  async function fetch(url, opcoes = {}) {
    if (foraDoAr) throw new TypeError("Failed to fetch");
    const { pathname, searchParams } = new URL(url);
    const [, recurso, idTexto, sub] = pathname.split("/");
    const method = opcoes.method ?? "GET";
    const corpo = opcoes.body ? JSON.parse(opcoes.body) : null;
    const id =
      idTexto === undefined || idTexto === "resumo" ? idTexto : Number(idTexto);
    if (recurso === "clientes")
      return rotaClientes(method, id, corpo, searchParams);
    if (recurso === "pedidos")
      return rotaPedidos(method, id, sub, corpo, searchParams);
    return erro(404, "Not Found");
  }

  return {
    fetch,
    banco,
    derrubar: () => {
      foraDoAr = true;
    },
    religar: () => {
      foraDoAr = false;
    },
  };
}
