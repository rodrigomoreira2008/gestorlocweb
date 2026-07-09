import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getDb } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
  const db = await getDb();
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schema = await readFile(schemaPath, 'utf-8');
  await db.exec(schema);

  await db.run(`
    INSERT INTO GrupoParceiros (NOME, STATUS, CONTROLE)
    SELECT 'Clientes', 'ATIVO', 'PADRAO'
    WHERE NOT EXISTS (SELECT 1 FROM GrupoParceiros)
  `);

  await db.run(`
    INSERT INTO GrupoProdutos (NOME, STATUS, CONTROLE)
    SELECT 'Produtos Gerais', 'ATIVO', 'GPRPADRAO'
    WHERE NOT EXISTS (SELECT 1 FROM GrupoProdutos)
  `);

  console.log('Banco criado/atualizado com sucesso.');
}

init().catch((error) => {
  console.error(error);
  process.exit(1);
});