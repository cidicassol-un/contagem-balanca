# Guia: ler a contagem de pintinhos na IHM Weintek cMT2078X

Este documento explica, do zero, como fazer a IHM **Weintek cMT2078X** buscar a
quantidade de pintinhos da balanca pela internet e mostrar o valor na tela.

Nao e preciso conhecer a API por dentro: basta seguir os passos na ordem.

**Tempo estimado:** 30 a 40 minutos.

---

## 1. O que a API entrega

A API fica hospedada em `https://api.icassol.tech` e responde a chamadas HTTP.
Ela devolve **um numero inteiro de 0 a 100**, que representa a quantidade de
pintinhos na balanca.

| Endereco | O que devolve | Exemplo de resposta |
|---|---|---|
| `https://api.icassol.tech/quantidadePintinhosBalanca` | so o numero, em texto puro | `42` |
| `https://api.icassol.tech/api/pintinhos` | o mesmo valor em JSON | `{"quantidade":42}` |
| `https://api.icassol.tech/health` | diz se a API esta no ar | `{"status":"ok","uptime":3600}` |
| `https://api.icassol.tech/docs` | documentacao visual (Swagger) | pagina web |

**Neste guia usaremos o primeiro endereco**, que devolve so o numero. E o mais
simples de tratar na IHM, porque nao exige interpretar JSON.

Nao ha senha nem token: a chamada e aberta.

> **Importante:** hoje o valor e **gerado aleatoriamente**, para testes. A leitura
> real da balanca sera ligada depois, sem mudar o endereco nem o formato da
> resposta. Ou seja, o que voce programar agora continuara funcionando.

---

## 2. Teste rapido antes de programar

Antes de abrir o EasyBuilder Pro, confirme que a API responde. No navegador do
seu computador, abra:

```
https://api.icassol.tech/quantidadePintinhosBalanca
```

A pagina deve mostrar apenas um numero, por exemplo `42`. Aperte F5 algumas
vezes: o numero muda a cada atualizacao. **Se isso funcionar, a API esta no ar** e
qualquer problema mais adiante sera de rede ou de configuracao da IHM.

---

## 3. Pre-requisitos

Confira os tres itens antes de comecar:

1. **Modelo da IHM:** cMT2078X (serie cMT-X). O recurso "JS Object", usado aqui,
   existe **somente** na serie cMT-X.
2. **Versao do EasyBuilder Pro:** 6.05.01 ou superior. Em versoes anteriores o
   JS Object nao existe. Confira em *Help > About* (ou *Ajuda > Sobre*).
3. **A IHM precisa ter acesso a internet.** Nao basta estar na rede da fabrica:
   ela precisa de gateway e DNS validos, porque vai acessar um site externo.

---

## 4. Conferir a rede da IHM

1. Na tela da IHM, toque no **canto superior esquerdo** e segure por cerca de
   2 segundos. Aparece a barra de sistema.
2. Toque no icone de **engrenagem** (configuracoes do sistema).
3. Informe a senha do sistema. A senha padrao de fabrica e `111111` (se ja foi
   trocada, use a senha da sua empresa).
4. Entre em **Network** (Rede) e confirme:
   - **IP Address** — o IP da IHM na rede
   - **Subnet Mask** — mascara da rede
   - **Gateway** — o roteador que da saida para a internet (campo obrigatorio)
   - **DNS** — servidor de nomes. Se estiver vazio, preencha com `8.8.8.8`

O **Gateway** e o **DNS** sao os campos que mais causam falha. Sem gateway a IHM
nao sai da rede local; sem DNS ela nao consegue traduzir `api.icassol.tech` para
um endereco de rede, e a leitura falha mesmo com a internet funcionando.

> **Nao tente usar o IP no lugar do nome.** O servidor hospeda mais de um site no
> mesmo endereco e decide qual responder pelo nome usado na chamada. Chamando
> pelo IP, a resposta vem de outro site. Use sempre `api.icassol.tech`.

---

## 5. Criar o projeto no EasyBuilder Pro

Se ja existe um projeto para essa IHM, abra o projeto existente e pule para o
passo 6.

1. Abra o **EasyBuilder Pro**.
2. Clique em **New** (Novo projeto).
3. Na lista de modelos, escolha **cMT2078X**.
4. Confirme. O EasyBuilder abre a tela inicial do projeto (janela 10).

---

## 6. Inserir o objeto JS

O **JS Object** e o componente que executa JavaScript dentro da IHM. E ele quem
vai chamar a API.

1. No menu superior, abra **Object** (Objeto) e escolha **JS Object**.
2. Clique e arraste na tela para desenhar o objeto. Ele pode ficar pequeno e num
   canto: ele nao precisa aparecer para o operador, so precisa existir na tela.
