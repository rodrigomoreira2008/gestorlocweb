import express from 'express';
import cors from 'cors';
import grupoParceirosRoutes from './routes/grupoParceiros.js';
import grupoProdutosRoutes from './routes/grupoProdutos.js';
import locacaoRoutes from './routes/locacao.js';
import parceirosRoutes from './routes/parceiros.js';
import produtosRoutes from './routes/produtos.js';

const app = express();
const port = Number(process.env.PORT || 3333);

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/grupo-parceiros', grupoParceirosRoutes);
app.use('/api/grupo-produtos', grupoProdutosRoutes);
app.use('/api/locacao', locacaoRoutes);
app.use('/api/parceiros', parceirosRoutes);
app.use('/api/produtos', produtosRoutes);

app.listen(port, () => {
  console.log(`API GestorLoc rodando em http://localhost:${port}`);
});