# Como lançar a próxima aula

A Revista Gamificada fica em **Conhecimento → Revista Gamificada** (`/conhecimento/revista`).
Cada domingo é um arquivo em `content/revista/licoes/`. Para lançar uma aula, você só edita dados, sem mexer em componentes.

## Passo a passo (exemplo: Lição 8)

1. Abra `content/revista/licoes/licao-08.json`. Ele já existe como placeholder.
2. Copie a estrutura de `licao-07.json` ou de `_modelo/licao-modelo.json`.
3. Preencha os campos com o conteúdo da revista Adolescer (Edição do Professor):
   - `titulo`, `textoBiblico`, `textoAureo`, `objetivo` e `verdadeAplicada`
   - `telas` (a primeira é sempre `capa`)
   - Os versículos vão na ARC.
   - No `quiz`, a alternativa correta é sempre a primeira.
4. **Apague a linha `"placeholder": true`.**
5. Ajuste `liberarEm` para quando os alunos podem estudar antes. Use o formato `2026-11-16T08:00:00-03:00`.
6. Confira o arquivo:
   ```bash
   npm test -- revista
   ```
   O teste aponta o campo errado, se houver.
7. Publique como de costume (commit e deploy).

## O que acontece depois

- Antes de `liberarEm`, a lição aparece com cadeado e o texto "em breve".
- Depois de `liberarEm`, ela fica "liberada" para estudo prévio.
- No domingo da `data`, ela vira a missão do dia ("hoje").
- Depois do domingo, aparece como "concluída" e continua disponível para revisão.

Para criar uma lição além da 13, crie `licao-14.json` com o mesmo formato. O nome precisa seguir `licao-NN.json`.

## Na sala

- Para projetar, use o botão de tela cheia. Navegue com as setas, a barra de espaço, os botões grandes ou o swipe.
- O placar Sal × Luz e o progresso ficam salvos **no navegador do aparelho que projeta**. Use sempre o mesmo notebook.
- O Modo Professor (tempo, fala e técnica de cada tela) só aparece para líderes.
- Para alunos, o roteiro do professor nunca é enviado.

## Resgate de quem faltou

- Por 7 dias depois do domingo, o aluno vê na trilha o convite "Faltou? Faça o resgate!" e pode estudar a lição em casa.
- No domingo seguinte, abra o **Modo Professor** da aula do dia. Para quem faltou, faça 2 ou 3 perguntas sobre a lição anterior, ao vivo.
- Se ele responder, use **Resgate +10** no time em que ele está jogando hoje. O limite é +30 por time em cada aula, e o "−" desfaz um resgate.
- Vale o mesmo para falta justificada ou não. Não diga à turma quem faltou.
- O resgate não muda a chamada: na EBD o aluno continua ausente ou justificado. Nada sobre o aluno é salvo, só o total do time neste aparelho.

O schema completo está em [`licoes/_modelo/SCHEMA.md`](licoes/_modelo/SCHEMA.md).
