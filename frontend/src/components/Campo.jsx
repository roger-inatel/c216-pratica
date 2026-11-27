// Rotulo, campo e mensagem de erro ligados entre si (htmlFor, aria-describedby),
// para o leitor de tela e os testes encontrarem o campo pelo nome.
export function Campo({ id, rotulo, erro, children }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {rotulo}
      </label>
      {children({
        id,
        "aria-invalid": erro ? "true" : "false",
        "aria-describedby": erro ? `${id}-erro` : undefined,
        className: "w-full rounded border border-slate-300 p-2",
      })}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-sm text-red-700">
          {erro}
        </p>
      )}
    </div>
  );
}
