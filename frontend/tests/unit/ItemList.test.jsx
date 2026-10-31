import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ItemList } from "../../src/components/ItemList";

describe("ItemList", () => {
  it("mostra mensagem quando não há itens", () => {
    render(<ItemList items={[]} />);

    expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("mostra um item por linha, com nome e descrição", () => {
    render(
      <ItemList
        items={[
          { id: "1", name: "Notebook", description: "14 polegadas" },
          { id: "2", name: "Mouse", description: "" },
        ]}
      />,
    );

    const linhas = screen.getAllByRole("listitem");
    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toHaveTextContent("Notebook");
    expect(linhas[0]).toHaveTextContent("14 polegadas");
    expect(linhas[1]).toHaveTextContent("Mouse");
  });
});
