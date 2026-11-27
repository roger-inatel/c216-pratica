import { describe, expect, it } from "vitest";
import {
  ACOES_POR_STATUS,
  formatarMoeda,
  podeEditar,
  podeExcluir,
  STATUS,
} from "../../src/status";

describe("regras de status na tela", () => {
  it("só oferece os caminhos que o backend aceita", () => {
    const caminhos = Object.fromEntries(
      Object.entries(ACOES_POR_STATUS).map(([status, acoes]) => [
        status,
        acoes.map((acao) => acao.para),
      ]),
    );

    expect(caminhos).toEqual({
      aberto: ["em_rota", "cancelado"],
      em_rota: ["entregue", "cancelado"],
      entregue: [],
      cancelado: [],
    });
  });

  it("tem rótulo para todo status", () => {
    expect(Object.keys(STATUS)).toEqual(Object.keys(ACOES_POR_STATUS));
  });

  it.each([
    ["aberto", true, true],
    ["em_rota", false, false],
    ["entregue", false, false],
    ["cancelado", false, true],
  ])("pedido %s: editar=%s, excluir=%s", (status, editar, excluir) => {
    expect(podeEditar({ status })).toBe(editar);
    expect(podeExcluir({ status })).toBe(excluir);
  });

  it("formata o valor em reais", () => {
    expect(formatarMoeda(1049).replace(/\s/g, " ")).toBe("R$ 1.049,00");
  });
});
