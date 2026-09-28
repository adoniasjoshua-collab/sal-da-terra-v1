# Mundo 1 — implementação e operação

Estado técnico: fluxo implementado no repositório; sem publicação automática,
aplicação de migrações remotas ou homologação pastoral presumida.

## Entrega

- `/conhecimento` e `/trilhas`: catálogo autenticado, mantendo a URL existente.
- `/trilhas/fundamentos`: mapa com disponibilidade real; mundos 2–7 e desafio
  final explicitamente em preparação.
- `/trilhas/fundamentos/voce-faz-parte`: prévia completa para equipe; estudo para
  adolescente inscrito em publicação ativa.
- `/meu-progresso`: progresso privado, situação da prática e conquista.
- `/conhecimento/gestao`: responsáveis editoriais, aprovação/publicação,
  inscrições, acompanhamento, equivalências e histórico de validações.

Quatro leituras originais, exercício contextual e quatro questões com feedback.
Referências bíblicas sem reprodução de tradução integral. Ilustração SVG original,
slots versionados de mídia; nenhum vídeo é necessário para concluir.

## Sequência de liberação

1. Validar as duas novas migrações `20260927120000_learning_foundation.sql` e
   `20260927121000_learning_world_one_content.sql` no ambiente descartável.
2. Após revisão e autorização de implantação, aplicar somente as migrações novas
   ao ambiente correto. Não executar o seed de demonstração em produção.
3. Em Conhecimento → Gestão, o administrador designa autor/editor e revisor
   adulto autorizado, com vínculos ativos diferentes.
4. O autor lê a prévia integral e envia para revisão. O revisor verifica conteúdo,
   gabaritos, prática e regras e aprova ou devolve com justificativa editorial.
   Se o revisor ficar indisponível antes da publicação, o administrador pode
   retornar a versão "Em revisão" ou "Aprovada" para rascunho, com motivo
   auditado; a aprovação anterior é descartada e os responsáveis são redefinidos.
5. O administrador confirma autorização do piloto e publica. A confirmação e o
   ator ficam auditados. Publicar no painel não equivale a implantar código.
6. O administrador autoriza inscrições, confirmando ciência/autorização conforme
   política de proteção. Contas de adolescentes devem estar vinculadas ao cadastro
   e a um membership ativo. Não há cadastro público nem convite automático.
7. A liderança valida a prática solicitada ou combina uma alternativa educacional.
   Registrar apenas justificativa mínima, sem nomes de terceiros ou nota pastoral.

Se não houver dois adultos autorizados disponíveis, o conteúdo permanece em
rascunho; não inventar um revisor ou reutilizar a identidade do autor.

## Regras implementadas

A versão 1 exige leituras, exercício correto, quiz com pelo menos 70% sem
arredondamento (3 de 4 nesta versão), resumo explícito e prática aprovada. XP:
20 + 30 + 40 + 50 + 80 = 220, creditados uma vez por inscrição/evento.
O banco corrige respostas e verifica pré-requisitos; frontend não envia nota
confiável. Tentativa posterior insuficiente não remove uma aprovação já obtida.
Máximo de 12 novas tentativas de quiz por minuto; a mesma solicitação repetida
retorna seu resultado anterior e não cria nova tentativa/crédito.

Conclusão persiste `completed_at`; essa evidência e o rótulo da versão concedem
“Comecei Minha Jornada”. Não há certificado por mundo, cálculo de certificado da
temporada ou alteração de frequência EBD/Radar Pastoral neste incremento.

Inscrição vincula-se à publicação/versionamento. A API inicial atende mundo 1,
versão 1; novos mundos/versões exigem extensão explícita, mantendo matrículas
anteriores. Editar o JSON após aplicar a migração não muda o banco: criar uma nova
versão/migração e fluxo de aprovação, nunca alterar um snapshot já publicado.
Os testes verificam igualdade entre o JSON fonte e o snapshot SQL inicial.

## Rascunhos e privacidade

Escolhas do quiz têm salvamento automático no servidor após breve pausa e botão
manual. O navegador mantém uma cópia local por usuário, inscrição e versão, com
validade de recuperação de sete dias e botão explícito de retomada. A interface
só confirma salvamento remoto após resposta do servidor. Ao enviar com sucesso,
remove a cópia local. Esse mecanismo guarda apenas índices de alternativas,
nunca orações, relatos íntimos ou respostas livres. Navegadores que bloqueiam
armazenamento local ainda podem salvar online.

O prazo controla a recuperação, não garante limpeza física automática em um
navegador que não volte ao app. Dispositivos compartilhados exigem encerramento
de sessão e política local de uso. A retenção no servidor segue a política que a
liderança ainda deve homologar; não há rotina automática de expurgo neste marco.

## Verificação e limites

Testes de PostgreSQL embarcado aplicam migrações e seed fictício, simulando apenas
o contrato de Auth; verificam autorização, versões publicadas, titularidade,
pré-requisitos, notas forjadas, repetição, equivalência, histórico e revogação.
Também há suite pgTAP para Supabase local. Docker indisponível impede executar
essa integração aqui. Validação autenticada no navegador, leitor de tela, mobile,
queda de sessão e concorrência entre conexões continuam como checklist do piloto.
Não usar esses limites para declarar publicação ou segurança em produção aprovadas.

Nenhuma variável de ambiente nova; permanecem URL e chave pública do Supabase.
PGlite é exclusivamente dependência de testes, não integra o runtime web.
