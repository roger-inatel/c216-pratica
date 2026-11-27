export function ClienteLista({ clientes, onEdit, onDelete, busyId = null }) {
  if (clientes.length === 0) {
    return <p className="text-slate-600">Nenhum cliente encontrado.</p>;
  }

  return (
    <ul className="space-y-2">
      {clientes.map((cliente) => (
        <li
          key={cliente.id}
          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <p className="font-medium break-words">{cliente.nome}</p>
            <p className="text-sm break-words text-slate-600">
              {cliente.endereco}
            </p>
            {cliente.telefone && (
              <p className="text-sm text-slate-600">{cliente.telefone}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onEdit(cliente)}
              disabled={busyId === cliente.id}
              aria-label={`Editar ${cliente.nome}`}
              className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-60"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => onDelete(cliente)}
              disabled={busyId === cliente.id}
              aria-label={`Excluir ${cliente.nome}`}
              className="rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Excluir
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
