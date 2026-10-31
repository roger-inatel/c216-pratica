# Frontend

Interface em React para cadastrar e listar itens (nome e descricao). Nesta etapa os dados
ficam so na memoria do navegador: nao ha chamada ao backend, e a lista volta vazia ao
recarregar a pagina. A integracao com a API fica para a Pratica 7.

## Ferramentas

- `react` - componentes da interface
- `vite` - servidor de desenvolvimento e build
- `tailwindcss` (v4, plugin do Vite) - estilos direto nas classes do JSX, sem `tailwind.config.js`
- `@biomejs/biome` - lint e formatacao, no papel que o Ruff faz no backend
- `vitest` com `@testing-library/react` e `jsdom` - testes unitarios e de integracao
- `@playwright/test` - testes E2E no Chromium

Pre-requisito: Node.js 22 ou superior, com npm.

## Estrutura

```text
frontend/
├── src/
│   ├── components/
│   │   ├── ItemForm.jsx    # formulario e mensagens de erro
│   │   └── ItemList.jsx    # listagem e estado vazio
│   ├── App.jsx             # guarda a lista de itens
│   ├── validation.js       # regras de validacao (funcao pura)
│   ├── index.css
│   └── main.jsx
├── tests/
│   ├── setup.js            # matchers do jest-dom e limpeza do DOM
│   ├── unit/               # validacao e cada componente isolado
│   ├── integration/        # App inteiro: formulario + lista
│   └── e2e/                # Playwright no navegador
├── biome.json
├── playwright.config.js
└── vite.config.js          # Vite, Tailwind e Vitest
```

## Regras de validacao

As mesmas do `ItemCreate` no backend:

- `name` obrigatorio, sem espacos nas pontas, com ate 100 caracteres;
- `name` nao pode repetir um item ja cadastrado (no backend isso e o 409);
- `description` opcional, com ate 500 caracteres.

## Comandos

A partir da raiz do repositorio:

```bash
make frontend-install   # npm ci
make frontend-dev       # http://localhost:5173
make frontend-lint
make frontend-format
make frontend-check     # lint + formatacao + imports, sem alterar arquivos
make frontend-test      # Vitest
make frontend-test-e2e  # Playwright
make frontend-build     # gera frontend/dist
```

Dentro de `frontend/`, os equivalentes sao `npm ci`, `npm run dev`, `npm run lint`,
`npm run format`, `npm run check`, `npm run test`, `npm run test:e2e` e `npm run build`.

Antes do primeiro `make frontend-test-e2e`, instale o navegador uma vez por maquina:

```bash
cd frontend
npx playwright install chromium
```

O Playwright sobe o Vite sozinho em `127.0.0.1:5173`. Se o `make frontend-dev` ja estiver
rodando nessa porta, ele reaproveita o servidor.

## Testes

- `tests/unit/validation.test.js` - limites de tamanho, nome vazio, nome repetido e remocao dos espacos;
- `tests/unit/ItemForm.test.jsx` - o formulario so chama `onAdd` com dados validos e limpa os campos depois;
- `tests/unit/ItemList.test.jsx` - estado vazio e um `listitem` por item;
- `tests/integration/App.test.jsx` - cadastro, ordem da lista, item invalido e nome repetido no App inteiro;
- `tests/e2e/items.spec.js` - o mesmo fluxo no Chromium, incluindo a lista vazia depois de recarregar.

O Vitest so procura em `tests/unit` e `tests/integration`, para nao tentar rodar os arquivos
do Playwright.