3. Abre-se a janela de propriedades, com as abas **General**, **Config** e
   **Source** (nomes podem variar levemente conforme a versao).

### 6.1. Aba Config — declarar os enderecos

Aqui voce cria os "apelidos" que o codigo usara para escrever na memoria da IHM.
Adicione **dois** enderecos:

| Nome (Name) | Endereco (Address) | Tipo (Data Type) | Para que serve |
|---|---|---|---|
| `valorPintinhos` | `LW-100` | 16-bit Unsigned | guarda a quantidade lida (0 a 100) |
| `statusLeitura` | `LW-101` | 16-bit Unsigned | 0 = leitura ok, 1 = falha na leitura |

Escreva os nomes **exatamente assim**, respeitando maiusculas e minusculas — o
codigo do passo 7 procura por esses nomes. Se `LW-100` e `LW-101` ja estiverem
em uso no seu projeto, escolha outros dois enderecos livres e troque tambem no
codigo, nas linhas indicadas.

### 6.2. Aba Source — o codigo

Apague o conteudo de exemplo que vier preenchido e cole o codigo do passo 7.

---

## 7. Codigo para copiar e colar

```javascript
// =====================================================================
// Leitura da quantidade de pintinhos na balanca
// API: https://api.icassol.tech
// Escreve o valor lido em LW-100 e o status da leitura em LW-101
// =====================================================================

// Endereco chamado e intervalo entre leituras (5000 ms = 5 segundos).
const URL_API = 'https://api.icassol.tech/quantidadePintinhosBalanca';
const INTERVALO_MS = 5000;

const decodificador = new TextDecoder('utf-8');

// Guarda a referencia do objeto JS para uso dentro das funcoes internas.
const self = this;

function lerBalanca() {
  let corpo = '';

  const curl = new net.Curl.Easy();
  curl.setOpt(net.Curl.Easy.option.URL, URL_API);
  curl.setOpt(net.Curl.Easy.option.HTTPGET, true);

  // A IHM nao possui a lista de autoridades certificadoras da internet.
  // Sem esta linha, toda chamada HTTPS falha.
  curl.setOpt(net.Curl.Easy.option.SSL_VERIFYPEER, false);

  // Vai juntando os pedacos da resposta conforme eles chegam.
  curl.setOpt(net.Curl.Easy.option.WRITEFUNCTION, function (buf) {
    corpo += decodificador.decode(buf);
  });

  const multi = new net.Curl.Multi();

  // Executa quando a resposta termina de chegar.
  multi.onMessage(function (handle, resultado) {
    multi.removeHandle(handle);

    const valor = parseInt(corpo.trim(), 10);

    if (!isNaN(valor) && valor >= 0 && valor <= 100) {
      // Leitura valida: grava o valor e zera o status de erro.
      driver.setData(self.config.valorPintinhos, valor);
      driver.setData(self.config.statusLeitura, 0);
      console.log('Pintinhos na balanca:', valor);
    } else {
      // Resposta vazia ou fora do esperado: sinaliza falha.
      driver.setData(self.config.statusLeitura, 1);
      console.log('Resposta inesperada da API:', corpo);
    }
  });

  multi.addHandle(curl);
}

// Primeira leitura imediata, para a tela nao ficar zerada na partida.
lerBalanca();

// Demais leituras, repetindo no intervalo definido acima.
setInterval(lerBalanca, INTERVALO_MS);
```

**Se voce trocou os enderecos no passo 6.1**, altere apenas os nomes
`valorPintinhos` e `statusLeitura` na aba Config — o codigo nao muda, porque ele
se refere aos apelidos, e nao aos enderecos.

**Para ler mais rapido ou mais devagar**, mude o valor de `INTERVALO_MS`. Nao
use menos de 1000 (1 segundo): leituras rapidas demais sobrecarregam a IHM sem
nenhum ganho pratico.

---

## 8. Mostrar o valor na tela

O JS Object apenas grava o numero na memoria. Para o operador ver:

1. Menu **Object > Numeric > Numeric Display** (Objeto > Numerico > Visor
   numerico).
2. Clique na tela para posicionar.
3. Na aba **General**, configure:
   - **Read address:** `LW-100` (o mesmo do passo 6.1)
   - **Data format / Data Type:** `16-bit Unsigned`
4. Na aba **Format** (Formato):
   - **Digits > Left of decimal Pt.:** `3`
   - **Digits > Right of decimal Pt.:** `0` (o valor e inteiro, sem casas decimais)
5. Confirme.

Opcionalmente, adicione um texto ao lado com o rotulo **"Pintinhos na balanca"**
(menu *Object > Text*).

### Indicador de falha (recomendado)

Para o operador perceber quando a leitura parar de funcionar:

1. Menu **Object > Lamp** (Lampada) — ou um *Multi-State Indicator*.
2. **Read address:** `LW-101`
3. Configure a aparencia: estado `0` = normal (verde), estado `1` = falha
   (vermelho).

