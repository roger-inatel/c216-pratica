import { useState } from "react";
import { validarCliente } from "../validation";
import { Aviso } from "./Aviso";
import { Campo } from "./Campo";

const VAZIO = { nome: "", telefone: "", endereco: "" };

export function ClienteForm({
  onSubmit,
  inicial = VAZIO,
  rotuloBotao = "Cadastrar cliente",
  onCancel,
}) {
  const [campos, setCampos] = useState({
    nome: inicial.nome,
    telefone: inicial.telefone ?? "",
    endereco: inicial.endereco,
  });
  const [errors, setErrors] = useState({});
  const [erroDaApi, setErroDaApi] = useState("");
  const [salvando, setSalvando] = useState(false);

  function alterar(campo) {
    return (event) => setCampos({ ...campos, [campo]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const resultado = validarCliente(campos);
    setErrors(resultado.errors);
    setErroDaApi("");
    if (Object.keys(resultado.errors).length > 0) return;

    setSalvando(true);
    try {
      await onSubmit(resultado.values);
      setCampos(VAZIO);
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
      <Campo id="cliente-nome" rotulo="Nome" erro={errors.nome}>
        {(props) => (
          <input {...props} value={campos.nome} onChange={alterar("nome")} />
        )}
      </Campo>
      <Campo
        id="cliente-telefone"
        rotulo="Telefone (opcional)"
        erro={errors.telefone}
      >
        {(props) => (
          <input
            {...props}
            type="tel"
            value={campos.telefone}
            onChange={alterar("telefone")}
          />
        )}
      </Campo>
      <Campo id="cliente-endereco" rotulo="Endereço" erro={errors.endereco}>
        {(props) => (
          <input
            {...props}
            value={campos.endereco}
            onChange={alterar("endereco")}
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
