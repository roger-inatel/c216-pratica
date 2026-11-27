export const STATUS = {
  aberto: { rotulo: "Aberto", cor: "bg-amber-100 text-amber-800" },
  em_rota: { rotulo: "Em rota", cor: "bg-blue-100 text-blue-800" },
  entregue: { rotulo: "Entregue", cor: "bg-green-100 text-green-800" },
  cancelado: { rotulo: "Cancelado", cor: "bg-slate-200 text-slate-700" },
};

// Mesmo caminho que o backend aceita (TRANSICOES em services/pedido.py):
// a tela so oferece o botao que a API vai aceitar.
export const ACOES_POR_STATUS = {
  aberto: [
    { para: "em_rota", rotulo: "Saiu para entrega" },
    { para: "cancelado", rotulo: "Cancelar" },
  ],
  em_rota: [
    { para: "entregue", rotulo: "Marcar entregue" },
    { para: "cancelado", rotulo: "Cancelar" },
  ],
  entregue: [],
  cancelado: [],
};

export function podeEditar(pedido) {
  return pedido.status === "aberto";
}

export function podeExcluir(pedido) {
  return pedido.status === "aberto" || pedido.status === "cancelado";
}

const MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarMoeda(valor) {
  return MOEDA.format(valor);
}
