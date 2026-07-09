import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { gerarControlePedido } from '../utils/gerarControle.js';

const router = Router();

function n(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullable(value: any) {
  return value === '' || value === undefined ? null : value;
}

function addDays(dateText: string, days: number) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function diffDays(startText: string, endText: string) {
  const start = new Date(`${startText}T00:00:00`).getTime();
  const end = new Date(`${endText}T00:00:00`).getTime();
  return Math.max(0, Math.round((end - start) / 86400000));
}

function erroRegra(message: string) {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = 400;
  return error;
}

function validarProdutosRepetidos(itens: any[] = []) {
  const produtos = new Set<string>();

  for (const item of itens) {
    const produto = String(item.PRODUTO ?? '').trim();
    if (!produto) continue;

    if (produtos.has(produto)) {
      throw erroRegra('O produto escolhido já está cadastrado no pedido.');
    }

    produtos.add(produto);
  }
}

async function nextNumero(db: any) {
  const row = await db.get('SELECT COALESCE(MAX(NUMERO), 0) + 1 AS NUMERO FROM Pedido');
  return row.NUMERO;
}

async function gerarControleUnico(db: any) {
  let CONTROLE = gerarControlePedido();
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const existente = await db.get('SELECT ID FROM Pedido WHERE CONTROLE = ?', CONTROLE);
    if (!existente) return CONTROLE;
    CONTROLE = gerarControlePedido();
  }
  return CONTROLE;
}

async function recalcularPedido(db: any, pedidoId: number) {
  const produtos = await db.get('SELECT COALESCE(SUM(VALORTOTAL), 0) AS TOTAL FROM ItemPedido WHERE PEDIDO = ?', pedidoId);
  const pedido = await db.get('SELECT VALORFRETE, VALORACRESCIMODESCONTO FROM Pedido WHERE ID = ?', pedidoId);
  const valorProdutos = n(produtos?.TOTAL);
  const valorFrete = n(pedido?.VALORFRETE);
  const valorAcrescimoDesconto = n(pedido?.VALORACRESCIMODESCONTO);
  const valorTotal = valorProdutos + valorFrete - valorAcrescimoDesconto;
  const percentualDesconto = valorProdutos > 0 ? (valorAcrescimoDesconto / valorProdutos) * 100 : 0;

  await db.run(
    `UPDATE Pedido
     SET VALORPRODUTOS = ?, VALORTOTAL = ?, PERCENTUALDESCONTO = ?
     WHERE ID = ?`,
    valorProdutos,
    valorTotal,
    percentualDesconto,
    pedidoId
  );

  const countRow = await db.get('SELECT COUNT(*) AS TOTAL FROM ItemPedido WHERE PEDIDO = ?', pedidoId);
  const quantidadeItens = n(countRow?.TOTAL);
  const percentualItem = quantidadeItens > 0 ? valorTotal / quantidadeItens : 0;
  await db.run('UPDATE ItemPedido SET PERCENTUALITEM = ? WHERE PEDIDO = ?', percentualItem, pedidoId);
}

async function montarPedido(db: any, id: number) {
  const pedido = await db.get(
    `SELECT p.*, c.RAZAOSOCIAL AS CLIENTE_NOME, v.RAZAOSOCIAL AS VENDEDOR_NOME, m.RAZAOSOCIAL AS MOTORISTA_NOME
     FROM Pedido p
     LEFT JOIN Parceiros c ON c.ID = p.CLIENTE
     LEFT JOIN Parceiros v ON v.ID = p.VENDEDOR
     LEFT JOIN Parceiros m ON m.ID = p.MOTORISTA
     WHERE p.ID = ?`,
    id
  );
  if (!pedido) return null;
  const itens = await db.all('SELECT * FROM ItemPedido WHERE PEDIDO = ? ORDER BY ID', id);
  return { ...pedido, ITENS: itens };
}

