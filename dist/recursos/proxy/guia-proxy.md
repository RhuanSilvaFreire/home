# Proxy: reverso, forward e o que cada um resolve

Material informativo · conceitos gerais e exemplos de configuração · confira a documentação da ferramenta que você usa

Proxy é uma máquina (ou serviço) que fica no meio do caminho entre quem pede e quem responde. A diferença entre os tipos está em **de que lado ele fica**.

## 1. Os dois lados

| | Proxy reverso | Proxy forward (direto) |
|---|---|---|
| Fica na frente de | Dos **servidores** | Dos **clientes** |
| Quem sabe que ele existe | O cliente nem percebe | O cliente é configurado para usá-lo |
| Para que serve | Publicar serviços, HTTPS, roteamento por domínio, balanceamento, cache | Controlar e registrar a saída para a internet, filtrar destinos, cache, ocultar a origem |
| Exemplos de ferramenta | Traefik, Caddy, nginx, HAProxy | Squid e proxies de saída corporativos |

Regra prática: **se você quer publicar um serviço, é reverso. Se quer controlar para onde os clientes saem, é forward.**

## 2. O que o proxy reverso resolve

- **Uma porta, vários serviços:** o proxy escuta em 80 e 443 e encaminha `app.exemplo.com` para um container e `api.exemplo.com` para outro.
- **HTTPS num lugar só:** o certificado fica no proxy, e os serviços atrás conversam em HTTP dentro da rede privada.
- **Menos exposição:** os serviços não precisam publicar porta no host.
- **Balanceamento e saúde:** distribui entre réplicas e tira do ar a que falha.

## 3. Exemplos mínimos

Caddy (o certificado HTTPS sai automático):

```
app.exemplo.com {
    reverse_proxy app:8080
}
```

nginx:

```
server {
    listen 80;
    server_name app.exemplo.com;

    location / {
        proxy_pass http://app:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Traefik: as regras ficam em labels do container. Veja o material de Traefik para um compose completo.

## 4. Cuidados que mais dão problema

- **Cabeçalhos de origem:** sem `X-Forwarded-For` e `X-Forwarded-Proto`, a aplicação enxerga o IP do proxy e acha que a conexão é HTTP. Configure a aplicação para confiar nesses cabeçalhos **só** vindos do proxy.
- **Conexões longas (WebSocket, SSE):** exigem timeout maior e, em alguns proxies, o buffer desligado. Sintoma típico: a conexão abre e cai ou fica pendurada.
- **Tamanho de upload:** o proxy pode limitar o corpo da requisição antes da aplicação ver.
- **Painéis administrativos:** não exponha o painel do próprio proxy sem autenticação.
- **Rede certa:** o proxy e o serviço precisam estar na mesma rede de containers.

## 5. Quando usar o forward

- Registrar e controlar o que os servidores acessam para fora.
- Liberar saída só para destinos conhecidos.
- Reduzir banda com cache de downloads repetidos.

## 6. Diagnóstico de erros comuns

| Sintoma | Causa provável |
|---|---|
| **502 Bad Gateway** | O proxy não alcançou o serviço: nome, porta ou rede errados, ou o serviço caiu |
| **504 Gateway Timeout** | O serviço demora mais do que o timeout do proxy |
| **Redireciona em laço** | A aplicação acha que está em HTTP e redireciona para HTTPS de novo. Falta o `X-Forwarded-Proto` |
| **IP de todo cliente igual** | A aplicação lê o IP do proxy. Falta confiar no `X-Forwarded-For` |
| **WebSocket/SSE cai** | Buffer ligado ou timeout curto no proxy |

## 7. Checklist

- [ ] Os serviços ficam na rede interna, sem porta publicada no host?
- [ ] O HTTPS termina no proxy, com renovação automática?
- [ ] A aplicação confia nos cabeçalhos `X-Forwarded-*` só do proxy?
- [ ] Os timeouts e o buffer foram ajustados para conexões longas?
- [ ] O painel do proxy não está público?
- [ ] Há teste de saúde para tirar do ar a réplica com falha?

## 8. Referências

- Caddy, `reverse_proxy`: caddyserver.com/docs/caddyfile/directives/reverse_proxy
- nginx, módulo `proxy`: nginx.org/en/docs/http/ngx_http_proxy_module.html
- Traefik: doc.traefik.io/traefik/
