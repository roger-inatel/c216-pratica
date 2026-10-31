import { describe, expect, it } from "vitest";
import {
  DESCRIPTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  validateItem,
} from "../../src/validation";

describe("validateItem", () => {
  it("aceita nome e descrição válidos", () => {
    const { errors, values } = validateItem({
      name: "Notebook",
      description: "14 polegadas",
    });

    expect(errors).toEqual({});
    expect(values).toEqual({ name: "Notebook", description: "14 polegadas" });
  });

  it("aceita item sem descrição", () => {
    const { errors } = validateItem({ name: "Mouse", description: "" });

    expect(errors).toEqual({});
  });

  it("rejeita nome vazio", () => {
    const { errors } = validateItem({ name: "", description: "" });

    expect(errors.name).toBe("O nome é obrigatório.");
  });

  it("rejeita nome só com espaços", () => {
    const { errors } = validateItem({ name: "   ", description: "" });

    expect(errors.name).toBe("O nome é obrigatório.");
  });

  it("remove os espaços das pontas antes de devolver os valores", () => {
    const { values } = validateItem({
      name: "  Teclado  ",
      description: "  ABNT2 ",
    });

    expect(values).toEqual({ name: "Teclado", description: "ABNT2" });
  });

  it("aceita nome com exatamente o limite de caracteres", () => {
    const { errors } = validateItem({
      name: "a".repeat(NAME_MAX_LENGTH),
      description: "",
    });

    expect(errors.name).toBeUndefined();
  });

  it("rejeita nome acima do limite de caracteres", () => {
    const { errors } = validateItem({
      name: "a".repeat(NAME_MAX_LENGTH + 1),
      description: "",
    });

    expect(errors.name).toBe(
      `O nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`,
    );
  });

  it("rejeita nome que já existe na lista", () => {
    const { errors } = validateItem({ name: " Notebook ", description: "" }, [
      "Notebook",
    ]);

    expect(errors.name).toBe("Já existe um item com esse nome.");
  });

  it("rejeita descrição acima do limite de caracteres", () => {
    const { errors } = validateItem({
      name: "Monitor",
      description: "a".repeat(DESCRIPTION_MAX_LENGTH + 1),
    });

    expect(errors.description).toBe(
      `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres.`,
    );
  });
});
