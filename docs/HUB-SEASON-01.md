# Temporada 01 — Fundamentos Sal da Terra

Estado em 27/09/2026: contrato técnico proposto para implementação; conteúdo e
critérios ainda sujeitos à homologação da liderança. Não autoriza publicação.

## Escopo e precedência

A nova entrega é a revisão retroativa do primeiro semestre: sete mundos e um
desafio final. Substitui o piloto de três aulas como prioridade de implementação.
`HUB-MODULE-01.md` permanece como histórico e fonte editorial para o mundo 4;
sua aprovação funcional anterior não aprova automaticamente esta temporada.
Os 12 encontros e o calendário de seis meses citados no Prompt Master ainda
precisam ser conferidos no manual-fonte. Não afirmar que todos foram ministrados.

Para esta temporada, este contrato prevalece sobre propostas antigas de XP,
certificação por módulo e divulgação pública de nome minimizado. Permanecem
válidos isolamento ministerial, governança editorial e proteção de menores.
O público editorial inicial é 12–14 anos; a faixa cadastral ministerial 11–15
permanece independente. A liderança autoriza inscrições e equivalências.

## Conteúdo e navegação

| Ordem | Slug proposto | Mundo |
|---|---|---|
| 1 | voce-faz-parte | Você faz parte! |
| 2 | a-melhor-noticia | A melhor notícia |
| 3 | identidade-em-cristo | Quem sou eu em Cristo? |
| 4 | decifrando-a-palavra | Decifrando a Palavra |
| 5 | conversa-com-deus | Conversa com Deus |
| 6 | vida-no-espirito | O Espírito Santo e a vida cristã |
| 7 | amizades-sabias | Quem caminha comigo? |

Preservar `/conhecimento` como entrada do catálogo. Acrescentar `/trilhas`,
`/trilhas/fundamentos`, páginas por mundo, `/meu-progresso` e
`/meus-certificados`. Mostrar sequência recomendada sem bloqueio artificial de
mundos publicados aos inscritos. Diagnóstico opcional não concede presença,
conclusão ou XP. Mundo não publicado permanece indisponível.

Cada mundo terá 3–5 cartões integralmente redigidos, referências bíblicas,
cenário, exercício, quiz de 3–5 questões justificadas, prática segura e resumo.
O desafio final terá 10–14 questões. Conteúdo versionado fora dos componentes;
gabaritos e correção no servidor. Vídeo é opcional, com alternativa textual.
Mídia inclui licença, crédito e texto alternativo; referências e explicação
original substituem transcrição bíblica sem licença confirmada.

## Proposta de conclusão e XP

Para homologação: concluir leituras explicitamente, exercício e resumo;
quiz com pelo menos 70% (acertos / questões >= 0,7, sem arredondar para aprovar),
feedback e novas tentativas ilimitadas. Desafio final usa o mesmo limiar.
Tentativas insuficientes geram orientação de revisão, nunca punição.

| Evento elegível | XP | Limite por inscrição |
|---|---:|---|
| Todas as leituras do mundo confirmadas | 20 | Uma vez por mundo |
| Exercício bíblico concluído | 30 | Uma vez por mundo |
| Quiz do mundo aprovado | 40 | Uma vez por mundo |
| Resumo/revisão explicitamente concluído após etapas educacionais | 50 | Uma vez por mundo |
| Prática ou equivalente educacional validado por adulto | 80 | Uma vez por mundo |
| Desafio final aprovado | 100 | Uma vez por temporada |

Máximo previsto: `7 × (20 + 30 + 40 + 50 + 80) + 100 = 1640 XP`.
Leitura pontua pelo conjunto do mundo, não por cartão. Repetição, reconexão e
atualização editorial não criam créditos adicionais. Usar chave única por
inscrição + evento + objeto estável; gravar evidência e crédito atomicamente.
Correções são eventos auditados de ajuste, nunca edição silenciosa do livro-razão.
XP não concede certificado e não interfere no Radar Pastoral.

