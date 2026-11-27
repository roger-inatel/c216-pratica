import { useCallback, useEffect, useState } from "react";
import { listClientes } from "../services/clientes";
import {
  createPedido,
  deletePedido,
  getPedido,
  getResumo,
  listPedidos,
  mudarStatus,
  updatePedido,
} from "../services/pedidos";
import { STATUS } from "../status";
import { Aviso } from "./Aviso";
import { PedidoForm } from "./PedidoForm";
import { PedidoLista } from "./PedidoLista";
import { ResumoPedidos } from "./ResumoPedidos";

function camposAlterados(original, values) {
  const alterados = {};
  if (values.descricao !== original.descricao) {
    alterados.descricao = values.descricao;
  }
  if (values.valor !== original.valor) alterados.valor = values.valor;
  return alterados;
}

export function PaginaPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erroAoCarregar, setErroAoCarregar] = useState("");
  const [aviso, setAviso] = useState(null);
  const [editando, setEditando] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const carregar = useCallback(async (status) => {
    setCarregando(true);
    setErroAoCarregar("");
    try {
      const [listaDePedidos, novoResumo, listaDeClientes] = await Promise.all([
        listPedidos({ status }),
        getResumo(),
        listClientes(),
      ]);
      setPedidos(listaDePedidos);
      setResumo(novoResumo);
      setClientes(listaDeClientes);
    } catch (error) {
      setErroAoCarregar(error.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar(filtro);
  }, [filtro, carregar]);

  // Executa uma acao num pedido, mostra o resultado e recarrega lista e resumo.
  async function agir(pedido, acao, sucesso) {
    setAviso(null);
    setBusyId(pedido.id);
    try {
      await acao();
      setAviso({ tipo: "sucesso", texto: sucesso });
      await carregar(filtro);
    } catch (error) {
      setAviso({ tipo: "erro", texto: error.message });
    } finally {
      setBusyId(null);
    }
  }

  async function salvar(values) {
    setAviso(null);
    if (editando) {
      const alterados = camposAlterados(editando, values);
      if (Object.keys(alterados).length > 0) {
        await updatePedido(editando.id, alterados);
      }
      setAviso({ tipo: "sucesso", texto: `Pedido #${editando.id} alterado.` });
      setEditando(null);
    } else {
      const criado = await createPedido(values);
      setAviso({ tipo: "sucesso", texto: `Pedido #${criado.id} registrado.` });
    }
    await carregar(filtro);
  }

  async function editar(pedido) {
    setAviso(null);
    setBusyId(pedido.id);
    try {
      setEditando(await getPedido(pedido.id));
    } catch (error) {
      setAviso({ tipo: "erro", texto: error.message });
    } finally {
      setBusyId(null);
    }
  }

  function trocarStatus(pedido, novo) {
    agir(
      pedido,
      () => mudarStatus(pedido.id, novo),
      `Pedido #${pedido.id} agora está ${STATUS[novo].rotulo.toLowerCase()}.`,
    );
    if (editando?.id === pedido.id) setEditando(null);
  }

  function excluir(pedido) {
    agir(
      pedido,
      () => deletePedido(pedido.id),
      `Pedido #${pedido.id} excluído.`,
    );
    if (editando?.id === pedido.id) setEditando(null);
  }

  return (
    <div className="space-y-6">
      <ResumoPedidos resumo={resumo} />

      <section aria-labelledby="form-pedido" className="space-y-3">
        <h2 id="form-pedido" className="text-xl font-semibold">
          {editando ? `Editando pedido #${editando.id}` : "Novo pedido"}
        </h2>
        {!carregando && clientes.length === 0 && !editando ? (
          <p className="text-slate-600">
            Cadastre um cliente na aba Clientes para registrar pedidos.
          </p>
        ) : (
          <PedidoForm
            key={editando?.id ?? "novo"}
            clientes={clientes}
            onSubmit={salvar}
            inicial={editando ?? undefined}
            rotuloBotao={editando ? "Salvar alterações" : "Registrar pedido"}
            onCancel={editando ? () => setEditando(null) : undefined}
          />
        )}
      </section>

      <section aria-labelledby="lista-pedidos" className="space-y-3">
        <h2 id="lista-pedidos" className="text-xl font-semibold">
          Pedidos
        </h2>
        <div className="space-y-1">
          <label htmlFor="filtro-status" className="block text-sm font-medium">
            Filtrar por status
          </label>
          <select
            id="filtro-status"
            value={filtro}
            onChange={(event) => setFiltro(event.target.value)}
            className="w-full rounded border border-slate-300 p-2 sm:w-auto"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([status, { rotulo }]) => (
              <option key={status} value={status}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>

        {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}
        {carregando && <p className="text-slate-600">Carregando pedidos...</p>}
        {!carregando && erroAoCarregar && (
          <Aviso
            acao={
              <button
                type="button"
                onClick={() => carregar(filtro)}
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
          <PedidoLista
            pedidos={pedidos}
            onMudarStatus={trocarStatus}
            onEdit={editar}
            onDelete={excluir}
            busyId={busyId}
          />
        )}
      </section>
    </div>
  );
}
