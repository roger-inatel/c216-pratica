import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemForm } from "../../src/components/ItemForm";

describe("ItemForm", () => {
  it("mostra erro e não chama onAdd com nome vazio", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ItemForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "O nome é obrigatório.",
    );
    expect(screen.getByLabelText("Nome")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("chama onAdd com os valores sem espaços nas pontas", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ItemForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Nome"), "  Notebook ");
    await user.type(screen.getByLabelText("Descrição"), "14 polegadas ");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd).toHaveBeenCalledWith({
      name: "Notebook",
      description: "14 polegadas",
    });
  });

  it("limpa os campos depois de um envio válido", async () => {
    const user = userEvent.setup();
    render(<ItemForm onAdd={vi.fn()} />);

    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.type(screen.getByLabelText("Descrição"), "Sem fio");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByLabelText("Descrição")).toHaveValue("");
  });

  it("não chama onAdd com nome que já existe", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ItemForm onAdd={onAdd} existingNames={["Mouse"]} />);

    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Já existe um item com esse nome.",
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("Mouse");
    expect(onAdd).not.toHaveBeenCalled();
  });
});
