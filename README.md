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
| GET    | `/docs`                       | Swagger UI (documentacao)  |
| GET    | `/openapi.yaml`               | contrato OpenAPI (YAML)    |
| GET    | `/openapi.json`               | contrato OpenAPI (JSON)    |

A porta pode ser trocada com a variavel de ambiente `PORT`.

## Documentacao (Swagger / OpenAPI)

O contrato fica em [`docs/openapi.yaml`](docs/openapi.yaml) (OpenAPI 3.0.3) e e a
fonte da verdade da API. Com o servidor rodando, a documentacao interativa fica em:

```
http://localhost:3000/docs
```

Na VPS, o mesmo caminho vale para o dominio publicado (ex.: `https://api.icassol.tech/docs`).
Ajuste a secao `servers:` do `openapi.yaml` com o dominio real antes de publicar.

O arquivo tambem pode ser importado direto no Postman, Insomnia ou
[Swagger Editor](https://editor.swagger.io), ou usado para gerar clientes:

```bash
npx @redocly/cli lint docs/openapi.yaml     # valida o contrato
npx @redocly/cli build-docs docs/openapi.yaml -o docs/index.html   # HTML estatico
```

## Consumo pela IHM

Passo a passo detalhado para ler a API na IHM Weintek cMT2078X (JS Object):
[`docs/GUIA-IHM-CMT2078X.md`](docs/GUIA-IHM-CMT2078X.md).

## Proxy reverso nesta VPS

A VPS ja tem um nginx em container (`dental_nginx`, stack `/opt/dentalcompara`)
ocupando as portas 80/443. A API entra como mais um virtual host dentro dele,
em vez de um segundo nginx no host. Os blocos prontos estao em `deploy/`:

- `deploy/nginx-api-http.conf` - etapa 1, so HTTP (permite emitir o certificado)
- `deploy/nginx-api-https.conf` - etapa 2, HTTP redirecionando para HTTPS

O arquivo `/opt/dentalcompara/nginx/nginx.conf` e montado no container. O
procedimento e sempre partir do backup limpo e anexar o vhost desejado, o que
torna a operacao repetivel:

```bash
BASE=/opt/dentalcompara/nginx/nginx.conf
RAW=https://raw.githubusercontent.com/cidicassol-un/contagem-balanca/main/deploy

cp $BASE.bak $BASE
curl -fsSL $RAW/nginx-api-https.conf >> $BASE
docker exec dental_nginx nginx -t && docker exec dental_nginx nginx -s reload
```

O upstream aponta para `172.18.0.1:3000`, gateway da rede
`dentalcompara_internal` - e assim que o container alcanca a aplicacao no host.
Por isso o `HOST` da aplicacao e `0.0.0.0`, com a porta 3000 fechada no ufw.

## Deploy standalone (nginx direto no host)

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
    server_name api.icassol.tech;

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
sudo certbot --nginx -d api.icassol.tech   # HTTPS (opcional)
```

Se for expor a porta 3000 direto, libere no firewall: `sudo ufw allow 3000/tcp`.

## Proximos passos

- Trocar o corpo de `quantidadePintinhosBalanca()` em `src/balanca.js` pela leitura real.
- Adicionar autenticacao (ex.: API key no header) antes de expor publicamente.
