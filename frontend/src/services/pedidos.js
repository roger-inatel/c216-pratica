import { comCorpoJson, comQuery, request } from "./api";

export function listPedidos({ status = "", clienteId = "" } = {}) {
  return request(comQuery("/pedidos", { status, cliente_id: clienteId }));
}

export function getPedido(id) {
  return request(`/pedidos/${id}`);
}

export function getResumo() {
  return request("/pedidos/resumo");
}

export function createPedido(dados) {
  return request("/pedidos", comCorpoJson("POST", dados));
}

export function updatePedido(id, campos) {
  return request(`/pedidos/${id}`, comCorpoJson("PATCH", campos));
}

export function mudarStatus(id, status) {
  return request(`/pedidos/${id}/status`, comCorpoJson("PATCH", { status }));
}

export function deletePedido(id) {
  return request(`/pedidos/${id}`, { method: "DELETE" });
}
