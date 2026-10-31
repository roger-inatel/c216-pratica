import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../../src/App";

async function cadastrar(user, name, description = "") {
  await user.type(screen.getByLabelText("Nome"), name);
  if (description) {
    await user.type(screen.getByLabelText("Descrição"), description);
  }
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
}

describe("App", () => {
  it("começa sem itens", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Gerenciador de Itens" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
  });

  it("cadastra um item e o exibe na lista", async () => {
    const user = userEvent.setup();
    render(<App />);

    await cadastrar(user, "Notebook", "14 polegadas");

    expect(screen.getByText("Notebook")).toBeInTheDocument();
    expect(screen.getByText("14 polegadas")).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum item cadastrado."),
    ).not.toBeInTheDocument();
  });

  it("mantém a ordem de cadastro", async () => {
    const user = userEvent.setup();
    render(<App />);

    await cadastrar(user, "Notebook");
    await cadastrar(user, "Mouse");

    const linhas = screen.getAllByRole("listitem");
    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toHaveTextContent("Notebook");
    expect(linhas[1]).toHaveTextContent("Mouse");
  });

  it("não adiciona item inválido à lista", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "O nome é obrigatório.",
    );
    expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
  });

  it("recusa um nome repetido", async () => {
    const user = userEvent.setup();
    render(<App />);

    await cadastrar(user, "Notebook");
    await cadastrar(user, "Notebook");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Já existe um item com esse nome.",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });
});