router.get('/', async (req, res) => {
  const db = await getDb();
  const q = String(req.query.q || '').trim();
  const rows = await db.all(
    `SELECT p.*, c.RAZAOSOCIAL AS CLIENTE_NOME
     FROM Pedido p
     LEFT JOIN Parceiros c ON c.ID = p.CLIENTE
     WHERE ? = ''
        OR CAST(p.NUMERO AS TEXT) LIKE ?
        OR p.STATUS LIKE ?
        OR p.CONTROLE LIKE ?
        OR c.RAZAOSOCIAL LIKE ?
     ORDER BY p.ID DESC`,
    q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const pedido = await montarPedido(db, Number(req.params.id));
  if (!pedido) return res.status(404).json({ message: 'Pedido não encontrado' });
  res.json(pedido);
});

router.post('/', async (req, res) => {
  const db = await getDb();
  await db.run('BEGIN');
  try {
    validarProdutosRepetidos(req.body.ITENS || []);

    const hoje = new Date();
    const dataLocacao = req.body.DATALOCACAO || hoje.toISOString().slice(0, 10);
    const horaLocacao = req.body.HORALOCACAO || hoje.toTimeString().slice(0, 8);
    const periodo = n(req.body.PERIODO, 0);
    const dataDevolucao = req.body.DATADEVOLUCAO || addDays(dataLocacao, periodo);
    const horaDate = new Date(`2000-01-01T${horaLocacao}`);
    horaDate.setHours(horaDate.getHours() + 2);
    const horaDevolucao = req.body.HORADEVOLUCAO || horaDate.toTimeString().slice(0, 8);

    const numero = await nextNumero(db);
    const controle = await gerarControleUnico(db);
    const valorFrete = n(req.body.VALORFRETE);
    const valorAcrescimoDesconto = n(req.body.VALORACRESCIMODESCONTO);

    const result = await db.run(
      `INSERT INTO Pedido (
        NUMERO, STATUS, DATALOCACAO, HORALOCACAO, PERIODO, DATADEVOLUCAO, HORADEVOLUCAO,
        CLIENTE, ENDERECOINSTALACAO, VALORPRODUTOS, VALORFRETE, VALORACRESCIMODESCONTO,
        VALORTOTAL, OBSERVACOES, LOCADO, VENDEDOR, COMISSAO, PERCENTUALDESCONTO,
        DATAFINANCEIRO, FORMAPAGAMENTO, MOTORISTA, VEICULO, NOMERESPONSAVELOBRA,
        TELEFONERESPONSAVELOBRA, USERCADASTRO, DATACADASTRO, TIPOFATURAMENTO,
        OBSERVACOESADICIONAIS, NUMEROMTR, VALORMTR, CONTROLE
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)`,
      numero,
      req.body.STATUS || 'ABERTO',
      dataLocacao,
      horaLocacao,
      periodo,
      dataDevolucao,
      horaDevolucao,
      nullable(req.body.CLIENTE),
      nullable(req.body.ENDERECOINSTALACAO),
      valorFrete,
      valorAcrescimoDesconto,
      nullable(req.body.OBSERVACOES),
      req.body.LOCADO || 'NAO',
      nullable(req.body.VENDEDOR),
      n(req.body.COMISSAO),
      nullable(req.body.DATAFINANCEIRO),
      nullable(req.body.FORMAPAGAMENTO),
      nullable(req.body.MOTORISTA),
      nullable(req.body.VEICULO),
      nullable(req.body.NOMERESPONSAVELOBRA),
      nullable(req.body.TELEFONERESPONSAVELOBRA),
      nullable(req.body.USERCADASTRO),
      nullable(req.body.TIPOFATURAMENTO),
      nullable(req.body.OBSERVACOESADICIONAIS),
      nullable(req.body.NUMEROMTR),
      n(req.body.VALORMTR),
      controle
    );

    const pedidoId = result.lastID;
    for (const item of req.body.ITENS || []) {
      await inserirItem(db, pedidoId, periodo, item);
    }
    await recalcularPedido(db, pedidoId);
    await db.run('COMMIT');

    res.status(201).json(await montarPedido(db, pedidoId));
  } catch (error) {
    await db.run('ROLLBACK');
    const statusCode = (error as any).statusCode || 500;
    console.error(error);
    res.status(statusCode).json({ message: statusCode === 400 ? (error as Error).message : 'Erro ao cadastrar pedido' });
  }
});

router.put('/:id', async (req, res) => {
  const db = await getDb();
  const pedidoId = Number(req.params.id);
  await db.run('BEGIN');
  try {
    validarProdutosRepetidos(req.body.ITENS || []);

    const dataLocacao = req.body.DATALOCACAO;
    let periodo = n(req.body.PERIODO, 0);
    let dataDevolucao = req.body.DATADEVOLUCAO;
    if (dataLocacao && dataDevolucao) periodo = diffDays(dataLocacao, dataDevolucao);
    if (dataLocacao && !dataDevolucao) dataDevolucao = addDays(dataLocacao, periodo);

    const horaLocacao = req.body.HORALOCACAO;
    let horaDevolucao = req.body.HORADEVOLUCAO;
    if (horaLocacao && !horaDevolucao) {
      const horaDate = new Date(`2000-01-01T${horaLocacao}`);
      horaDate.setHours(horaDate.getHours() + 2);
      horaDevolucao = horaDate.toTimeString().slice(0, 8);
    }

    await db.run(
      `UPDATE Pedido SET
        STATUS = ?, DATALOCACAO = ?, HORALOCACAO = ?, PERIODO = ?, DATADEVOLUCAO = ?, HORADEVOLUCAO = ?,
        HORADEVOLVIDA = ?, CLIENTE = ?, ENDERECOINSTALACAO = ?, VALORFRETE = ?, VALORACRESCIMODESCONTO = ?,
        OBSERVACOES = ?, LOCADO = ?, VENDEDOR = ?, COMISSAO = ?, DATAFINANCEIRO = ?, FORMAPAGAMENTO = ?,
        MOTORISTA = ?, VEICULO = ?, NOMERESPONSAVELOBRA = ?, TELEFONERESPONSAVELOBRA = ?, USEREDICAO = ?,
        DATAEDICAO = CURRENT_TIMESTAMP, TIPOFATURAMENTO = ?, OBSERVACOESADICIONAIS = ?, NUMEROMTR = ?, VALORMTR = ?
       WHERE ID = ?`,
      req.body.STATUS || 'ABERTO',
      dataLocacao,
      horaLocacao,
      periodo,
      dataDevolucao,
      horaDevolucao,
      nullable(req.body.HORADEVOLVIDA),
      nullable(req.body.CLIENTE),
      nullable(req.body.ENDERECOINSTALACAO),
      n(req.body.VALORFRETE),
      n(req.body.VALORACRESCIMODESCONTO),
      nullable(req.body.OBSERVACOES),
      req.body.LOCADO || 'NAO',
      nullable(req.body.VENDEDOR),
      n(req.body.COMISSAO),
      nullable(req.body.DATAFINANCEIRO),
      nullable(req.body.FORMAPAGAMENTO),
      nullable(req.body.MOTORISTA),
      nullable(req.body.VEICULO),
      nullable(req.body.NOMERESPONSAVELOBRA),
      nullable(req.body.TELEFONERESPONSAVELOBRA),
      nullable(req.body.USEREDICAO),
      nullable(req.body.TIPOFATURAMENTO),
      nullable(req.body.OBSERVACOESADICIONAIS),
      nullable(req.body.NUMEROMTR),
      n(req.body.VALORMTR),
      pedidoId
    );

    await db.run('DELETE FROM ItemPedido WHERE PEDIDO = ?', pedidoId);
    for (const item of req.body.ITENS || []) {
      await inserirItem(db, pedidoId, periodo, item);
    }
    await recalcularPedido(db, pedidoId);
    await db.run('COMMIT');

    res.json(await montarPedido(db, pedidoId));
  } catch (error) {
    await db.run('ROLLBACK');
    const statusCode = (error as any).statusCode || 500;
    console.error(error);
    res.status(statusCode).json({ message: statusCode === 400 ? (error as Error).message : 'Erro ao editar pedido' });
  }
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM ItemPedido WHERE PEDIDO = ?', req.params.id);
  await db.run('DELETE FROM Pedido WHERE ID = ?', req.params.id);
  res.status(204).send();
});

async function inserirItem(db: any, pedidoId: number, pedidoPeriodo: number, item: any) {
  const produto = await db.get('SELECT * FROM Produtos WHERE ID = ?', item.PRODUTO);
  const periodo = n(item.PERIODO, pedidoPeriodo);
  const quantidade = n(item.QUANTIDADELOCADA, 1);
  const quantidadeDevolvida = n(item.QUANTIDADEDEVOLVIDA);
  const valorDiario = n(item.VALORDIARIO, n(produto?.VALORMINIMO));
  const valorUnitario = valorDiario * periodo;
  const valorCalculado = valorUnitario * quantidade;
  const acrescimoDesconto = n(item.VALORACRESCIMODESCONTO);
  const valorTotal = valorCalculado + acrescimoDesconto;
  const percentualDesconto = valorCalculado > 0 ? (acrescimoDesconto / valorCalculado) * 100 : 0;

  await db.run(
    `INSERT INTO ItemPedido (
      PEDIDO, PRODUTO, NOMEPRODUTO, QUANTIDADELOCADA, QUANTIDADEDEVOLVIDA,
      VALORDIA, VALORMES, VALORMINIMO, TIPOLOCACAO, PERIODO, VALORDIARIO,
      VALORUNITARIO, VALORCALCULADO, VALORACRESCIMODESCONTO, VALORTOTAL,
      DATAFINANCEIRO, PERCENTUALDESCONTO, PERCENTUALITEM, OBSERVACOES
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    pedidoId,
    nullable(item.PRODUTO),
    item.NOMEPRODUTO || produto?.DESCRICAO || '',
    quantidade,
    quantidadeDevolvida,
    n(item.VALORDIA, n(produto?.VALORMINIMO)),
    n(item.VALORMES, n(produto?.VALORMENSAL)),
    n(item.VALORMINIMO, n(produto?.VALORMINIMO)),
    item.TIPOLOCACAO || produto?.TIPO || '',
    periodo,
    valorDiario,
    valorUnitario,
    valorCalculado,
    acrescimoDesconto,
    valorTotal,
    nullable(item.DATAFINANCEIRO),
    percentualDesconto,
    nullable(item.OBSERVACOES)
  );
}

export default router;
