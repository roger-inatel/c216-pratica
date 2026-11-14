import { useState } from "react";
import { validateItem } from "../validation";

const VAZIO = { name: "", description: "" };

export function ItemForm({
  onSubmit,
  initialValues = VAZIO,
  submitLabel = "Adicionar",
  onCancel,
}) {
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(
    initialValues.description ?? "",
  );
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const result = validateItem({ name, description });
    setErrors(result.errors);
    setServerError("");
    if (Object.keys(result.errors).length > 0) return;

    setSaving(true);
    try {
      await onSubmit(result.values);
      setName("");
      setDescription("");
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="space-y-1">
        <label htmlFor="item-name" className="block text-sm font-medium">
          Nome
        </label>
        <input
          id="item-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={errors.name ? "true" : "false"}
          aria-describedby={errors.name ? "item-name-error" : undefined}
          className="w-full rounded border border-slate-300 p-2"
        />
        {errors.name && (
          <p id="item-name-error" role="alert" className="text-sm text-red-700">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="item-description" className="block text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="item-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={errors.description ? "true" : "false"}
          aria-describedby={
            errors.description ? "item-description-error" : undefined
          }
          rows={3}
          className="w-full rounded border border-slate-300 p-2"
        />
        {errors.description && (
          <p
            id="item-description-error"
            role="alert"
            className="text-sm text-red-700"
          >
            {errors.description}
          </p>
        )}
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700"
        >
          {serverError}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvando..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded border border-slate-300 px-4 py-2 font-medium hover:bg-slate-100 disabled:opacity-60"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
