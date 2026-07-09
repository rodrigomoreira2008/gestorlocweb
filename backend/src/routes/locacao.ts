import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { gerarControleLocacao } from '../utils/gerarControle.js';

const router = Router();

router.get('/', async (req, res) => {
  const db = await getDb();
  const q = String(req.query.q || '').trim();
  const rows = await db.all(
    `SELECT * FROM Locacao
     WHERE ? = ''
        OR DESCRICAO LIKE ?
        OR ENDERECOPADRAO LIKE ?
        OR STATUS LIKE ?
        OR CONTROLE LIKE ?
        OR TIPO LIKE ?
     ORDER BY ID DESC`,
    q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const row = await db.get('SELECT * FROM Locacao WHERE ID = ?', req.params.id);
  if (!row) return res.status(404).json({ message: 'Locação não encontrada' });
  res.json(row);
});

router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { DESCRICAO, ENDERECOPADRAO, STATUS, TIPO, USERCADASTRO } = req.body;
    let CONTROLE = gerarControleLocacao();

    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const existente = await db.get('SELECT ID FROM Locacao WHERE CONTROLE = ?', CONTROLE);
      if (!existente) break;
      CONTROLE = gerarControleLocacao();
    }

    const result = await db.run(
      `INSERT INTO Locacao (
        DESCRICAO,
        ENDERECOPADRAO,
        STATUS,
        CONTROLE,
        DATACADASTRO,
        USERCADASTRO,
        TIPO
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`,
      DESCRICAO,
      ENDERECOPADRAO || null,
      STATUS || 'ATIVO',
      CONTROLE,
      USERCADASTRO || null,
      TIPO || null
    );

    const row = await db.get('SELECT * FROM Locacao WHERE ID = ?', result.lastID);
    res.status(201).json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao cadastrar locação' });
  }
});

router.put('/:id', async (req, res) => {
  const db = await getDb();
  const { DESCRICAO, ENDERECOPADRAO, STATUS, TIPO, USEREDICAO } = req.body;

  await db.run(
    `UPDATE Locacao
     SET DESCRICAO = ?,
         ENDERECOPADRAO = ?,
         STATUS = ?,
         TIPO = ?,
         DATAEDICAO = CURRENT_TIMESTAMP,
         USEREDICAO = ?
     WHERE ID = ?`,
    DESCRICAO,
    ENDERECOPADRAO || null,
    STATUS || 'ATIVO',
    TIPO || null,
    USEREDICAO || null,
    req.params.id
  );

  const row = await db.get('SELECT * FROM Locacao WHERE ID = ?', req.params.id);
  res.json(row);
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM Locacao WHERE ID = ?', req.params.id);
  res.status(204).send();
});

export default router;
