# n8n + MCP + Claude Code: guia passo a passo

**Rhuan Freire** · dev.rhuanfreire.com.br · Material de consulta · conferido na documentação oficial do n8n e do Claude Code em 24/10/2026

Este guia leva você do zero até um agente (Claude Code) chamando workflows do seu n8n por MCP. Os nomes de menus e comandos abaixo vêm da documentação oficial; se a sua versão for diferente, a documentação dela vale mais do que este PDF.

## 1. Escolha o caminho

| | Caminho A: MCP da instância | Caminho B: nó MCP Server Trigger |
|---|---|---|
| O que expõe | Workflows que você marcar como disponíveis no MCP | Só as ferramentas ligadas a um workflow |
| Autenticação | OAuth (recomendado) ou chave de API | Nenhuma, Bearer ou Header, definida no nó |
| URL | termina em `/mcp-server/http` | URL de produção do nó (tem o seu próprio caminho) |
| Quando usar | Quer que o agente enxergue e rode workflows existentes | Quer montar um conjunto pequeno de ferramentas sob medida |

Dá para usar os dois ao mesmo tempo.

## 2. Caminho A: ligar o MCP da instância

1. Entre no n8n como **dono ou administrador** e abra **Settings > Instance-level MCP**.
2. Marque **Enable MCP access**.
3. Escolha quais workflows o agente pode usar. Nenhum workflow fica exposto por padrão. Use uma destas opções:
    - **Settings > Instance-level MCP > Workflows enabled > Enable workflows**, escolha o workflow e confirme;
    - no editor do workflow: menu `...` > **Settings** > ligue **Available in MCP**;
    - na lista de workflows: menu do cartão > **Enable MCP access**.
4. Existe a opção **Auto-expose new workflows**, que expõe os workflows futuros sozinha. Ela vem desligada, e é melhor deixar assim.
5. Em **Connection details**, clique em **Connect**. Na janela **Connect a client** estão o **Server URL** e as duas formas de autenticar:
    - **OAuth (recomendado):** o cliente abre o navegador e você aprova o acesso no n8n;
    - **API key:** o n8n gera um token ligado à sua conta. **O token só aparece uma vez**; depois fica oculto. Gerar outro revoga o anterior na hora.

O Server URL termina em `/mcp-server/http`. Copie ele da janela, não da barra de endereço do navegador.

## 3. Caminho B: o nó MCP Server Trigger

1. Crie um workflow e adicione o nó **MCP Server Trigger**. Ele não dispara o workflow nem passa dados adiante: só se liga a nós de ferramenta.
2. Ligue as ferramentas ao nó. Para expor outro workflow seu, use o nó **Custom n8n Workflow Tool**.
3. Dê a cada ferramenta um nome objetivo e uma descrição curta. O agente escolhe a ferramenta por esses dois textos.
4. No campo **Authentication**, escolha **Bearer auth** ou **Header auth** e crie a credencial. Evite deixar **None** em servidor exposto na internet.
5. O campo **Path** vem com um caminho aleatório, o que evita conflito. Você pode trocar por um nome seu.
6. O nó mostra duas URLs: **test** e **production**. A de teste só existe enquanto você escuta um evento de teste. A **production** passa a valer quando você **publica** o workflow. Use a de produção no cliente.
7. O nó aceita **SSE** e **HTTP em streaming**. Não aceita stdio.

## 4. Ligar no Claude Code

Substitua `SEU-N8N` pelo domínio que serve o editor do seu n8n.

### Caminho A, com OAuth (recomendado)

```bash
claude mcp add --transport http n8n https://SEU-N8N/mcp-server/http
```

Depois, dentro do Claude Code, rode `/mcp`, escolha **n8n** e conclua a autorização no navegador.

### Caminho A, com chave de API

```bash
claude mcp add --transport http n8n-mcp https://SEU-N8N/mcp-server/http \
  --header "Authorization: Bearer SEU_TOKEN"
```

### Caminho B, nó MCP Server Trigger

