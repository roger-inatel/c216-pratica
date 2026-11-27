import { formatarMoeda, STATUS } from "../status";

export function ResumoPedidos({ resumo }) {
  if (!resumo) return null;

  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {Object.entries(STATUS).map(([status, { rotulo }]) => (
        <div
          key={status}
          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
        >
          <dt className="text-xs text-slate-600">{rotulo}</dt>
          <dd className="text-2xl font-semibold">
            {resumo.por_status[status]}
          </dd>
        </div>
      ))}
      <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:col-span-1">
        <dt className="text-xs text-slate-600">Valor entregue</dt>
        <dd className="text-lg font-semibold">
          {formatarMoeda(resumo.valor_entregue)}
        </dd>
      </div>
    </dl>
  );
}
