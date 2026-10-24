# Backup e restore que funcionam: bancos, volumes e o teste que ninguém faz

Material informativo · conferido na documentação oficial do PostgreSQL e do SQLite em 24/10/2026

Backup só vale se a **restauração** funciona. Este guia mostra o essencial para copiar bancos e volumes de forma consistente e, principalmente, como testar a volta. Se a sua versão for diferente, a documentação oficial vale mais do que este guia.

## 1. O que entra no backup

| Item | Exemplos |
|---|---|
| **Bancos de dados** | PostgreSQL, SQLite, MySQL |
| **Volumes e arquivos enviados** | Pastas de uploads, dados de aplicações |
| **Configuração** | Arquivos de stack ou compose, `.env`, certificados |
| **Segredos** | Guardados à parte e cifrados, nunca junto do backup em texto puro |

Regra de bolso (3-2-1): **3 cópias** dos dados, em **2 tipos de mídia** diferentes, com **1 cópia fora do local**.

## 2. PostgreSQL

`pg_dump` copia um banco com consistência: o resultado é um retrato do momento em que o comando começou, e ele não bloqueia as outras operações.

```bash
pg_dump -Fc -h HOST -U USUARIO NOME_DO_BANCO > banco.dump
```

O formato `-Fc` (custom) é comprimido e permite restaurar só algumas tabelas. Para restaurar:

```bash
createdb -T template0 NOVO_BANCO
pg_restore -d NOVO_BANCO banco.dump
```

Para guardar também os usuários e permissões do servidor (que o `pg_dump` não inclui):

```bash
pg_dumpall --globals-only > globais.sql
```

Depois de restaurar, rode `ANALYZE` em cada banco, para o planejador de consultas ter estatísticas.

## 3. SQLite

Copiar o arquivo do banco enquanto a aplicação grava pode gerar uma cópia inconsistente. O shell do SQLite tem o comando `.backup`:

```bash
sqlite3 /caminho/app.db ".backup /caminho/backup/app.db"
```

Para uma cópia em texto, que serve de arquivo de longo prazo:

```bash
sqlite3 /caminho/app.db .dump | gzip -c > app.dump.gz
```

## 4. Volumes do Docker

```bash
docker run --rm -v NOME_DO_VOLUME:/dados -v "$(pwd)":/backup alpine \
  tar czf /backup/volume.tar.gz -C /dados .
```

Para serviços que escrevem o tempo todo (bancos), prefira o backup pela própria ferramenta do banco, e não pela cópia da pasta.

## 5. Automatizar

Um script simples, chamado todo dia pelo `cron`:

```bash
#!/bin/sh
set -eu
DIA=$(date +%F)
DEST=/backups/$DIA
mkdir -p "$DEST"
pg_dump -Fc -h HOST -U USUARIO NOME_DO_BANCO > "$DEST/banco.dump"
# apague os mais antigos que 14 dias
find /backups -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +
```

```
0 3 * * * /opt/backup.sh
```

Depois envie a pasta para outro local (outro servidor ou armazenamento de objetos) e **cifre** antes de sair da máquina.

## 6. O teste de restauração

Faça isto de tempos em tempos, em um ambiente separado:

1. Pegue o backup mais recente.
2. Restaure em um banco ou volume novo, nunca por cima do real.
3. Suba a aplicação apontando para essa cópia.
4. Confira: login funciona, os dados recentes estão lá, os arquivos abrem.
5. Anote **quanto tempo** levou. Esse é o seu tempo real de recuperação.

## 7. Checklist

- [ ] Existe backup automático de cada banco e de cada volume importante?
- [ ] Há uma cópia fora do servidor e fora do mesmo provedor?
- [ ] O backup que sai da máquina está cifrado?
- [ ] As senhas e chaves estão guardadas separadas do backup?
- [ ] A restauração foi testada nos últimos 90 dias?
- [ ] Você sabe quanto tempo leva restaurar tudo?
- [ ] Alguém é avisado quando o backup falha?
- [ ] A retenção está definida (quantos dias ou versões guardar)?

## 8. Problemas comuns

| Sintoma | O que verificar |
|---|---|
| `pg_restore` dá erro de usuário inexistente | Restaure antes os usuários, com os globais do `pg_dumpall --globals-only` |
| Backup de SQLite corrompido | Foi feito copiando o arquivo com a aplicação gravando. Use `.backup` |
| Restauração muito lenta | Considere dump em formato diretório com `-j` para paralelizar |
| Disco encheu de backups | Falta a rotina de retenção |
| "Tudo certo" mas dados antigos | O job falhou em silêncio. Monitore a data do último backup |

## 9. Referências oficiais

- PostgreSQL, SQL dump: postgresql.org/docs/current/backup-dump.html
- SQLite, shell de linha de comando: sqlite.org/cli.html
