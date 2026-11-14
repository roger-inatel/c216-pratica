export const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const MENSAGENS_POR_STATUS = {
  404: "Item não encontrado. Ele pode ter sido excluído.",
  409: "Já existe um item com esse nome.",
  422: "A API recusou os dados enviados.",
};

function mensagemDeErro(status, corpo) {
  if (MENSAGENS_POR_STATUS[status]) return MENSAGENS_POR_STATUS[status];
  if (status >= 500) return "Erro no servidor. Tente novamente.";
  // O FastAPI devolve "detail" como texto nos erros de regra e como lista no 422.
  if (typeof corpo?.detail === "string") return corpo.detail;
  return `A API respondeu com erro ${status}.`;
}

export async function request(caminho, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, opcoes);
  } catch {
    throw new ApiError(
      "Não foi possível conectar à API. Confira se o backend está rodando.",
      0,
    );
  }

  if (resposta.status === 204) return null;

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ApiError(mensagemDeErro(resposta.status, corpo), resposta.status);
  }
  return corpo;
}
