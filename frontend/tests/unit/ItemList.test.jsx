import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemList } from "../../src/components/ItemList";

const ITENS = [
  { id: 1, name: "Notebook", description: "14 polegadas" },
  { id: 2, name: "Mouse", description: null },
];

describe("ItemList", () => {
  it("mostra mensagem quando não há itens", () => {
    render(<ItemList items={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("mostra um item por linha, com nome e descrição", () => {
    render(<ItemList items={ITENS} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const linhas = screen.getAllByRole("listitem");
    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toHaveTextContent("Notebook");
    expect(linhas[0]).toHaveTextContent("14 polegadas");
    expect(linhas[1]).toHaveTextContent("Mouse");
  });

  it("avisa qual item foi escolhido para editar ou excluir", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<ItemList items={ITENS} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Editar Mouse" }));
    await user.click(screen.getByRole("button", { name: "Excluir Notebook" }));

    expect(onEdit).toHaveBeenCalledWith(ITENS[1]);
    expect(onDelete).toHaveBeenCalledWith(ITENS[0]);
  });

  it("desabilita os botões do item que está sendo processado", () => {
    render(
      <ItemList items={ITENS} onEdit={vi.fn()} onDelete={vi.fn()} busyId={1} />,
    );

    expect(
      screen.getByRole("button", { name: "Excluir Notebook" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Excluir Mouse" })).toBeEnabled();
  });
});
