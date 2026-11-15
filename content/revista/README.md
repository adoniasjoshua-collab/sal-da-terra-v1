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

O schema completo está em [`licoes/_modelo/SCHEMA.md`](licoes/_modelo/SCHEMA.md).
