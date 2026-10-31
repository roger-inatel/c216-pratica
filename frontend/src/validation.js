// Mesmos limites do ItemCreate no backend.
export const NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

export function validateItem({ name, description }, existingNames = []) {
  const errors = {};
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  if (!trimmedName) {
    errors.name = "O nome é obrigatório.";
  } else if (trimmedName.length > NAME_MAX_LENGTH) {
    errors.name = `O nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`;
  } else if (existingNames.includes(trimmedName)) {
    errors.name = "Já existe um item com esse nome.";
  }

  if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres.`;
  }

  return {
    errors,
    values: { name: trimmedName, description: trimmedDescription },
  };
}
