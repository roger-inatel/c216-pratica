import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemForm } from "../../src/components/ItemForm";

describe("ItemForm", () => {
  it("mostra erro e não chama onSubmit com nome vazio", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ItemForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "O nome é obrigatório.",
    );
    expect(screen.getByLabelText("Nome")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envia os valores sem espaços nas pontas e limpa os campos", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ItemForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "  Notebook ");
    await user.type(screen.getByLabelText("Descrição"), "14 polegadas ");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Notebook",
      description: "14 polegadas",
    });
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByLabelText("Descrição")).toHaveValue("");
  });

  it("mostra o erro da API e mantém o que foi digitado", async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new Error("Ja existe um item com o nome Mouse"));
    render(<ItemForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ja existe um item com o nome Mouse",
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("Mouse");
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeEnabled();
  });

  it("desabilita o botão enquanto salva", async () => {
    const user = userEvent.setup();
    let concluir;
    const onSubmit = vi.fn(
      () =>
        new Promise((resolve) => {
          concluir = resolve;
        }),
    );
    render(<ItemForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
    concluir();
    expect(
      await screen.findByRole("button", { name: "Adicionar" }),
    ).toBeEnabled();
  });

  it("no modo edição começa preenchido e permite cancelar", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ItemForm
        onSubmit={vi.fn()}
        initialValues={{ id: 1, name: "Mouse", description: null }}
        submitLabel="Salvar alterações"
        onCancel={onCancel}
      />,
    );

    expect(screen.getByLabelText("Nome")).toHaveValue("Mouse");
    expect(screen.getByLabelText("Descrição")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
