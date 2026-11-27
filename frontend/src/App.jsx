import { useState } from "react";
import { PaginaClientes } from "./components/PaginaClientes";
import { PaginaPedidos } from "./components/PaginaPedidos";

const ABAS = [
  { id: "pedidos", rotulo: "Pedidos" },
  { id: "clientes", rotulo: "Clientes" },
];

export default function App() {
  const [aba, setAba] = useState("pedidos");

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-6 p-4 sm:p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Controle de Entregas</h1>
        <p className="text-slate-600">
          Pedidos dos clientes, do registro até a entrega.
        </p>
      </header>

      <nav aria-label="Seções" className="flex gap-2 border-b border-slate-200">
        {ABAS.map(({ id, rotulo }) => (
          <button
            key={id}
            type="button"
            aria-current={aba === id ? "page" : undefined}
            onClick={() => setAba(id)}
            className={`-mb-px border-b-2 px-4 py-2 font-medium ${
              aba === id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </nav>

      {aba === "pedidos" ? <PaginaPedidos /> : <PaginaClientes />}
    </main>
  );
}
