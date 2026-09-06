# PRD: Migração GA4 → GTM (GTM-P2M3SV2R)

## Introdução

Atualmente o site `dev.rhuanfreire.com.br` tem o GA4 (`G-TFWN2SL819`) instalado diretamente no `<head>` via gtag.js. O objetivo é migrar para o Google Tag Manager (`GTM-P2M3SV2R`), que passa a ser o único ponto de instalação no HTML — e o GA4 vira uma tag gerenciada dentro do GTM. Isso permite adicionar futuras tags (Meta Pixel, LinkedIn Insight, etc.) sem tocar no código.

---

## Goals

- Instalar o container GTM no `index.html`
- Criar a tag GA4 dentro do GTM apontando para `G-TFWN2SL819`
- Remover o script GA4 direto do HTML
- Publicar o container GTM
- Manter rastreamento de eventos customizados já existentes (cliques em trabalhos e CTAs)

---

## User Stories

### US-001: Instalar snippets do GTM no index.html
**Descrição:** Como desenvolvedor, preciso instalar o GTM no site para que ele passe a gerenciar todas as tags.

**Acceptance Criteria:**
- [x] Snippet 1 (`<script>` do GTM) adicionado no `<head>`, antes de qualquer outro script
- [x] Snippet 2 (`<noscript>` do GTM) adicionado logo após a abertura do `<body>`
- [x] Script GA4 direto (`gtag.js` e `gtag('config', ...)`) removido do HTML
- [x] Sync do `dist/index.html` feito
- [x] Commit e push para `RhuanSilvaFreire/home`

### US-002: Criar tag GA4 dentro do GTM
**Descrição:** Como analista, preciso que o GA4 seja disparado via GTM para centralizar o gerenciamento.

**Acceptance Criteria:**
- [x] Tag do tipo "Google Analytics: configuração do GA4" criada no GTM
- [x] ID de medição preenchido com `G-TFWN2SL819`
- [x] Acionador configurado como "All Pages" (Todas as páginas)
- [x] Tag nomeada como `GA4 - home-site`

### US-003: Migrar eventos customizados para o GTM
**Descrição:** Como analista, preciso que os eventos de clique (trabalhos e CTAs) continuem funcionando após a migração.

**Acceptance Criteria:**
- [x] Verificar se os eventos `click_trabalho` e `click_cta` ainda disparam após a migração
- [ ] Se necessário, recriar os eventos como tags de evento GA4 dentro do GTM
- [x] Testar com o modo de visualização do GTM (Preview)

### US-004: Publicar o container GTM
**Descrição:** Como administrador, preciso publicar o container para que as tags entrem em produção.

**Acceptance Criteria:**
- [x] Container publicado com nome de versão `v1 - GA4 migration`
- [x] Verificar no GA4 em tempo real que os hits estão chegando
- [ ] Verificar que a página `/ura/` também continua rastreada

---

## Functional Requirements

- FR-1: O snippet GTM deve ser o **primeiro script** no `<head>` do `index.html`
- FR-2: O snippet `<noscript>` do GTM deve ser inserido **imediatamente após `<body>`**
- FR-3: Todo código `gtag.js` e `gtag('config', 'G-TFWN2SL819')` deve ser **removido** do HTML
- FR-4: A tag GA4 no GTM deve usar o acionador **"All Pages"**
- FR-5: O container deve ser **publicado** antes de validar — modo Preview não serve de produção

---

## Non-Goals

- Não migrar a página `/ura/` neste momento (ela tem GA4 direto na VPS — tratar separado)
- Não configurar Meta Pixel ou LinkedIn Insight agora (ficam para quando os acessos forem criados)
- Não criar tags de remarketing ou conversão agora

---

## Step by Step — Execução

### Parte 1 — No site (index.html)

**Passo 1:** Substituir o script GA4 direto pelos snippets do GTM.

Remover do `<head>`:
```html
<!-- Google Analytics 4 — substitua G-TFWN2SL819 pelo seu Measurement ID -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TFWN2SL819"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-TFWN2SL819');
</script>
```

Adicionar no lugar (primeiro script do `<head>`):
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-P2M3SV2R');</script>
<!-- End Google Tag Manager -->
```

Adicionar logo após `<body>`:
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P2M3SV2R"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

**Passo 2:** Verificar se o código de eventos customizados (no final do `index.html`) ainda usa `typeof gtag === 'function'` — se sim, continua funcionando pois o GTM expõe `gtag` via dataLayer.

**Passo 3:** Sync `dist/index.html`, commit e push.

---

### Parte 2 — No GTM (tagmanager.google.com)

**Passo 4:** Acessar o container `GTM-P2M3SV2R`.

**Passo 5:** Criar nova tag:
- Clique em **Tags → Nova**
- Tipo: **"Configuração do Google Analytics: GA4"**
- ID de medição: `G-TFWN2SL819`
- Nome da tag: `GA4 - home-site`
- Acionador: **All Pages**
- Salvar

**Passo 6:** Testar com modo Preview:
- Clique em **Visualizar** (Preview)
- Inserir URL `https://dev.rhuanfreire.com.br`
- Verificar que a tag `GA4 - home-site` aparece como disparada em "Tags Fired"

**Passo 7:** Publicar o container:
- Clique em **Enviar**
- Nome da versão: `v1 - GA4 migration`
- Descrição: `Migração do GA4 direto para dentro do GTM`
- Publicar

---

### Parte 3 — Validação

**Passo 8:** No GA4 (`analytics.google.com`):
- Acessar **Relatórios → Tempo real**
- Abrir `dev.rhuanfreire.com.br` em outra aba
- Confirmar que o hit aparece em tempo real

**Passo 9:** No GTM:
- Verificar que "Qualidade de Contêiner" sobe de "Sem dados recentes" para ativo

---

## Technical Considerations

- Container ID: `GTM-P2M3SV2R`
- GA4 Measurement ID: `G-TFWN2SL819`
- Site: `dev.rhuanfreire.com.br` (Cloudflare Workers, branch `main` do repo `RhuanSilvaFreire/home`)
- A página `/ura/` na VPS tem GA4 direto — **não alterar neste PRD**
- Os eventos customizados no `index.html` usam `gtag()` com guard `typeof gtag === 'function'` — compatível com GTM

---

## Success Metrics

- GA4 recebe hits via GTM (verificado em tempo real)
- Nenhum hit duplicado (GA4 direto removido do HTML)
- "Qualidade de Contêiner" no GTM sem alertas
- Eventos `click_trabalho` e `click_cta` continuam disparando

---

## Open Questions

- Os eventos customizados precisarão ser recriados como tags GTM no futuro para gestão centralizada?
- Quando instalar Meta Pixel — criar agora o acionador base ou aguardar o acesso à conta?
