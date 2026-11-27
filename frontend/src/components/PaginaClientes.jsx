import { useCallback, useEffect, useState } from "react";
import {
  createCliente,
  deleteCliente,
  getCliente,
  listClientes,
  updateCliente,
} from "../services/clientes";
import { Aviso } from "./Aviso";
import { ClienteForm } from "./ClienteForm";
import { ClienteLista } from "./ClienteLista";

export function PaginaClientes() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erroAoCarregar, setErroAoCarregar] = useState("");
  const [aviso, setAviso] = useState(null);
  const [editando, setEditando] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const carregar = useCallback(async (termo) => {
    setCarregando(true);
    setErroAoCarregar("");
    try {
      setClientes(await listClientes(termo));
    } catch (error) {
      setErroAoCarregar(error.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar(busca);
  }, [busca, carregar]);

  async function salvar(dados) {
    setAviso(null);
    if (editando) {
      await updateCliente(editando.id, dados);
      setAviso({ tipo: "sucesso", texto: `Cliente ${dados.nome} atualizado.` });
      setEditando(null);
    } else {
      await createCliente(dados);
      setAviso({ tipo: "sucesso", texto: `Cliente ${dados.nome} cadastrado.` });
    }
    await carregar(busca);
  }

  async function editar(cliente) {
    setAviso(null);
    setBusyId(cliente.id);
    try {
      setEditando(await getCliente(cliente.id));
    } catch (error) {
      setAviso({ tipo: "erro", texto: error.message });
    } finally {
      setBusyId(null);
    }
  }

  async function excluir(cliente) {
    setAviso(null);
    setBusyId(cliente.id);
    try {
      await deleteCliente(cliente.id);
      if (editando?.id === cliente.id) setEditando(null);
      setAviso({ tipo: "sucesso", texto: `Cliente ${cliente.nome} excluído.` });
      await carregar(busca);
    } catch (error) {
      setAviso({ tipo: "erro", texto: error.message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="form-cliente" className="space-y-3">
        <h2 id="form-cliente" className="text-xl font-semibold">
          {editando ? `Editando ${editando.nome}` : "Novo cliente"}
        </h2>
        <ClienteForm
          key={editando?.id ?? "novo"}
          onSubmit={salvar}
          inicial={editando ?? undefined}
          rotuloBotao={editando ? "Salvar alterações" : "Cadastrar cliente"}
          onCancel={editando ? () => setEditando(null) : undefined}
        />
      </section>

      <section aria-labelledby="lista-clientes" className="space-y-3">
        <h2 id="lista-clientes" className="text-xl font-semibold">
          Clientes
        </h2>
        <div className="space-y-1">
          <label htmlFor="busca-cliente" className="block text-sm font-medium">
            Buscar cliente
          </label>
          <input
            id="busca-cliente"
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Parte do nome"
            className="w-full rounded border border-slate-300 p-2"
          />
        </div>

        {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}
        {carregando && <p className="text-slate-600">Carregando clientes...</p>}
        {!carregando && erroAoCarregar && (
          <Aviso
            acao={
              <button
                type="button"
                onClick={() => carregar(busca)}
                className="rounded border border-red-300 px-3 py-1 hover:bg-red-100"
              >
                Tentar novamente
              </button>
            }
          >
            {erroAoCarregar}
          </Aviso>
        )}
        {!carregando && !erroAoCarregar && (
          <ClienteLista
            clientes={clientes}
            onEdit={editar}
            onDelete={excluir}
            busyId={busyId}
          />
        )}
      </section>
    </div>
  );
}
