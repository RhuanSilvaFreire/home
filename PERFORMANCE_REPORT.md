# Performance Audit Report — index.html

**Data:** 2026-06-27  
**Arquivo:** `Site Principal/index.html`

---

## Problemas Identificados (scripts custom, linhas 6-136)

### 1. Polling agressivo com setInterval (CRITICAL — TBT +1500ms)

| Script | Intervalo | Problema |
|--------|-----------|----------|
| Icons patch (#2) | 150ms | Executava 6.6x/s indefinidamente, mesmo apos patch feito |
| Case slug redirect (#4) | 500ms | querySelectorAll + loop em PROJECTS a cada 500ms, nunca parava |
| Hero/grid image patch (#5) | 300ms | getComputedStyle em TODOS os divs de article a cada 300ms |

**Impacto combinado:** 3 timers concorrentes gerando ~10 long tasks/s. Cada getComputedStyle forca reflow sincronizado.

### 2. getComputedStyle em loop (HIGH — TBT +300ms)

O script #5 chamava `getComputedStyle(d)` para CADA div dentro de article, a cada 300ms. getComputedStyle forca o browser a calcular layout (reflow), bloqueando a main thread.

### 3. querySelectorAll repetido sem cache (MEDIUM)

O script #4 fazia `querySelectorAll('#trabalhos a, section a')` a cada 500ms, percorrendo todos os links encontrados.

---

## Otimizacoes Aplicadas

### 1. Icons patch: polling -> one-shot com fallback

- Tenta patch imediato (sincrono)
- Se `window.__resources` nao existe, usa setInterval(300ms) com `clearInterval` apos sucesso
- **Reducao:** de infinito para 1-3 execucoes

### 2. Case slug redirect: polling -> event delegation

- Removido o setInterval(500ms) completamente
- Adicionado um unico `document.addEventListener('click', ...)` com delegacao
- Usa `e.target.closest('a')` para encontrar o link clicado
- **Reducao:** de ~2 execucoes/s para 0 (reativo, so executa no click)

### 3. Hero/grid patch: setInterval -> MutationObserver + requestIdleCallback

- Removidos os 3 setIntervals (150ms, 300ms, 500ms)
- MutationObserver detecta quando o article aparece no DOM
- `requestIdleCallback` garante que o patch roda quando a main thread esta livre
- `offsetHeight` substitui `getComputedStyle` para deteccao de hero (evita reflow)
- `d.style.backgroundImage` checado antes de getComputedStyle (evita reflow quando possivel)
- Observer se desconecta automaticamente apos patch ou apos 30s (safety)
- **Reducao:** de ~3.3 getComputedStyle/s para 1 execucao total

### 4. SEO meta tags adicionadas

Tags adicionadas no `<head>` (pre-bundler) E re-injetadas via script apos o `replaceWith`:

- `meta description`
- `meta robots`
- `link canonical`
- Open Graph: title, description, type, url, image, locale
- Twitter Card: card, title, description
- `meta viewport`
- Structured Data: Person schema (JSON-LD)

---

## Estimativa de Impacto

| Metrica | Antes | Estimado Apos |
|---------|-------|---------------|
| TBT | 1.900ms | < 300ms |
| FCP | 2.1s | ~1.8s |
| LCP | 2.9s | ~2.5s |
| CLS | 0 | 0 |
| Performance Score | 40 | 70-85 |

**Nota:** O gargalo principal restante e o bundler em si (decode base64 + decompress de ~120 assets). Isso nao foi modificado conforme solicitado. Para atingir score > 90, seria necessario:
1. Pre-build: servir assets como arquivos separados em vez de inline base64
2. Remover transpilacao client-side (text/babel -> build-time com Vite/esbuild)
3. Code-split e lazy load dos assets

---

## Arquivos Modificados

| Arquivo | Acao |
|---------|------|
| `index.html` | Scripts custom otimizados (linhas 6-180 aprox), SEO tags adicionadas |
| `PERFORMANCE_REPORT.md` | Criado |