```bash
claude mcp add --transport http n8n-ferramentas URL_DE_PRODUCAO_DO_NO \
  --header "Authorization: Bearer SEU_TOKEN"
```

Se o seu servidor só aceitar SSE, use `--transport sse`. O SSE está marcado como descontinuado no Claude Code, então prefira HTTP sempre que a versão do n8n permitir.

### Onde a configuração fica

Use `--scope` para escolher:

- `local` (padrão): só você, só neste projeto;
- `user`: todos os seus projetos;
- `project`: grava em `.mcp.json` na raiz do projeto, que vai para o Git. **Nunca coloque o token escrito no arquivo.** Use uma variável de ambiente, por exemplo `"Authorization": "Bearer ${N8N_MCP_TOKEN}"`.

### Conferir e gerenciar

```bash
claude mcp list          # mostra os servidores
claude mcp get n8n       # detalhes de um servidor
claude mcp remove n8n    # remove (apaga também os tokens OAuth guardados)
```

Dentro do Claude Code, `/mcp` mostra o estado de cada servidor (conectado ou com falha) e permite reconectar ou autenticar de novo.

## 5. Primeiro teste

1. Abra o Claude Code e rode `/mcp`. O servidor deve aparecer como conectado.
2. Peça algo de **leitura**, por exemplo: "liste os workflows do n8n disponíveis para você" ou chame a ferramenta de consulta que você criou.
3. Só depois libere ferramentas que **escrevem** (criar, enviar, apagar), uma de cada vez.

## 6. Segurança antes de liberar

- [ ] A autenticação está ligada, e o token não está em print, repositório nem mensagem de chat?
- [ ] Só os workflows e ferramentas necessários estão expostos? Nenhuma que apague, pague ou envie mensagem em massa sem aprovação?
- [ ] Ações sensíveis pedem confirmação de uma pessoa antes?
- [ ] O retorno das ferramentas é tratado como dado não confiável? Texto vindo de fora pode carregar instruções (prompt injection).
- [ ] Cada ferramenta valida os parâmetros que recebe, em vez de confiar no que o modelo mandou?
- [ ] Há limite de chamadas e registro das execuções (aba Executions) para investigar?
- [ ] Você sabe revogar o acesso? No Caminho A, desligue em **Connection details > MCP status > Disable** (isso desconecta todos os clientes) ou gere outra chave.

## 7. Problemas comuns

| Sintoma | O que verificar |
|---|---|
| "You do not have sufficient permissions to authorize this request" ao entrar | O acesso MCP da instância está desligado, ou você não é dono/administrador. Ligue em Settings > Instance-level MCP |
| O Claude Code conecta, mas não vê nenhum workflow | O workflow não está marcado como **Available in MCP** (Caminho A) ou não foi publicado (Caminho B) |
| Erro 401 ou 403 | O cabeçalho `Authorization: Bearer ...` precisa ser idêntico ao token gerado. Se você gerou outro, o antigo foi revogado |
| Conexão cai ou fica pendurada atrás de proxy | Desligue o buffer de proxy no endpoint MCP (no nginx, `proxy_buffering off`), e remova o gzip e o chunked encoding desse caminho. Veja a documentação do n8n sobre proxy reverso |
| Vários replicadores de webhook (modo fila) | Direcione todas as chamadas `/mcp*` para um único replicador, senão as conexões podem quebrar |
| Usei a URL de teste e parou de funcionar | A URL de teste só vale durante a escuta. Use a **production** e publique o workflow |
| O agente chama a ferramenta errada | Reescreva o nome e a descrição da ferramenta. É o ajuste que mais resolve |

## 8. Referências oficiais

- n8n, acessar o servidor MCP da instância: docs.n8n.io/advanced-ai/mcp/accessing-n8n-mcp-server/
- n8n, nó MCP Server Trigger: docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcptrigger/
- n8n, exemplos de clientes MCP: docs.n8n.io/connect/connect-to-n8n-mcp-server/mcp-client-examples/
- Claude Code, MCP: code.claude.com/docs/en/mcp

---

Precisa disso rodando no seu ambiente? Fale comigo: wa.me/5511996368169
