# CLAUDE.md — home-rhuan

Site pessoal de Rhuan Freire em https://dev.rhuanfreire.com.br. HTML/CSS/JS estático, sem build.

## Deploy

- Cloudflare Workers (`rhuansite-home`) ligado ao GitHub `RhuanSilvaFreire/home`.
- **Push na `main` = deploy de produção** (`npx wrangler deploy --no-bundle`, ~1 min). Outras branches geram só versão de prévia.
- O Worker publica a pasta **`dist/`** (ver `wrangler.toml`). Ela é uma cópia manual da raiz: **toda alteração na raiz precisa ser copiada para `dist/`** no mesmo caminho, inclusive `assets/`, `images/` e vídeos.
- Só faça push/commit quando o usuário pedir explicitamente.

## Paleta e tipografia (fonte da verdade: commit 36f4c6e e `PALETA.md`)

- Cores permitidas: `#0D0D0D` (carbon), `#F5F3EE` (bone) e suas opacidades `rgba(245,243,238,x)`, `#C45E3A` (terracota, acento), `#A84E30`, `#496A89` (slate), `#161616`/`#1a1a1a` (superfícies), `#4ade80` (status online).
- Não use branco puro, preto puro, azul nem cinzas fora dessa lista.
- Fontes: Inter Tight (títulos) e Inter (texto). Sem Google Fonts extras.

## Arquitetura dos efeitos

| Arquivo | Escopo |
|---|---|
| `assets/fx.css` | Camada visual de **todas** as páginas: tokens, header, botões glass (`.btn`, `.btn-white`), cards, lente HUD (`--heat`), tela de carregamento HUD, barra de progresso, cortina de âncora, correções anti scroll lateral. Carregado depois do `<style>` inline de cada página. |
| `assets/fx.js` | Base de **todas** as páginas: Lenis + GSAP ScrollTrigger (iniciados uma vez), header que aparece após 120px (`data-header-auto`), âncoras (salto com fade quando longe), `FX.split` (texto em letras/palavras com `aria-label`), `FX.repel` (lente HUD no mouse), `FX.autoReveal` (páginas internas), `FX.lazyVideos`, `FX.ensurePlay` (autoplay bloqueado no celular). |
| `assets/home.js` | Só a home (`<html data-fx-home>`): preloader HUD, entrada da hero, reveals com scrub, parallax, manifesto acendendo palavra a palavra, faixas com zoom fixado, trabalhos em faixa horizontal fixada, pílulas com física (Matter.js carregado sob demanda). |
| `index.html` | Home. CSS inline específico + script inline no `<head>` que liga `fx-js`, `fx-header-hide` e `fx-loading` e tem fallback de 7s. |

Libs via CDN (versões fixas): GSAP 3.13.0 + ScrollTrigger (cdnjs), Lenis 1.3.11 (jsdelivr), Matter.js 0.19.0 (cdnjs, sob demanda).

## Decisões que não devem ser revertidas sem pedido

- **Efeitos rodam mesmo com `prefers-reduced-motion`.** O Windows do usuário tem "Efeitos de animação" desligado; antes disso o site ficava estático para ele. Só os loops infinitos de CSS respeitam a preferência.
- **Paridade desktop/mobile:** todo efeito existe nos dois, mudando só a intensidade. Mouse → lente/holofote/arrastar; toque → varredura de brilho automática, holofote ambiente, pílulas pulam ao tocar.
- **Manifesto e "Sobre" não reagem ao mouse** (ficava ilegível). Só o título da hero tem a lente HUD.
- **Lente HUD** (`fx.js`): letras sobem e acendem, nunca se deslocam para os lados. Parâmetros: `RADIUS`, `LIFT`, `GROW`.
- **Tela de carregamento** aparece em **todo** carregamento da home. Mínimo 2,2s, teto 4,5s (`PRELOADER_MIN_S`/`PRELOADER_MAX_S`).
- **Vídeos:** `hero.mp4` sem loop (congela no cubo). `areas.mp4` = trecho 5–10s do `hero.mp4` invertido (cubo → robô laranja), sem loop. Regerar com:
  `ffmpeg -ss 5 -i hero.mp4 -t 5.05 -vf reverse -an -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -movflags +faststart areas.mp4`
- **Pins na ordem do DOM:** o pin dos trabalhos usa `refreshPriority: -1` porque é criado antes do pin das faixas, que fica acima dele. Ao adicionar pins, mantenha essa ordem.
- **og:image** = `https://dev.rhuanfreire.com.br/images/og-cover-1200x630.jpg` em todas as páginas.

## Como verificar

- Servidor local: `cd dist && python -m http.server 8765` e abrir http://localhost:8765/.
- Teste em 1440px, ~1200px e 390px. Conferir: sem scroll lateral (`document.documentElement.scrollWidth === innerWidth`), sem erros no console, pins sem sobreposição.
- O Chrome do usuário reporta `prefers-reduced-motion: reduce`; teste também com essa emulação.

## Pendências conhecidas

- `hero.mp4` é vertical (1192×1740) e com bitrate baixo: fica sem nitidez em tela larga. Precisa de um vídeo horizontal 1920×1080 (3–5 MB).
- Copy: só a hero foi revisada. Título "Software que roda. Infra que segura." (posicionamento tech amplo, sem nichar em IA ou atendimento).
- Lighthouse não foi medido depois das mudanças (preloader pode afetar LCP).
