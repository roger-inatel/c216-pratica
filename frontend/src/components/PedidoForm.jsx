import { useState } from "react";
import { validarPedido } from "../validation";
import { Aviso } from "./Aviso";
import { Campo } from "./Campo";

function valorParaTexto(valor) {
  return valor === undefined ? "" : valor.toFixed(2).replace(".", ",");
}

export function PedidoForm({
  clientes,
  onSubmit,
  inicial,
  rotuloBotao = "Registrar pedido",
  onCancel,
}) {
  const editando = Boolean(inicial);
  const [campos, setCampos] = useState({
    clienteId: inicial ? String(inicial.cliente_id) : "",
    descricao: inicial?.descricao ?? "",
    valor: valorParaTexto(inicial?.valor),
  });
  const [errors, setErrors] = useState({});
  const [erroDaApi, setErroDaApi] = useState("");
  const [salvando, setSalvando] = useState(false);

  function alterar(campo) {
    return (event) => setCampos({ ...campos, [campo]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const resultado = validarPedido(campos);
    setErrors(resultado.errors);
    setErroDaApi("");
    if (Object.keys(resultado.errors).length > 0) return;

    setSalvando(true);
    try {
      await onSubmit(resultado.values);
      setCampos({ clienteId: "", descricao: "", valor: "" });
    } catch (error) {
      setErroDaApi(error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <Campo id="pedido-cliente" rotulo="Cliente" erro={errors.clienteId}>
        {(props) => (
          <select
            {...props}
            value={campos.clienteId}
            onChange={alterar("clienteId")}
            disabled={editando}
          >
            <option value="">Escolha um cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        )}
      </Campo>
      <Campo id="pedido-descricao" rotulo="Descrição" erro={errors.descricao}>
        {(props) => (
          <input
            {...props}
            value={campos.descricao}
            onChange={alterar("descricao")}
            placeholder="Ex.: 10 caixas de leite"
          />
        )}
      </Campo>
      <Campo id="pedido-valor" rotulo="Valor (R$)" erro={errors.valor}>
        {(props) => (
          <input
            {...props}
            inputMode="decimal"
            value={campos.valor}
            onChange={alterar("valor")}
            placeholder="Ex.: 49,90"
          />
        )}
      </Campo>

      {erroDaApi && <Aviso>{erroDaApi}</Aviso>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={salvando}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : rotuloBotao}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={salvando}
            className="rounded border border-slate-300 px-4 py-2 font-medium hover:bg-slate-100"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
