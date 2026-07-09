# GestorLoc Web

Sistema web moderno e responsivo gerado a partir do arquivo `GestorLoc.sql`.

## Tabelas implementadas

- `GrupoParceiros`
- `GrupoProdutos`
- `Locacao`
- `Parceiros`
- `Produtos`
- `Pedido`
- `ItemPedido`

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

### Pedidos

- `GET /api/pedidos`
- `GET /api/pedidos/:id`
- `POST /api/pedidos`
- `PUT /api/pedidos/:id`
- `DELETE /api/pedidos/:id`

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

## CONTROLE automático

Os cadastros abaixo geram automaticamente o campo `CONTROLE` no backend:

- `GrupoParceiros`: prefixo `GP`
- `GrupoProdutos`: prefixo `GPR`
- `Locacao`: prefixo `LOC`
- `Produtos`: prefixo `PROD`
- `Pedido`: prefixo `PED`

## Pedidos

Esta versão inclui o cadastro de Pedidos em modelo mestre-detalhe:

- Tela de listagem em `/pedidos`
- Pedido com vários itens em `ItemPedido`
- `NUMERO` sequencial gerado automaticamente
- `CONTROLE` automático no backend
- `DATALOCACAO` e `HORALOCACAO` preenchidos pelo sistema
- `DATADEVOLUCAO` calculada a partir de `DATALOCACAO + PERIODO`
- `PERIODO` recalculado quando a data de devolução é alterada
- `HORADEVOLUCAO` preenchida com `HORALOCACAO + 2 horas`
- `CLIENTE`, `VENDEDOR` e `MOTORISTA` vinculados à tabela `Parceiros`
- `ENDERECOINSTALACAO` preenchido com endereço do cliente selecionado
- `VALORPRODUTOS` e `VALORTOTAL` calculados pelo sistema
- `VALORTOTAL = VALORPRODUTOS + VALORFRETE - VALORACRESCIMODESCONTO`
- Itens vinculados a `Produtos`
- Campos do item preenchidos automaticamente a partir do produto selecionado
- Totais dos itens recalculados automaticamente

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
