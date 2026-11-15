# Schema de uma lição da Revista Gamificada

A fonte da verdade é `src/services/revista.ts` (Zod). Um arquivo inválido não
derruba a trilha: ele é ignorado e o erro vai para o log do servidor.
O teste `tests/revista.test.ts` valida todos os arquivos de `content/revista/licoes/`.

## Campos da lição

| Campo | Obrigatório | Descrição |
|---|---|---|
| `numero` | sim | Número da lição na revista (7, 8…). Também define a URL: `/conhecimento/revista/8`. |
| `titulo` | sim | Título da revista. Em placeholders, use `"Em breve"`. |
| `data` | sim | Domingo da aula, `AAAA-MM-DD`. Nesse dia o status é `hoje`. |
| `liberarEm` | sim | Data e hora com fuso (`2026-11-16T08:00:00-03:00`). A partir dela a lição fica `liberada` para estudo prévio. |
| `placeholder` | não | `true` = sem conteúdo; fica sempre bloqueada. Apague ao preencher. |
| `textoBiblico` | não | Referências do texto bíblico (aparece na capa). |
| `textoAureo` | sim* | `{ referencia, texto }` em ARC. |
| `objetivo` | não | Objetivo da lição. |
| `verdadeAplicada` | sim* | Mostrada no encerramento. |
| `telas` | sim* | Lista de telas, na ordem. A primeira deve ser `capa`. |

\* obrigatório quando não é placeholder.

## Status (calculado, nunca escrito no arquivo)

- `bloqueada`: placeholder, ou antes de `liberarEm`.
- `liberada`: depois de `liberarEm` e antes do domingo.
- `hoje`: no domingo (`data`, fuso de São Paulo).
- `concluida`: depois do domingo.

## Campos comuns a toda tela

- `tipo`: `capa`, `gancho`, `memoria`, `pergaminho`, `fase`, `comparacao`, `raio-x`, `power-ups`, `arena`, `quiz`, `missao` ou `encerramento`.
- `cenario` (opcional): `noite`, `tesouro`, `templo`, `aurora` ou `arena`. Sem ele, a tela herda o cenário da anterior.
- `professor` (opcional): `{ tempo, fala, tecnica }`. Aparece só no Modo Professor e nunca é enviado aos alunos.

## Campos por tipo

- `capa`: usa os dados da lição; não tem campos próprios.
- `gancho`: `pergunta`, `revelacao`.
- `memoria`: `titulo`, `objetos[] { emoji, nome, resposta }`, `perguntas[] { pergunta, resposta }`, `fechamento?`.
- `pergaminho`: `titulo?`, `leituras[] { leitor?, versiculos[] { referencia, texto } }`, `selo?`, `reflexao?`.
- `fase`: `numero?`, `titulo`, `gancho?`, `versiculo?`, `barras?[] { rotulo, descricao }`, `blocos[] { titulo, texto }`, `destaque?`, `humor?`.
- `comparacao`: `titulo?`, `esquerda { rotulo, texto }`, `direita { rotulo, texto }`.
- `raio-x`: `titulo`, `referencia?`, `areas[] { rotulo, descricao }`. Nada é salvo.
- `power-ups`: `titulo`, `itens[] { titulo, texto, referencia? }`, `espelho?`.
- `arena`: `titulo`, `perguntas[]` (texto).
- `quiz`: `titulo`, `perguntas[] { enunciado, opcoes[], pontos? (padrão 10), bonus? }`. **A alternativa correta é sempre a primeira**; a tela embaralha.
- `missao`: `titulo`, `tarefas[]`, `recompensa`.
- `encerramento`: `oracao`, `teaser`.

## Regras de conteúdo

- Nunca invente conteúdo da revista. Sem o material, mantenha `placeholder: true`.
- Versículos na ARC.
- Pontuação e recompensas sempre por time (Sal 🧂 / Luz 💡), nunca individuais.
