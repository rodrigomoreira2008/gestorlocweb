import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { gerarControleProduto } from '../utils/gerarControle.js';

const router = Router();

const columns = [
  'NUMERO',
  'DESCRICAO',
  'MARCA',
  'GRUPO',
  'UNIDADE',
  'VALORCOMPRA',
  'VALORESTIMADO',
  'QUANTIDADEREAL',
  'QUANTIDADEESTOQUE',
  'VALORMENSAL',
  'VALORMINIMO',
  'ACESSORIOS',
  'PATRIMONIO',
  'TIPO',
  'NUMEROSERIE',
  'TABELADESCONTOMENSAL',
  'TABELADESCONTODIARIO',
  'VALORLIMPEZA',
  'IDPRODUCAO',
  'MOSTRACONTRATO',
  'ACESSORIO',
  'DESCRICAODETALHADA',
  'PRODUCAO',
  'LOCACAO',
  'LOCACAOANTERIOR'
];

function normalizeValue(column: string, value: any) {
  if (value === '' || value === undefined) return null;

  const numericColumns = new Set([
    'GRUPO',
    'VALORCOMPRA',
    'VALORESTIMADO',
    'QUANTIDADEREAL',
    'QUANTIDADEESTOQUE',
    'VALORMENSAL',
    'VALORMINIMO',
    'TABELADESCONTOMENSAL',
    'TABELADESCONTODIARIO',
    'VALORLIMPEZA',
    'IDPRODUCAO',
    'PRODUCAO',
    'LOCACAO',
    'LOCACAOANTERIOR'
  ]);

  if (numericColumns.has(column)) return Number(value);
  return value;
}

function valuesFromBody(body: any) {
  return columns.map((column) => normalizeValue(column, body[column]));
}

router.get('/', async (req, res) => {
  const db = await getDb();
  const q = String(req.query.q || '').trim();
  const rows = await db.all(
    `SELECT p.*, gp.NOME AS GRUPO_NOME, l.DESCRICAO AS LOCACAO_DESCRICAO
     FROM Produtos p
     LEFT JOIN GrupoProdutos gp ON gp.ID = p.GRUPO
     LEFT JOIN Locacao l ON l.ID = p.LOCACAO
     WHERE ? = ''
        OR p.NUMERO LIKE ?
        OR p.DESCRICAO LIKE ?
        OR p.MARCA LIKE ?
        OR p.PATRIMONIO LIKE ?
        OR p.NUMEROSERIE LIKE ?
        OR p.CONTROLE LIKE ?
     ORDER BY p.ID DESC`,
    q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const row = await db.get('SELECT * FROM Produtos WHERE ID = ?', req.params.id);
  if (!row) return res.status(404).json({ message: 'Produto não encontrado' });
  res.json(row);
});

router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    let CONTROLE = gerarControleProduto();

    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const existente = await db.get('SELECT ID FROM Produtos WHERE CONTROLE = ?', CONTROLE);
      if (!existente) break;
      CONTROLE = gerarControleProduto();
    }

    const insertColumns = [...columns, 'CONTROLE', 'DATACADASTRO', 'USERCADASTRO'];
    const placeholders = columns.map(() => '?').join(', ');
    const result = await db.run(
      `INSERT INTO Produtos (${insertColumns.join(', ')})
       VALUES (${placeholders}, ?, CURRENT_TIMESTAMP, ?)`,
      ...valuesFromBody(req.body),
      CONTROLE,
      normalizeValue('USERCADASTRO', req.body.USERCADASTRO)
    );

    const row = await db.get('SELECT * FROM Produtos WHERE ID = ?', result.lastID);
    res.status(201).json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao cadastrar produto' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const setClause = columns.map((column) => `${column} = ?`).join(', ');
    await db.run(
      `UPDATE Produtos
       SET ${setClause}, DATAEDICAO = CURRENT_TIMESTAMP, USEREDICAO = ?
       WHERE ID = ?`,
      ...valuesFromBody(req.body),
      normalizeValue('USEREDICAO', req.body.USEREDICAO),
      req.params.id
    );

    const row = await db.get('SELECT * FROM Produtos WHERE ID = ?', req.params.id);
    res.json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao editar produto' });
  }
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM Produtos WHERE ID = ?', req.params.id);
  res.status(204).send();
});

export default router;
