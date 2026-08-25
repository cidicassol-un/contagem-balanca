import express from 'express';
import { quantidadePintinhosBalanca } from './balanca.js';

export function criarApp() {
  const app = express();

  app.disable('x-powered-by');

  // Libera consumo por qualquer front-end (sem autenticacao por enquanto).
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.set('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // Retorno "puro": apenas o numero inteiro no corpo da resposta.
  app.get('/quantidadePintinhosBalanca', (req, res) => {
    res.type('text/plain').send(String(quantidadePintinhosBalanca()));
  });

  // Mesma leitura, em JSON, para quem preferir consumir estruturado.
  app.get('/api/pintinhos', (req, res) => {
    res.json({ quantidade: quantidadePintinhosBalanca() });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: Math.floor(process.uptime()) });
  });

  app.use((req, res) => {
    res.status(404).json({ erro: 'rota nao encontrada' });
  });

  return app;
}
