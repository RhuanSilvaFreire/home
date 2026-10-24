# Rede interna: serviços que não aparecem na internet

Material informativo · conferido na documentação de redes do Docker (overlay e Swarm) em 24/10/2026

Quanto menos portas abertas para fora, menor a superfície de ataque. A ideia deste guia: só o proxy reverso fica exposto; banco, fila, cache e painéis conversam por uma **rede interna** e você acessa a administração por uma VPN privada, como o Tailscale.

## 1. O desenho

```
Internet --> proxy reverso (80/443)
                  |
            rede "publica"  --> serviços web
                  |
            rede "interna"  --> banco, cache, fila (sem porta publicada)
Admin --> VPN privada (Tailscale) --> painéis e SSH
```

## 2. Redes separadas por função

No Docker Swarm, use redes `overlay`. Duas redes já resolvem a maioria dos casos:

```
docker network create -d overlay --attachable publica
docker network create -d overlay --internal interna
```

- `publica`: o proxy e os serviços que ele atende.
- `interna`: banco, cache e fila. A opção `--internal` impede que a rede tenha saída para fora.
- Um serviço pode estar nas duas redes: a aplicação fala com o proxy pela `publica` e com o banco pela `interna`.

## 3. No stack

```
services:
  app:
    image: minha-app:1.0
    networks: [publica, interna]
  banco:
    image: postgres:17
    networks: [interna]

networks:
  publica:
    external: true
  interna:
    external: true
```

- O `banco` está só na `interna`, **sem** `ports:`. Nada de fora chega nele.
- Dentro da rede, os serviços se encontram pelo **nome do serviço** (por exemplo `banco:5432`), sem IP fixo.

## 4. Não publique porta que não precisa

`ports:` abre a porta no host, para todo mundo. Regras simples:

- Só o proxy publica `80` e `443`.
- Banco, cache e fila nunca publicam porta. Quem precisa deles entra pela rede interna.
- Um painel de administração fica atrás do proxy com autenticação, ou acessível só pela VPN.

## 5. Criptografia do tráfego entre nós

Em um Swarm com mais de um nó, o tráfego de gerenciamento é criptografado por padrão. O tráfego de **dados** da rede overlay não é, a menos que você peça:

```
docker network create -d overlay --opt encrypted interna
```

A criptografia tem custo de desempenho. Use em redes que carregam dados sensíveis entre nós.

## 6. Firewall no host

A rede interna do Docker não substitui o firewall. Combine:

- bloqueie tudo que chega e libere só `80`, `443` e o acesso de administração;
- mantenha o SSH fechado para a internet e acessível pela VPN;
- lembre que portas publicadas pelo Docker passam por regras próprias do Docker, então confirme com uma varredura de fora, e não só olhando a regra do firewall.

## 7. Acesso de administração pela VPN

Com o Tailscale (ou similar), cada máquina ganha um endereço privado. Painéis e SSH escutam só nesse endereço. Resultado: nada de administração exposto à internet.

## 8. Como testar

1. De uma máquina fora da sua rede, rode uma varredura de portas no IP público e confira que só 80 e 443 respondem.
2. Tente acessar o banco pelo IP público: deve falhar.
3. Dentro de um container da rede `interna`, resolva o nome do banco e conecte: deve funcionar.
4. Tente chegar ao painel de administração sem estar na VPN: deve falhar.

## 9. Checklist

- [ ] Só o proxy reverso publica portas?
- [ ] Banco, cache e fila estão em rede `--internal` e sem `ports:`?
- [ ] Os serviços se falam por nome, e não por IP?
- [ ] O firewall do host bloqueia o resto?
- [ ] O SSH e os painéis só respondem pela VPN?
- [ ] Redes com dados sensíveis entre nós usam `--opt encrypted`?
- [ ] Você testou de fora e confirmou o que está aberto?

## 10. Problemas comuns

| Sintoma | O que verificar |
|---|---|
| A aplicação não alcança o banco | Os dois precisam estar na mesma rede, e o nome é o do serviço |
| Serviço em rede `--internal` não acessa a internet | É o esperado. Coloque também em uma rede com saída se precisar |
| Porta aparece aberta mesmo com firewall | Portas publicadas pelo Docker têm regras próprias. Remova o `ports:` ou restrinja o endereço |
| Lentidão entre nós | Confira se `encrypted` está ligado e se vale o custo |
