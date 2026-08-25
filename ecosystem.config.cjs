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
      },
    },
  ],
};
