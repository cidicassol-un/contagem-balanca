# contagem-pintinhos-api

API minima que retorna a quantidade de pintinhos na balanca (inteiro de 0 a 100).
No momento o valor e randomico, apenas para testes.

## Rodar local

```bash
npm install
npm start          # http://localhost:3000
```

## Endpoints

| Metodo | Rota                          | Retorno                    |
|--------|-------------------------------|----------------------------|
| GET    | `/quantidadePintinhosBalanca` | inteiro puro, ex: `42`     |
| GET    | `/api/pintinhos`              | `{"quantidade": 42}`       |
| GET    | `/health`                     | `{"status":"ok",...}`      |

A porta pode ser trocada com a variavel de ambiente `PORT`.

## Deploy na VPS Hostinger (Ubuntu)

```bash
# 1. Node LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Enviar o projeto (ou git clone) para /var/www/contagem-pintinhos-api
cd /var/www/contagem-pintinhos-api
npm install --omit=dev

# 3. Manter no ar com pm2
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup            # execute o comando que ele imprimir
```

### Nginx como proxy reverso (porta 80/443)

`/etc/nginx/sites-available/pintinhos`:

```nginx
server {
    listen 80;
    server_name SEU_DOMINIO_OU_IP;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pintinhos /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d SEU_DOMINIO   # HTTPS (opcional)
```

Se for expor a porta 3000 direto, libere no firewall: `sudo ufw allow 3000/tcp`.

## Proximos passos

- Trocar o corpo de `quantidadePintinhosBalanca()` em `src/balanca.js` pela leitura real.
- Adicionar autenticacao (ex.: API key no header) antes de expor publicamente.
