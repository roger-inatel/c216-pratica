import { request } from "./api";

// O GET /items do backend devolve 10 itens por padrao; 100 e o maximo aceito.
export const LIST_LIMIT = 100;

function comCorpo(method, dados) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  };
}

export function listItems() {
  return request(`/items?limit=${LIST_LIMIT}`);
}

export function getItem(id) {
  return request(`/items/${id}`);
}

export function createItem({ name, description }) {
  return request("/items", comCorpo("POST", { name, description }));
}

export function replaceItem(id, { name, description }) {
  return request(`/items/${id}`, comCorpo("PUT", { name, description }));
}

export function updateItem(id, campos) {
  return request(`/items/${id}`, comCorpo("PATCH", campos));
}

export function deleteItem(id) {
  return request(`/items/${id}`, { method: "DELETE" });
}
