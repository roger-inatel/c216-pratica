import { comCorpoJson, comQuery, request } from "./api";

export function listClientes(busca = "") {
  return request(comQuery("/clientes", { busca }));
}

export function getCliente(id) {
  return request(`/clientes/${id}`);
}

export function createCliente(dados) {
  return request("/clientes", comCorpoJson("POST", dados));
}

export function updateCliente(id, dados) {
  return request(`/clientes/${id}`, comCorpoJson("PUT", dados));
}

export function deleteCliente(id) {
  return request(`/clientes/${id}`, { method: "DELETE" });
}
