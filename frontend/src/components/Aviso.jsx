const ESTILOS = {
  erro: "border-red-200 bg-red-50 text-red-700",
  sucesso: "border-green-200 bg-green-50 text-green-800",
};

export function Aviso({ tipo = "erro", children, acao }) {
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={`flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm ${ESTILOS[tipo]}`}
    >
      <p>{children}</p>
      {acao}
    </div>
  );
}