Práticas devocionais privadas são opcionais, não são enviadas nem comprovadas.
No mundo 5, usar atividade educacional equivalente, como ordenar ideias do texto.
Reflexões privadas não ficam no servidor, logs ou rascunhos locais automáticos.
Salvar apenas respostas educacionais necessárias, isoladas por usuário e versão.
Uma ação offline pendente só aparece como salva após confirmação do servidor.

## Conquistas e certificado

Proposta: uma conquista por mundo concluído, com os nomes da tabela do Prompt
Master; `Fundamentos Sal da Terra` pela conclusão da temporada. `Somos Um` e
`Fé em Ação` ficam reservadas até terem critérios próprios aprovados; não criar
regras implícitas. Conquistas são privadas, idempotentes e não indicam fé.

Certificado único da trilha: sete mundos, quizzes, desafio final, práticas
obrigatórias ou equivalentes validados. Nenhuma exigência de presença histórica.
Conversa de encerramento só é obrigatória se incorporada à regra homologada,
com alternativa acessível. Critérios são versionados e vinculados à inscrição;
alterações não invalidam silenciosamente progresso ou certificados anteriores.

Elegibilidade e emissão transacionais no servidor/banco. Preservar snapshot de
conteúdo, regra, dados autorizados e carga horária homologada. Carga horária
permanece indefinida até planejamento aprovado; não herdar as duas horas do
piloto antigo. QR contém apenas token aleatório. Consulta pública retorna
validade, título, emissor e data, sem nome do menor. PDF privado, emissão
reabrível, revogação e substituição auditadas. Reutilizar cadastro de signatários
somente após autorização específica para certificados.

## Integração e autorização

Reutilizar `students`, `profiles`, `ministries` e `ministry_members`. Novas
entidades educacionais referenciam ministério e aluno; não duplicar cadastros.
Adicionar inscrição, conteúdo/versionamento, conclusões, tentativas, revisões,
livro-razão, conquistas e certificados conforme cada etapa exigir.

RLS e RPCs devem validar vínculo ativo, titularidade, inscrição, publicação,
versão e escopo ministerial. Adolescente não grava nota, XP, aprovação adulta
ou elegibilidade diretamente. Revisões e equivalências exigem adulto autorizado
e justificativa mínima; conteúdo pastoral não entra em evidências educacionais.
Separar permissões de autor, revisor e publicador sem tornar todo líder revisor;
autor não aprova o próprio conteúdo. Preservar `draft → in_review → approved →
published → archived` e auditar transições. Consultas públicas precisam de limite
de requisições e não concedem leitura geral das tabelas de certificados.

## Etapas e evidências de aceite

1. Contrato e ambiente local: consolidar divergências e executar suites SQL
   em banco descartável com dados fictícios; ver `LOCAL-DATABASE.md`.
2. Fundação e mundo 1: fluxo completo com inscrição, publicação, leitura, quiz,
   retomada, validação adulta e XP. Testar outro aluno, outro ministério, vínculo
   revogado, conteúdo não publicado e solicitações concorrentes/repetidas.
3. Temporada completa: sete mundos, desafio final, equivalências, conquistas e
   painel restrito; revisão bíblica, editorial, acessibilidade e mobile.
4. Certificação: testar emissão forjada, reabertura, revogação, QR inválido e
   ausência de informações privadas na consulta pública.
5. Piloto fechado: publicar versões aprovadas para inscrições autorizadas;
   confirmar política de proteção, responsáveis, retenção e operação antes de
   cadastro real. Publicação em produção exige autorização correspondente.

Primeiro mundo é um marco de integração, não substitui a entrega dos sete.
Lint, tipos, testes, build e revisão de segurança acompanham cada incremento.
Testes unitários não substituem testes SQL/RLS nem validação no navegador.
