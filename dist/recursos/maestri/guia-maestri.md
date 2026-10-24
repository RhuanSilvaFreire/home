# Maestri: um workspace espacial para orquestrar agentes de IA, terminais e navegador

Material informativo · baseado na documentação de uso da CLI do Maestri, conferido em 24/10/2026

O Maestri é um workspace em formato de canvas. Em vez de abas soltas, você posiciona no mesmo espaço **terminais com agentes de IA, notas e portais de navegador**, e liga uns aos outros. Este guia explica o modelo e os comandos principais da CLI `maestri`, que já vem no PATH dentro do workspace. Para detalhes e novidades, vale a documentação do próprio app.

## 1. As peças do canvas

| Peça | Para que serve |
|---|---|
| **Terminal** | Roda um agente (por exemplo Claude Code ou Codex) ou um shell comum |
| **Nota** | Texto compartilhado que um ou mais agentes conectados podem ler |
| **Portal** | Navegador embutido que um agente pode controlar (navegar, clicar, preencher, tirar print) |
| **Corda (conexão)** | Liga duas peças. Só quem está ligado consegue conversar ou usar a outra peça |
| **Banda** | Um time de agentes agrupado, em que todos falam com todos |
| **Andar (floor)** | Uma camada do workspace, que pode ter checkout git isolado para experimentos |

## 2. Ver quem está conectado

```
maestri list
```

Mostra os agentes, notas e portais ligados ao seu terminal. Rode esse comando antes de recrutar alguém novo: se já existe um colega com o papel certo, reaproveite.

## 3. Conversar entre agentes

```
maestri ask "Nome" "pedido"
maestri check "Nome"
```

- `ask` envia uma instrução a um agente conectado.
- `check` lê o que o agente escreveu, sem interromper.

Dica de fluxo: peça que o agente responda de volta com `maestri ask` quando terminar, em vez de você ficar conferindo.

## 4. Recrutar um colega com papel definido

```
maestri role create "Revisor" "Revise código. Nunca edite arquivos."
maestri recruit "Lince" --role "Revisor"
```

- O **papel (role)** é o prompt inicial do colega. Seja específico sobre o que ele pode e não pode fazer.
- `recruit` abre um novo terminal já ligado a você.
- `maestri preset list` mostra os agentes disponíveis para escolher com `--preset`.
- Para trocar o agente de um colega sem perder as conexões: `maestri recruit ... --replace "Nome"`.

## 5. Portais: o agente com navegador

```
maestri portal create http://localhost:3000 "App"
maestri portal snapshot "App"
maestri portal click "App" @e3
maestri portal screenshot "App"
```

O `snapshot` devolve a página como uma árvore de elementos com referências (`@e1`, `@e2`...). Use essas referências para clicar e preencher. Dá para testar layout responsivo com `maestri portal resize "App" 390 844`.

## 6. Andares isolados para experimentos

Quando a mudança é arriscada, crie um andar com branch própria, recrute o agente lá e traga de volta só quando estiver pronta:

```
maestri floor create "Experimento" --branch feat/ideia
maestri recruit "Pioneiro" --floor "Experimento"
maestri floor land "Experimento"
```

O checkout principal não é tocado enquanto o experimento acontece.

## 7. Boas práticas

- Dê a cada colega **um papel só**, com limites claros.
- Conecte apenas o necessário. Quem não está ligado não enxerga o resto.
- Use notas para contexto compartilhado em vez de repetir o mesmo texto em cada pedido.
- Dispense (`maestri dismiss`) quem terminou, para não ocupar terminais à toa.
- Revise o que o agente produziu antes de aceitar, principalmente em ações com efeito externo.

## 8. Checklist para começar

- [ ] Rodei `maestri list` e sei quem está conectado?
- [ ] Cada colega tem um papel claro e limites definidos?
- [ ] O contexto compartilhado está em uma nota, e não repetido em cada pedido?
- [ ] Mudanças arriscadas estão em um andar isolado?
- [ ] Peço que o colega responda de volta ao terminar?
- [ ] Revisei o resultado antes de aceitar?

## 9. Problemas comuns

| Sintoma | O que verificar |
|---|---|
| O comando `maestri` não é encontrado | Use a variável `MAESTRI_CLI`, que aponta para o executável |
| Um agente não enxerga a nota ou o portal | Falta a conexão (corda) entre eles |
| Colega duplicado com o mesmo papel | Rode `maestri list` antes de recrutar |
| O colega não segue o combinado | Reescreva o papel com limites mais específicos |
