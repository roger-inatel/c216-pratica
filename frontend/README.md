# Frontend

Interface em React para listar, cadastrar, editar e excluir itens (nome e descricao). Os dados
vem da API FastAPI do `backend/`, que grava no PostgreSQL: a lista continua igual depois de
recarregar a pagina.

## Ferramentas

- `react` - componentes da interface
- `vite` - servidor de desenvolvimento e build
- `tailwindcss` (v4, plugin do Vite) - estilos direto nas classes do JSX, sem `tailwind.config.js`
- `@biomejs/biome` - lint e formatacao, no papel que o Ruff faz no backend
- `vitest` com `@testing-library/react` e `jsdom` - testes unitarios e de integracao
- `@playwright/test` - testes E2E no Chromium
- `nginx` - serve o build dentro do container

Pre-requisito: Node.js 22 ou superior, com npm.

## Estrutura

```text
frontend/
├── src/
│   ├── components/
│   │   ├── ItemForm.jsx    # formulario de cadastro e edicao, com os erros
│   │   └── ItemList.jsx    # listagem, estado vazio e botoes de editar e excluir
│   ├── services/
│   │   ├── api.js          # fetch, URL da API e traducao dos erros
│   │   └── items.js        # uma funcao para cada rota de /items
│   ├── App.jsx             # carrega a lista e liga a tela ao servico
│   ├── validation.js       # validacao antes de chamar a API (funcao pura)
│   ├── index.css
│   └── main.jsx
├── tests/
│   ├── setup.js            # matchers do jest-dom e limpeza do DOM
│   ├── helpers/fakeApi.js  # API falsa em memoria para o Vitest
│   ├── unit/               # validacao, servico e cada componente isolado
│   ├── integration/        # App inteiro sobre a API falsa
│   └── e2e/                # Playwright contra a aplicacao no ar
├── Dockerfile              # build do Vite + nginx
├── nginx.conf
├── biome.json
├── playwright.config.js
└── vite.config.js          # Vite, Tailwind e Vitest
```

## Consumo da API

`src/services/items.js` espelha as seis rotas do backend:

| Funcao | Requisicao |
| --- | --- |
| `listItems()` | `GET /items?limit=100` |
| `getItem(id)` | `GET /items/{id}` |
| `createItem(dados)` | `POST /items` |
| `replaceItem(id, dados)` | `PUT /items/{id}` |
| `updateItem(id, campos)` | `PATCH /items/{id}` |
| `deleteItem(id)` | `DELETE /items/{id}` |

Na tela, editar busca o item com `getItem` e salva com `updateItem`, enviando so os campos que
mudaram. O `replaceItem` fica disponivel no servico e coberto pelos testes unitarios.

Todas passam por `request()` em `src/services/api.js`, que trata tres casos:

- a API nao responde: "Nao foi possivel conectar a API";
- a API responde com erro: mensagem pelo status, como "Ja existe um item com esse nome" no 409,
  "Item nao encontrado" no 404 e "Erro no servidor" nos 5xx; nos demais, o `detail` do backend;
- sucesso: devolve o JSON, ou `null` no `204` do DELETE.

O endereco da API vem de `VITE_API_URL` (padrao `http://localhost:8000`). Quem faz a requisicao
e o navegador, entao a URL e a porta publicada do backend no host, e nao o nome do servico no
Compose. O backend so aceita as origens listadas em `CORS_ORIGINS`.

## Regras de validacao

Antes de enviar, o formulario confere o mesmo que o `ItemCreate` do backend:

- `name` obrigatorio, sem espacos nas pontas, com ate 100 caracteres;
- `description` opcional, com ate 500 caracteres.

Nome repetido quem recusa e a API, com 409, e a mensagem aparece no formulario sem apagar o que
foi digitado.

## Comandos

A partir da raiz do repositorio:

```bash
make frontend-install   # npm ci
make frontend-dev       # Vite em http://localhost:5173 (precisa do backend no ar)
make frontend-lint
make frontend-format
make frontend-check     # lint + formatacao + imports, sem alterar arquivos
make frontend-test      # Vitest
make frontend-build     # gera frontend/dist
make e2e                # sobe uma pilha separada, roda o Playwright e derruba
make frontend-test-e2e  # roda o Playwright contra a aplicacao ja no ar (portas 5173 e 8000)
```

Dentro de `frontend/`, os equivalentes sao `npm ci`, `npm run dev`, `npm run lint`,
`npm run format`, `npm run check`, `npm run test`, `npm run build` e `npm run test:e2e`.

Antes do primeiro E2E, instale o navegador uma vez por maquina:

```bash
cd frontend
npx playwright install chromium
```

## Testes

- `tests/unit/validation.test.js` - limites de tamanho, nome vazio e remocao dos espacos;
- `tests/unit/items.test.js` - URL, metodo e corpo de cada funcao do servico, e as mensagens de
  erro (404, 409, 422, 500 e API fora do ar), com o `fetch` simulado;
- `tests/unit/ItemForm.test.jsx` - validacao, erro da API mantendo os campos, botao desabilitado
  enquanto salva e modo de edicao;
- `tests/unit/ItemList.test.jsx` - estado vazio, um `listitem` por item e os botoes de cada item;
- `tests/integration/App.test.jsx` - a tela inteira sobre a API falsa: carregamento, API fora do
  ar com "Tentar novamente", cadastro, 409, edicao com PATCH, exclusao e item ja excluido (404);
- `tests/e2e/items.spec.js` - no Chromium, contra banco, backend e frontend de verdade:
  cadastro que continua depois de recarregar, 409, edicao e exclusao.

Os testes do Vitest nao dependem do backend: a API e simulada. O E2E e o que prova a
integracao de verdade - se o CORS estiver errado, ele falha. Cada teste E2E usa nomes unicos e
apaga pela API o que criou.

O Vitest so procura em `tests/unit` e `tests/integration`, para nao tentar rodar os arquivos
do Playwright.
