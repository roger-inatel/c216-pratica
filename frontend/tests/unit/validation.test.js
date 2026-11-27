import { describe, expect, it } from "vitest";
import { lerValor, validarCliente, validarPedido } from "../../src/validation";

describe("validarCliente", () => {
  const valido = { nome: "Mercado", telefone: "", endereco: "Rua A, 10" };

  it("aceita cliente sem telefone e manda null para a API", () => {
    const { errors, values } = validarCliente(valido);

    expect(errors).toEqual({});
    expect(values.telefone).toBeNull();
  });

  it("remove os espaços das pontas", () => {
    const { values } = validarCliente({
      nome: "  Mercado ",
      telefone: " 3599999-0000 ",
      endereco: " Rua A ",
    });

    expect(values).toEqual({
      nome: "Mercado",
      telefone: "3599999-0000",
      endereco: "Rua A",
    });
  });

  it("exige nome e endereço", () => {
    const { errors } = validarCliente({
      nome: " ",
      telefone: "",
      endereco: "",
    });

    expect(errors.nome).toBe("Informe o nome do cliente.");
    expect(errors.endereco).toBe("Informe o endereço de entrega.");
  });

  it.each(["abc", "123", "35 9999-0000 ramal 2"])(
    "recusa telefone inválido: %s",
    (telefone) => {
      const { errors } = validarCliente({ ...valido, telefone });

      expect(errors.telefone).toMatch("Telefone inválido");
    },
  );

  it("limita o nome a 100 caracteres", () => {
    const { errors } = validarCliente({ ...valido, nome: "a".repeat(101) });

    expect(errors.nome).toBe("Use no máximo 100 caracteres.");
  });
});

describe("lerValor", () => {
  it.each([
    ["49,90", 49.9],
    ["49.90", 49.9],
    ["1.250,00", 1250],
    ["10", 10],
    [" 7,5 ", 7.5],
  ])("lê %s como %s", (texto, esperado) => {
    expect(lerValor(texto)).toBe(esperado);
  });

  it("devolve null para campo vazio", () => {
    expect(lerValor("  ")).toBeNull();
  });

  it.each(["abc", "10,999", "1,2,3"])("marca %s como inválido", (texto) => {
    expect(lerValor(texto)).toBeNaN();
  });
});

describe("validarPedido", () => {
  const valido = { clienteId: "3", descricao: "Caixas", valor: "49,90" };

  it("converte os campos para o formato da API", () => {
    const { errors, values } = validarPedido(valido);

    expect(errors).toEqual({});
    expect(values).toEqual({ cliente_id: 3, descricao: "Caixas", valor: 49.9 });
  });

  it("exige cliente, descrição e valor", () => {
    const { errors } = validarPedido({
      clienteId: "",
      descricao: "",
      valor: "",
    });

    expect(Object.keys(errors).sort()).toEqual([
      "clienteId",
      "descricao",
      "valor",
    ]);
  });

  it.each([
    ["0", "O valor precisa ser maior que zero."],
    ["0,00", "O valor precisa ser maior que zero."],
    ["dez", "Valor inválido. Use até duas casas decimais, ex.: 49,90."],
  ])("recusa o valor %s", (valor, mensagem) => {
    expect(validarPedido({ ...valido, valor }).errors.valor).toBe(mensagem);
  });
});
