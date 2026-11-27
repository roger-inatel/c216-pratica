// Mesmos limites dos schemas do backend; a API continua sendo quem decide.
const TELEFONE = /^[0-9()+\- ]{8,20}$/;

export function validarCliente({ nome, telefone, endereco }) {
  const errors = {};
  const values = {
    nome: nome.trim(),
    telefone: telefone.trim() || null,
    endereco: endereco.trim(),
  };

  if (!values.nome) errors.nome = "Informe o nome do cliente.";
  else if (values.nome.length > 100)
    errors.nome = "Use no máximo 100 caracteres.";

  if (values.telefone && !TELEFONE.test(values.telefone)) {
    errors.telefone = "Telefone inválido. Use só números, espaços, ( ) + e -.";
  }

  if (!values.endereco) errors.endereco = "Informe o endereço de entrega.";
  else if (values.endereco.length > 200) {
    errors.endereco = "Use no máximo 200 caracteres.";
  }

  return { errors, values };
}

// Aceita "49,90", "49.90" e "1.250,00", como a pessoa digitaria.
export function lerValor(texto) {
  const limpo = String(texto).trim().replace(/\s/g, "");
  if (!limpo) return null;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return Number.NaN;
  return Number(normalizado);
}

export function validarPedido({ clienteId, descricao, valor }) {
  const errors = {};
  const numero = lerValor(valor);
  const values = {
    cliente_id: Number(clienteId),
    descricao: descricao.trim(),
    valor: numero,
  };

  if (!clienteId) errors.clienteId = "Escolha o cliente.";

  if (!values.descricao) errors.descricao = "Descreva o que vai ser entregue.";
  else if (values.descricao.length > 200) {
    errors.descricao = "Use no máximo 200 caracteres.";
  }

  if (numero === null) errors.valor = "Informe o valor do pedido.";
  else if (Number.isNaN(numero)) {
    errors.valor = "Valor inválido. Use até duas casas decimais, ex.: 49,90.";
  } else if (numero <= 0) errors.valor = "O valor precisa ser maior que zero.";

  return { errors, values };
}
