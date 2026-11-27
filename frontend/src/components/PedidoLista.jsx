import {
  ACOES_POR_STATUS,
  formatarMoeda,
  podeEditar,
  podeExcluir,
} from "../status";
import { SeloStatus } from "./SeloStatus";

const BOTAO = "rounded border px-3 py-1 text-sm disabled:opacity-60";

export function PedidoLista({
  pedidos,
  onMudarStatus,
  onEdit,
  onDelete,
  busyId = null,
}) {
  if (pedidos.length === 0) {
    return <p className="text-slate-600">Nenhum pedido encontrado.</p>;
  }

  return (
    <ul className="space-y-2">
      {pedidos.map((pedido) => {
        const ocupado = busyId === pedido.id;
        return (
          <li
            key={pedido.id}
            aria-label={`Pedido ${pedido.id}`}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium break-words">
                  #{pedido.id} · {pedido.descricao}
                </p>
                <p className="text-sm text-slate-600">
                  {pedido.cliente_nome} · {formatarMoeda(pedido.valor)}
                </p>
              </div>
              <SeloStatus status={pedido.status} />
            </div>

            <div className="flex flex-wrap gap-2">
              {ACOES_POR_STATUS[pedido.status].map((acao) => (
                <button
                  key={acao.para}
                  type="button"
                  disabled={ocupado}
                  onClick={() => onMudarStatus(pedido, acao.para)}
                  className={`${BOTAO} ${
                    acao.para === "cancelado"
                      ? "border-red-300 text-red-700 hover:bg-red-50"
                      : "border-blue-300 text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  {acao.rotulo}
                </button>
              ))}
              {podeEditar(pedido) && (
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => onEdit(pedido)}
                  className={`${BOTAO} border-slate-300 hover:bg-slate-100`}
                >
                  Editar
                </button>
              )}
              {podeExcluir(pedido) && (
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => onDelete(pedido)}
                  className={`${BOTAO} border-red-300 text-red-700 hover:bg-red-50`}
                >
                  Excluir
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
