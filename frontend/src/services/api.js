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

function mensagemDeErro(status, corpo) {
  // As regras de negocio do backend ja respondem com uma frase pronta em "detail".
  if (typeof corpo?.detail === "string") return corpo.detail;
  if (status === 422)
    return "Dados inválidos. Confira os campos e tente de novo.";
  if (status >= 500) return "Erro no servidor. Tente novamente em instantes.";
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

export function comCorpoJson(method, dados) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  };
}

export function comQuery(caminho, parametros) {
  const query = new URLSearchParams();
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== "") {
      query.set(chave, valor);
    }
  }
  const texto = query.toString();
  return texto ? `${caminho}?${texto}` : caminho;
}
