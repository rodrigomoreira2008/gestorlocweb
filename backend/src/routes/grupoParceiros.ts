import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { gerarControleGrupoParceiro } from '../utils/gerarControle.js';

const router = Router();

router.get('/', async (req, res) => {
  const db = await getDb();
  const q = String(req.query.q || '').trim();
  const rows = await db.all(
    `SELECT * FROM GrupoParceiros
     WHERE ? = '' OR NOME LIKE ? OR STATUS LIKE ? OR CONTROLE LIKE ?
     ORDER BY ID DESC`,
    q, `%${q}%`, `%${q}%`, `%${q}%`
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const row = await db.get('SELECT * FROM GrupoParceiros WHERE ID = ?', req.params.id);
  if (!row) return res.status(404).json({ message: 'Grupo não encontrado' });
  res.json(row);
});

router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { NOME, STATUS } = req.body;
    let CONTROLE = gerarControleGrupoParceiro();

    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const existente = await db.get('SELECT ID FROM GrupoParceiros WHERE CONTROLE = ?', CONTROLE);
      if (!existente) break;
      CONTROLE = gerarControleGrupoParceiro();
    }

    const result = await db.run(
      'INSERT INTO GrupoParceiros (NOME, STATUS, CONTROLE) VALUES (?, ?, ?)',
      NOME,
      STATUS || 'ATIVO',
      CONTROLE
    );

    const row = await db.get('SELECT * FROM GrupoParceiros WHERE ID = ?', result.lastID);
    res.status(201).json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao cadastrar grupo de parceiros' });
  }
});

router.put('/:id', async (req, res) => {
  const db = await getDb();
  const { NOME, STATUS } = req.body;

  await db.run(
    'UPDATE GrupoParceiros SET NOME = ?, STATUS = ? WHERE ID = ?',
    NOME,
    STATUS || 'ATIVO',
    req.params.id
  );

  const row = await db.get('SELECT * FROM GrupoParceiros WHERE ID = ?', req.params.id);
  res.json(row);
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM GrupoParceiros WHERE ID = ?', req.params.id);
  res.status(204).send();
});

export default router;
