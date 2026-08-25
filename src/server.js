import { criarApp } from './app.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

criarApp().listen(PORT, HOST, () => {
  console.log(`contagem-pintinhos-api ouvindo em http://${HOST}:${PORT}`);
});
