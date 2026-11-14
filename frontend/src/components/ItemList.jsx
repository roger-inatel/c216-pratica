export function ItemList({ items, onEdit, onDelete, busyId = null }) {
  if (items.length === 0) {
    return <p className="text-slate-600">Nenhum item cadastrado.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <p className="font-medium break-words">{item.name}</p>
            {item.description && (
              <p className="text-sm whitespace-pre-line break-words text-slate-600">
                {item.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onEdit(item)}
              disabled={busyId === item.id}
              aria-label={`Editar ${item.name}`}
              className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-60"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              disabled={busyId === item.id}
              aria-label={`Excluir ${item.name}`}
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
