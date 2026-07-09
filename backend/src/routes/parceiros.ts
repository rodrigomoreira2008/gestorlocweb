import { Router } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

const columns = [
  'TIPO', 'DATACADASTRO', 'GRUPO', 'RAZAOSOCIAL', 'NOMEFANTASIA', 'ENDERECO',
  'BAIRRO', 'CIDADE', 'UF', 'CEP', 'TELEFONE', 'CELULAR', 'EMAIL', 'RG', 'CPF',
  'CNPJ', 'IE', 'IM', 'NASCIMENTO', 'CONTATO', 'TELEFONECONTATO', 'REPRESENTANTE',
  'CPFREPRESENTANTE', 'TELEFONEREPRESENTANTE', 'CELULARREPRESENTANTE', 'TIPOFORNECEDOR',
  'COMISSAO', 'STATUS', 'ENDERECOCORRESPONDENCIA', 'BAIRROCORRESPONDENCIA',
  'CIDADECORRESPONDENCIA', 'UFCORRESPONDENCIA', 'CEPCORRESPONDENCIA',
  'CAIXAPOSTALCORRESPONDENCIA', 'VALORLIMITELOCACAO', 'CONTROLE', 'PAI', 'MAE',
  'TIPOPARCEIRO', 'OBSERVACAO', 'ENDERECOREPRESENTANTE', 'VENDEDOR', 'USERCADASTRO',
  'DATACAD', 'USEREDICAO', 'DATAEDICAO', 'USERDESBLOQUEIO', 'DATADESBLOQUEIO',
  'USERBLOQUEIO', 'DATABLOQUEIO', 'COMISSAOCLIENTE', 'ID_4RODAS', 'DATAATUALIZACAO',
  'HORAATUALIZACAO', 'USERATUALIZACAO', 'USERAUTORIZOUATUALIZACAO',
  'DATAATUALIZACAOANTERIOR', 'HORAATUALIZACAOANTERIOR', 'USERATUALIZACAOANTERIOR'
];

function valuesFromBody(body: any) {
  return columns.map((column) => body[column] ?? null);
}

router.get('/', async (req, res) => {
  const db = await getDb();
  const q = String(req.query.q || '').trim();
  const rows = await db.all(
    `SELECT p.*, g.NOME AS GRUPO_NOME
     FROM Parceiros p
     LEFT JOIN GrupoParceiros g ON g.ID = p.GRUPO
     WHERE ? = ''
        OR p.RAZAOSOCIAL LIKE ?
        OR p.NOMEFANTASIA LIKE ?
        OR p.CPF LIKE ?
        OR p.CNPJ LIKE ?
        OR p.EMAIL LIKE ?
     ORDER BY p.ID DESC`,
    q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const row = await db.get('SELECT * FROM Parceiros WHERE ID = ?', req.params.id);
  if (!row) return res.status(404).json({ message: 'Parceiro não encontrado' });
  res.json(row);
});

router.post('/', async (req, res) => {
  const db = await getDb();
  const placeholders = columns.map(() => '?').join(', ');
  const result = await db.run(
    `INSERT INTO Parceiros (${columns.join(', ')}) VALUES (${placeholders})`,
    ...valuesFromBody(req.body)
  );
  const row = await db.get('SELECT * FROM Parceiros WHERE ID = ?', result.lastID);
  res.status(201).json(row);
});

router.put('/:id', async (req, res) => {
  const db = await getDb();
  const setClause = columns.map((column) => `${column} = ?`).join(', ');
  await db.run(
    `UPDATE Parceiros SET ${setClause} WHERE ID = ?`,
    ...valuesFromBody(req.body),
    req.params.id
  );
  const row = await db.get('SELECT * FROM Parceiros WHERE ID = ?', req.params.id);
  res.json(row);
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM Parceiros WHERE ID = ?', req.params.id);
  res.status(204).send();
});

export default router;
