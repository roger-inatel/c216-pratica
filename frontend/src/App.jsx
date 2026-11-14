import { useCallback, useEffect, useState } from "react";
import { ItemForm } from "./components/ItemForm";
import { ItemList } from "./components/ItemList";
import {
  createItem,
  deleteItem,
  getItem,
  listItems,
  updateItem,
} from "./services/items";

function camposAlterados(original, values) {
  const alterados = {};
  if (values.name !== original.name) alterados.name = values.name;
  if (values.description !== (original.description ?? "")) {
    alterados.description = values.description;
  }
  return alterados;
}

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [listError, setListError] = useState("");
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setItems(await listItems());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function removerDaLista(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleSave(values) {
    if (editing) {
      const alterados = camposAlterados(editing, values);
      const salvo =
        Object.keys(alterados).length > 0
          ? await updateItem(editing.id, alterados)
          : editing;
      setItems((current) =>
        current.map((item) => (item.id === salvo.id ? salvo : item)),
      );
      setEditing(null);
      return;
    }

    const criado = await createItem(values);
    setItems((current) => [...current, criado]);
  }

  async function handleEdit(item) {
    setListError("");
    setBusyId(item.id);
    try {
      setEditing(await getItem(item.id));
    } catch (error) {
      setListError(error.message);
      if (error.status === 404) removerDaLista(item.id);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item) {
    setListError("");
    setBusyId(item.id);
    try {
      await deleteItem(item.id);
      removerDaLista(item.id);
      if (editing?.id === item.id) setEditing(null);
    } catch (error) {
      setListError(error.message);
      if (error.status === 404) removerDaLista(item.id);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl space-y-6 p-4 sm:p-6">
      <h1 className="text-3xl font-bold">Gerenciador de Itens</h1>

      <section aria-labelledby="form-heading" className="space-y-3">
        <h2 id="form-heading" className="text-xl font-semibold">
          {editing ? `Editando ${editing.name}` : "Novo item"}
        </h2>
        <ItemForm
          key={editing?.id ?? "novo"}
          onSubmit={handleSave}
          initialValues={editing ?? undefined}
          submitLabel={editing ? "Salvar alterações" : "Adicionar"}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      </section>

      <section aria-labelledby="items-heading" className="space-y-3">
        <h2 id="items-heading" className="text-xl font-semibold">
          Itens cadastrados
        </h2>

        {listError && (
          <p
            role="alert"
            className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700"
          >
            {listError}
          </p>
        )}

        {loading && <p className="text-slate-600">Carregando itens...</p>}

        {!loading && loadError && (
          <div
            role="alert"
            className="space-y-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <p>{loadError}</p>
            <button
              type="button"
              onClick={loadItems}
              className="rounded border border-red-300 px-3 py-1 hover:bg-red-100"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !loadError && (
          <ItemList
            items={items}
            onEdit={handleEdit}
            onDelete={handleDelete}
            busyId={busyId}
          />
        )}
      </section>
    </main>
  );
}
