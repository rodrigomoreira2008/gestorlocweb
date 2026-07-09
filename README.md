# GestorLoc Web

Sistema web moderno e responsivo gerado a partir do arquivo `GestorLoc.sql`.

## Tabelas implementadas

- `GrupoParceiros`
- `Parceiros`

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

### Parceiros

- `GET /api/parceiros`
- `GET /api/parceiros/:id`
- `POST /api/parceiros`
- `PUT /api/parceiros/:id`
- `DELETE /api/parceiros/:id`

## Observação

O arquivo original usa Firebird. Para facilitar a execução local, o projeto inclui um banco SQLite equivalente.
Caso queira manter Firebird em produção, a camada `backend/src/db/connection.ts` pode ser trocada por um driver Firebird.

## Atualização: CONTROLE automático em GrupoParceiros

Nesta versão, o campo `CONTROLE` da tabela `GrupoParceiros` é gerado automaticamente pelo backend no cadastro.

Formato exemplo:

```txt
GP2607031430251234829
```

Regras implementadas:

- O usuário não digita o campo `CONTROLE` no cadastro.
- O campo aparece como somente leitura na tela.
- Na edição, o `CONTROLE` não é alterado.
- O banco cria índice único para `GrupoParceiros.CONTROLE`.

Para aplicar o banco do zero durante os testes:

```bash
cd backend
npm install
npm run db:init
npm run dev
```

Se você já criou um banco SQLite antigo e quiser recriar:

```powershell
Remove-Item data\gestorloc.sqlite
npm run db:init
npm run dev
```

## Grupo de Produtos

Esta versão inclui o cadastro de Grupo Produtos, no mesmo padrão do Grupo Parceiros:

- Tela de listagem em `/grupo-produtos`
- Cadastro e edição em modal
- Campo `CONTROLE` somente leitura no frontend
- Geração automática do `CONTROLE` no backend
- API REST em `/api/grupo-produtos`
- Tabela SQLite `GrupoProdutos`

Para atualizar/criar as tabelas, rode:

```bash
cd backend
npm run db:init
```

Se você já tiver um banco antigo e quiser recriar tudo do zero, apague o arquivo `backend/data/gestorloc.sqlite` e rode novamente `npm run db:init`.
