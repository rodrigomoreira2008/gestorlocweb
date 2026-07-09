# GestorLoc Web

Sistema web moderno e responsivo gerado a partir do arquivo `GestorLoc.sql`.

## Tabelas implementadas

- `GrupoParceiros`
- `GrupoProdutos`
- `Locacao`
- `Parceiros`
- `Produtos`

## Tecnologias

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Banco local: SQLite, com schema adaptado do Firebird/IBExpert

## Como rodar

### 1. Backend

```bash
cd backend
npm install
npm run db:init
npm run dev
```

API em:

```txt
http://localhost:3333
```

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Tela em:

```txt
http://localhost:5173
```

## Rotas da API

### Grupo Parceiros

- `GET /api/grupo-parceiros`
- `GET /api/grupo-parceiros/:id`
- `POST /api/grupo-parceiros`
- `PUT /api/grupo-parceiros/:id`
- `DELETE /api/grupo-parceiros/:id`

### Grupo Produtos

- `GET /api/grupo-produtos`
- `GET /api/grupo-produtos/:id`
- `POST /api/grupo-produtos`
- `PUT /api/grupo-produtos/:id`
- `DELETE /api/grupo-produtos/:id`

### Locação

- `GET /api/locacao`
- `GET /api/locacao/:id`
- `POST /api/locacao`
- `PUT /api/locacao/:id`
- `DELETE /api/locacao/:id`

### Produtos

- `GET /api/produtos`
- `GET /api/produtos/:id`
- `POST /api/produtos`
- `PUT /api/produtos/:id`
- `DELETE /api/produtos/:id`

### Parceiros

- `GET /api/parceiros`
- `GET /api/parceiros/:id`
- `POST /api/parceiros`
- `PUT /api/parceiros/:id`
- `DELETE /api/parceiros/:id`

## Observação

O arquivo original usa Firebird. Para facilitar a execução local, o projeto inclui um banco SQLite equivalente.
Caso queira manter Firebird em produção, a camada `backend/src/db/connection.ts` pode ser trocada por um driver Firebird.

## CONTROLE automático

Os cadastros abaixo geram automaticamente o campo `CONTROLE` no backend:

- `GrupoParceiros`: prefixo `GP`
- `GrupoProdutos`: prefixo `GPR`
- `Locacao`: prefixo `LOC`
- `Produtos`: prefixo `PROD`

Regras implementadas:

- O usuário não digita o campo `CONTROLE` no cadastro.
- O campo aparece como somente leitura na tela.
- Na edição, o `CONTROLE` não é alterado.
- O banco cria índice único para os campos de controle.

## Grupo de Produtos

Esta versão inclui o cadastro de Grupo Produtos, no mesmo padrão do Grupo Parceiros:

- Tela de listagem em `/grupo-produtos`
- Cadastro e edição em modal
- Campo `CONTROLE` somente leitura no frontend
- Geração automática do `CONTROLE` no backend
- API REST em `/api/grupo-produtos`
- Tabela SQLite `GrupoProdutos`

## Locação

Esta versão inclui o cadastro de Locação, no mesmo padrão do Grupo Produtos:

- Tela de listagem em `/locacao`
- Cadastro e edição em modal
- Campo `CONTROLE` somente leitura no frontend
- Geração automática do `CONTROLE` no backend com prefixo `LOC`
- API REST em `/api/locacao`
- Tabela SQLite `Locacao`
- Campos principais: `DESCRICAO`, `ENDERECOPADRAO`, `STATUS`, `TIPO` e `CONTROLE`

## Produtos

Esta versão inclui o cadastro de Produtos:

- Tela de listagem em `/produtos`
- Cadastro e edição em modal
- Campo `GRUPO` vinculado à tabela `GrupoProdutos`
- Campo `LOCACAO` vinculado à tabela `Locacao`
- Campo `CONTROLE` automático no backend com prefixo `PROD`
- Campo `UNIDADE` com opções `UNIDADE`, `METRO`, `CENTIMETRO`, `PACOTE`
- Campo `MOSTRACONTRATO` com opções `SIM`, `NAO`
- Campo `ACESSORIO` com opções `SIM`, `NAO`
- Campo `STATUS` calculado automaticamente pelo estoque
- API REST em `/api/produtos`
- Tabela SQLite `Produtos`

## Recriar banco local

Para atualizar/criar as tabelas, rode:

```bash
cd backend
npm run db:init
```

Se você já tiver um banco antigo e quiser recriar tudo do zero, apague o arquivo SQLite e rode novamente `npm run db:init`.

PowerShell:

```powershell
Remove-Item gestorloc.sqlite
npm run db:init
npm run dev
```
