# Hub de Conhecimento — métricas

## Indicadores principais

| Indicador | Definição | Decisão apoiada |
|---|---|---|
| Ativação em 7 dias | inscritos que concluem a primeira aula em até 7 dias ÷ novos inscritos | melhorar acolhimento e primeira experiência |
| Engajamento semanal significativo | inscritos ativos com leitura e ao menos uma atividade concluída na semana ÷ inscritos ativos | identificar necessidade de apoio e ajustar ritmo |
| Conclusão do módulo | alunos que atendem todos os requisitos ÷ alunos que iniciaram | avaliar clareza, extensão e dificuldade do módulo |

## Diagnósticos

- retorno em 7 e 30 dias;
- conclusão por aula;
- ponto de abandono;
- tentativas e dificuldade por questão;
- tempo entre início e conclusão;
- missões aguardando validação;
- alunos sem atividade recente.

## Guardrails

- nenhuma “nota espiritual”;
- nenhum ranking público;
- conclusão rápida demais é investigada, não premiada automaticamente;
- respostas íntimas e dados pastorais não entram em analytics;
- taxa de incidentes de privacidade e proteção deve permanecer zero;
- carga operacional do líder será acompanhada;
- metas só serão fixadas após o piloto produzir uma linha de base.

## Eventos mínimos de dados

`enrollment_started`, `lesson_started`, `reading_acknowledged`, `media_started`, `lesson_completed`, `quiz_submitted`, `mission_submitted`, `mission_reviewed`, `module_completed`, `certificate_issued`.

Os eventos registram identificadores, horário, versão e resultado necessário. Não copiam texto de reflexão pessoal para logs analíticos.

## Evidência de desenho

A gamificação será tratada como apoio pedagógico, pois revisões acadêmicas encontram benefícios potenciais para motivação, autonomia e relacionamento, mas também registram desmotivação e piora de desempenho quando pontos, medalhas e rankings são usados sem cuidado. Por isso, o piloto utiliza progresso privado, novas tentativas e ausência de classificação pública.

- [Meta-análise sobre gamificação e motivação](https://link.springer.com/article/10.1007/s11423-023-10337-7)
- [Mapeamento de efeitos negativos em software educacional](https://www.sciencedirect.com/science/article/pii/S0950584922002518)