Sem esse indicador, uma queda de internet faz a tela continuar exibindo o ultimo
numero lido, o que pode ser confundido com uma leitura atual.

---

## 9. Compilar e enviar para a IHM

1. **Salve** o projeto (*File > Save*).
2. **Compile:** menu *Tools > Compile* (ou a tecla **F5**). Corrija eventuais
   erros apontados antes de seguir.
3. **Envie para a IHM:** menu *Tools > Download* (ou **F7**).
   - Escolha **Ethernet**
   - Informe o **IP da IHM** (o que voce viu no passo 4)
   - Senha de download: a senha do projeto (padrao de fabrica: `111111`)
4. Aguarde a transferencia e a IHM reiniciar a aplicacao.

> A **simulacao no PC** (*On-line Simulation*) tambem funciona e e util para
> testar o codigo antes de enviar. Lembre-se de que ela usa a internet **do seu
> computador**, e nao a da IHM — entao ela nao serve para validar a rede da IHM.

---

## 10. Testar

Com a aplicacao rodando na IHM:

- O visor numerico deve mostrar um numero entre 0 e 100.
- A cada 5 segundos o numero muda (a API devolve um valor aleatorio a cada
  chamada).
- O indicador de falha deve permanecer no estado `0`.

Se o numero muda sozinho, esta funcionando.

---

## 11. Problemas comuns

| Sintoma | Causa mais provavel | O que fazer |
|---|---|---|
| Valor fica sempre `0` e o status vai para `1` | A IHM nao alcanca a internet | Reveja **Gateway** e **DNS** no passo 4 |
| Funciona na simulacao do PC, mas nao na IHM | A rede da IHM nao tem saida para a internet | Fale com o responsavel pela rede: a IHM precisa alcancar `api.icassol.tech` na porta 443 |
| **JS Object** nao aparece no menu Object | EasyBuilder Pro anterior a 6.05.01, ou modelo nao e da serie cMT-X | Atualize o EasyBuilder Pro |
| Erro de certificado / conexao SSL | Faltou a linha `SSL_VERIFYPEER` | Confirme que a linha `curl.setOpt(net.Curl.Easy.option.SSL_VERIFYPEER, false);` esta no codigo |
| Valor congela num numero e nao muda mais | A internet caiu depois de uma leitura boa | E o comportamento esperado; use o indicador de falha (`LW-101`) para detectar |
| Erro de compilacao apontando o JS Object | Erro de digitacao ao colar o codigo | Apague tudo e cole novamente, sem alterar nada |

### Ver as mensagens de diagnostico

O codigo grava mensagens com `console.log`. Para le-las, use o utilitario
**cMT Diagnoser** (instalado junto com o EasyBuilder Pro), conectando no IP da
IHM. Ele mostra o valor lido a cada ciclo e o texto da resposta em caso de falha
— e a forma mais rapida de descobrir onde a leitura esta parando.

---

## 12. Se preferir usar o JSON

O codigo acima usa o endereco que devolve texto puro, que e o mais simples. Caso
prefira o endereco JSON (`/api/pintinhos`), troque duas linhas:

```javascript
const URL_API = 'https://api.icassol.tech/api/pintinhos';
```

e, dentro de `onMessage`, troque a linha do `parseInt` por:

```javascript
const valor = JSON.parse(corpo).quantidade;
```

Nao ha vantagem tecnica em nenhuma das duas opcoes para este caso; o texto puro
apenas evita o passo de interpretar o JSON.

---

## 13. O que muda no futuro

- **Leitura real da balanca:** o endereco e o formato da resposta continuam os
  mesmos. Nada muda na IHM.
- **Autenticacao:** quando a API passar a exigir uma chave de acesso, sera
  necessario acrescentar uma linha ao codigo enviando essa chave no cabecalho da
  chamada. Voce sera avisado antes.

---

## 14. Referencias

- Documentacao visual da API (Swagger): <https://api.icassol.tech/docs>
- Contrato da API (OpenAPI): <https://api.icassol.tech/openapi.yaml>
- Codigo-fonte da API: <https://github.com/cidicassol-un/contagem-balanca>
- Weintek — JS Object SDK: <https://dl.weintek.com/public/Document/JS_Object_SDK/Current/index.html>
- Weintek — `net.Curl.Easy` (chamadas HTTP): <https://dl.weintek.com/public/Document/JS_Object_SDK/Current/net.Curl.Easy.html>
- Weintek — `driver.setData` (escrita em enderecos): <https://dl.weintek.com/public/Document/JS_Object_SDK/Current/driver.html>
- EasyBuilder Pro — Manual, capitulo 43 (JS Object): <https://dl.weintek.com/public/Document/JS_Object_SDK/Current/>
