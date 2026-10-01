# Primeiro acesso e teste do Mundo 1

## Administrador

1. Abra **Administração → Acesso de alunos**. Reutilize um aluno de teste listado
   ou crie um cadastro fictício (até três ativos).
2. Abra **Abrir teste, convite e inscrição**. Crie o acesso com um e-mail seu
   diferente da conta administrativa; pode ser um apelido aceito pelo seu
   provedor, como `seunome+aluno@gmail.com`.
3. Se já houver conta vinculada, use **Gerar novo link de convite** ou
   **Gerar link para redefinir senha**. Copie o link mais recente.
4. Na mesma ficha, confira **Mundo 1 — Você faz parte!**. Se a aprovação já
   estiver registrada, mas faltar a publicação, abra a gestão de Conhecimento
   e confirme a publicação. A aprovação independente permanece obrigatória.
5. Com o módulo publicado, marque a confirmação de teste e use
   **Inscrever no primeiro módulo**. Aguarde a confirmação de inscrição ativa.
6. Abra uma janela anônima ou outro navegador, cole o convite, toque em
   **Continuar** e crie a senha. Não reutilize a senha administrativa.
7. Na conta do aluno, abra **Começar ou continuar meus estudos → Explorar a
   trilha → Você faz parte!**. Teste leituras, exercício, quiz e revisão.
8. Peça a validação da prática na conta de teste. Na janela administrativa,
   use **Conhecimento → Gestão** para registrar a simulação educacional.
   Volte à conta de teste e confira o progresso após atualizar a página.

Abrir um convite com uma sessão de liderança não consome o token nem substitui
a sessão. A página orienta a abrir a janela separada. O convite é pessoal,
de uso único; links expirados devem ser gerados novamente.

## Convites reais

Use a ficha do adolescente real, com e-mail autorizado do adolescente ou
responsável. Cada conta de aluno precisa de e-mail próprio no sistema; não
reutilize uma conta administrativa nem a mesma conta para dois cadastros.
Confirme a autorização dos responsáveis conforme a política do ministério,
crie o acesso e autorize a inscrição no primeiro módulo na mesma ficha.
Copie a mensagem ou abra o WhatsApp e envie manualmente ao destinatário certo.

O responsável que usa esse convite acessa a conta vinculada ao adolescente;
o aplicativo não cria um painel familiar separado. O aluno vê apenas sua
participação e seu progresso. Os demais mundos continuam em preparação.

Para entrar pela primeira vez, envie o convite pessoal gerado após informar
o e-mail. Depois de criar a senha, use o endereço fixo do portal seguido de
`/login`. Não use um único convite para várias famílias.

## Verificação técnica

`npm run check` executa lint, tipos, testes e build. O teste integrado de banco
em `tests/student-access-database.test.ts` cria um aluno fictício, vincula uma
identidade Auth simulada, publica com revisão independente, inscreve o aluno e
percorre o primeiro mundo até a validação adulta. Isso não substitui a aceitação
de um convite real no Supabase nem a conferência da implantação pública.

Esta revisão de fluxo não exige nova migração. A implantação precisa das
migrações de aprendizagem e acesso já existentes e da configuração Auth no
servidor. Não execute o seed fictício no ambiente de produção.

## Liberação para a turma e acompanhamento

1. Convide a revisora em **Administração → Convidar líder ou revisor**.
2. Em **Conhecimento → Gestão**: defina autor e revisora, envie para revisão,
   a revisora aprova e o administrador publica.
3. Crie o acesso de cada aluno na ficha (link pessoal pelo WhatsApp).
4. Em **Gestão → Acompanhamento dos alunos**, use **Inscrever todos no Mundo 1**
   para inscrever de uma vez os alunos que já têm conta (testes ficam de fora).
5. Acompanhe pelo filtro **Precisa de atenção**: práticas a validar aparecem
   primeiro. O painel inicial também avisa quando há práticas aguardando.

