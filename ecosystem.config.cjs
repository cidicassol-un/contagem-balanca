module.exports = {
  apps: [
    {
      name: 'contagem-pintinhos-api',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // 0.0.0.0 para que o proxy reverso (nginx em container Docker) alcance
        // a aplicacao pelo gateway da rede. A porta 3000 deve permanecer
        // fechada no firewall do host.
        HOST: '0.0.0.0',
      },
    },
  ],
};
