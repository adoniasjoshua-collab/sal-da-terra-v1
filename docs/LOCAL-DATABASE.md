# Banco local descartável para validação

## Por que usar uma cópia isolada

O histórico contém duas operações pontuais de transição para uso oficial:
`20260906220000_prepare_official_tenant.sql` e
`20260906221000_finalize_official_tenant.sql`. Elas dependem de identidades e
dados daquele ambiente e excluem atividade de demonstração. Um reset completo
do histórico não é um bootstrap genérico confiável.

Não editar nem reaplicar essas operações para preparar testes. O comando abaixo
copia todas as demais migrações, o seed fictício e todas as suites SQL para uma
pasta nova em `.local-db/`, ignorada pelo Git. Inclui automaticamente novas
migrações e gera manifesto das inclusões e das duas exclusões exatas.
Há uma adaptação explícita na cópia de
`20260906150000_fix_scoped_relationship_triggers.sql`: três funções de escopo
já presentes na migração inicial usam `CREATE OR REPLACE FUNCTION` no replay.
O manifesto lista essa adaptação; testes verificam que nenhuma outra instrução
foi alterada. Os arquivos originais de migração permanecem intactos.
Não copia `.temp`, `.env`, vínculo remoto ou contas reais. Não executa banco,
rede, exclusões de arquivos ou reset. Configuração local usa portas 55320–55322.

## Preparação e execução

Requisitos: dependências npm instaladas, Supabase CLI e Docker funcionando.

```powershell
npm.cmd run db:prepare
```

O comando imprime três comandos com o caminho da pasta gerada. Execute-os
na raiz do repositório, na ordem indicada:

```text
supabase --workdir ".local-db/run-<identificador>" start
supabase --workdir ".local-db/run-<identificador>" test db --local
supabase --workdir ".local-db/run-<identificador>" stop
```

Substitua o identificador pelo caminho impresso, não use o exemplo literalmente.
No primeiro start do projeto novo, a CLI aplica migrações e seed. Só considere
o banco validado se o start e todas as suites pgTAP terminarem com sucesso.
Pare esse projeto antes de iniciar outra cópia, pois compartilham as portas.
Depois de mudar migrations, seed ou testes, gere uma nova cópia e valide-a;
uma cópia anterior não recebe atualizações automaticamente.

Este fluxo não precisa de `db reset`, `--linked`, `db push` nem `--db-url`.
Não execute comandos remotos para contornar indisponibilidade do Docker.
Para usar a aplicação com esse banco, configure separadamente a URL local e a
chave pública local; nunca copie chaves privilegiadas para o frontend.

## Limite da evidência

Esta reprodução valida o schema e as regras com fixtures fictícias. Não prova
que o banco de produção está sincronizado nem testa as operações históricas
excluídas. Implantação exige comparar o histórico aplicado e revisar apenas as
novas migrações destinadas àquele ambiente.

Em 27/09/2026 o Docker estava indisponível neste ambiente. A preparação pode ser
verificada sem Docker, mas execução de pgTAP permanece pendente até o serviço
estar acessível. Não declarar RLS aprovada com base apenas no build.

## PostgreSQL embarcado para o Hub

`npm test` também executa `tests/learning-database.test.ts` usando PGlite somente
como dependência de desenvolvimento. O teste aplica o schema real e o seed
fictício em memória, com as mesmas exclusões/adaptação do preparador local.
Somente as tabelas básicas de Auth e `auth.uid()` são simuladas para representar
identidades autenticadas; RLS, triggers e funções de negócio são reais.

Isso permite verificar SQL, autorização, elegibilidade do mundo e idempotência
sem Docker. Não substitui pgTAP no Supabase, PostgREST, autenticação HTTP nem
testes de concorrência entre conexões: PGlite usa uma conexão serializada.
