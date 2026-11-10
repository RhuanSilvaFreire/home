# Tailscale: rede privada entre suas máquinas, passo a passo

Material informativo · conferido na documentação oficial do Tailscale em 24/10/2026

O Tailscale cria uma rede privada (a **tailnet**) entre os seus dispositivos: servidores, notebooks e celulares. Cada máquina fala com as outras como se estivessem na mesma rede local, sem abrir porta no roteador nem expor serviço na internet. Se a sua versão ou o seu plano forem diferentes, a documentação oficial vale mais do que este guia.

## 1. Conceitos em um minuto

| Termo | O que é |
|---|---|
| **Tailnet** | A sua rede privada. Você cria uma ao entrar com uma conta de login único (SSO), como Google ou Microsoft |
| **Dispositivo** | Qualquer máquina com o cliente instalado e autenticado na sua tailnet |
| **Endereço 100.x.y.z** | Cada dispositivo recebe um IP próprio, que não muda quando ele troca de rede |
| **MagicDNS** | Permite chamar o dispositivo pelo nome (o que aparece na página Machines do painel) em vez do IP. Vem ligado por padrão |
| **ACLs / política de acesso** | O arquivo que define quem pode falar com quem. Fica em **Access controls**, no painel de administração |

## 2. Instalar e entrar

1. Crie a conta em tailscale.com e abra o painel de administração.
2. Instale o cliente em cada dispositivo (Linux, Windows, macOS, iOS e Android têm instalador próprio; veja a página de instalação oficial).
3. No Linux, a instalação por script é:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

4. Suba a conexão e autentique:

```bash
sudo tailscale up
```

O comando mostra um endereço (URL). Abra no navegador e entre com a mesma conta da tailnet.

5. Confira:

```bash
tailscale status    # lista os dispositivos conectados
tailscale ip        # mostra os IPs deste dispositivo
```

6. No painel, a página **Machines** deve listar o dispositivo novo.

Para testar, pelo outro dispositivo da tailnet, acesse `http://NOME-DA-MAQUINA` (MagicDNS) ou o IP 100.x.y.z de um serviço que esteja rodando nela.

## 3. Escolhendo o que expor

| Recurso | Para que serve |
|---|---|
| **Subnet router** | Dá acesso a dispositivos que não rodam o cliente (impressora, câmera, uma rede inteira) por uma máquina da tailnet |
| **Exit node** | Faz o tráfego de um dispositivo sair pela internet através de outro, por exemplo o seu servidor |
| **Tailscale Serve** | Compartilha um serviço local **só dentro da tailnet**, com HTTPS |
| **Tailscale Funnel** | Expõe um serviço à **internet pública**. Use só se for isso mesmo que você quer |

Exemplo de Serve (só para a tailnet):

```bash
tailscale serve localhost:3000
```

Atenção: **Funnel deixa o serviço acessível a qualquer pessoa na internet.** Quando a ideia é só você e a sua equipe, use Serve.

## 4. Regras de acesso (ACLs)

Por padrão, uma tailnet nova costuma permitir que todos os dispositivos conversem entre si. Quando houver mais de uma pessoa ou dispositivos sensíveis, restrinja:

- edite a política em **Access controls** no painel;
- comece negando o que não é preciso e libere só o que cada grupo usa (por exemplo, apenas a porta do painel interno);
- teste a mudança antes de salvar, com o testador de regras da própria página, se a sua conta oferecer.

## 5. Checklist de segurança

- [ ] A autenticação da conta usa verificação em duas etapas?
- [ ] Os dispositivos que saíram de uso foram removidos do painel?
- [ ] As ACLs liberam só o que é necessário, e não "todos para todos"?
- [ ] Nenhum serviço ficou exposto por Funnel sem querer?
- [ ] Subnet routers e exit nodes são máquinas que você mantém atualizadas?
- [ ] O que antes ficava aberto na internet (painéis, bancos) passou a ficar só na tailnet?

## 6. Problemas comuns

| Sintoma | O que verificar |
|---|---|
| Dispositivo não aparece em Machines | O `sudo tailscale up` terminou? Você abriu a URL e entrou na conta certa? |
| A chave do dispositivo expirou | `sudo tailscale up --force-reauth` e autentique de novo |
| Acessa pelo IP mas não pelo nome | Confira se o MagicDNS está ligado no painel |
| "Não conecta" a um serviço da outra máquina | O serviço escuta em `0.0.0.0` ou no IP da tailnet? E as ACLs permitem aquela porta? |
| Rede lenta ou conexão indireta | Dispositivos atrás de redes restritivas podem usar um relé; veja `tailscale status` e a documentação sobre conexões diretas |

## 7. Referências oficiais

- Visão geral da instalação e da tailnet: tailscale.com/kb/1017/install
- Instalação no Linux: tailscale.com/kb/1031/install-linux
- Tailscale Serve e Funnel: tailscale.com/kb/1242/tailscale-serve
- ACLs: tailscale.com/docs/features/access-control/acls
