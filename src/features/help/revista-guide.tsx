import Link from "next/link";
import { RESGATE } from "@/services/revista";
import { Example, GuideSection, GuideTable, SubTitle } from "./guide-parts";

// In-app guide for the Revista Gamificada. Numbers come from the domain rules
// (RESGATE) so the guide never drifts from what the player actually does.

const { pontos, limitePorTime, janelaDias } = RESGATE;

export const revistaTopicsLider = [
  ["🎮", "Revista: conduzir a aula", "#revista"],
  ["🛟", "Revista: resgate", "#resgate"],
] as const;

export const revistaTopicsAluno = [["🎮", "Revista e resgate", "#revista"]] as const;

export function RevistaGuiaLider() {
  return <>
    <GuideSection id="revista" icon="🎮" title="Revista Gamificada: conduzir a aula">
      <p>Cada lição da EBD de adolescentes vira uma missão para projetar na sala, jogada por dois times: <strong>Sal 🧂</strong> e <strong>Luz 💡</strong> (Mt 5.13-14). Ela fica em <strong>Conhecimento → Revista Gamificada</strong>. Pontos são sempre do time, nunca de um aluno.</p>
      <p><Link href="/conhecimento/revista" className="font-bold text-[#176b49] hover:underline">Abrir a Revista Gamificada →</Link></p>

      <SubTitle>Situação de cada lição</SubTitle>
      <GuideTable caption="Situação das lições na trilha" head={["Situação", "Quando", "O aluno pode"]} rows={[
        ["Bloqueada 🔒", "Antes da liberação, ou lição ainda sem conteúdo", "Nada; aparece como “em breve”"],
        ["Liberada", "Da segunda-feira de liberação (8h) até sábado", "Estudar antes da aula"],
        ["Hoje", "No domingo da aula", "É a missão do dia"],
        ["Concluída", "Depois do domingo", `Revisar e, nos ${janelaDias} dias seguintes, fazer o resgate se faltou`],
      ]} />

      <SubTitle>Antes do domingo</SubTitle>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Abra a lição e percorra as telas com o <strong>Modo Professor</strong> aberto: cada tela traz tempo sugerido, fala e técnica.</li>
        <li>Escolha os leitores dos textos bíblicos (Leitor 1, 2, 3…) e quem vai marcar os pontos.</li>
        <li>Separe o que a lição pede fora da tela: papel e caneta para o Raio-X e objetos do jogo da memória, quando houver.</li>
        <li>Avise a turma: “A missão de domingo já está liberada no portal.” Estudar antes não é obrigatório.</li>
      </ol>
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"><strong>Use sempre o mesmo notebook para projetar.</strong> O placar e a tela em que a aula parou ficam salvos só no navegador desse aparelho.</p>

      <SubTitle>Na sala, passo a passo</SubTitle>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Na trilha, toque em <strong>Entrar na aula</strong> e ative a tela cheia (⛶).</li>
        <li>Forme os times Sal e Luz na chegada.</li>
        <li>Avance com a seta →, a barra de espaço, os botões grandes ou deslizando o dedo. Para voltar, use ← ou Shift + espaço.</li>
        <li>Marque pontos no placar do topo: <strong>+</strong> e <strong>−</strong> somam ou tiram 10. No quiz, os acertos entram sozinhos.</li>
        <li>Termine no encerramento: oração e o “teaser” da próxima missão.</li>
      </ol>
      <p>Se a aula for interrompida, abra a lição de novo no mesmo notebook: ela volta na tela em que parou, com o placar salvo.</p>

      <SubTitle>Modo Professor 🎓</SubTitle>
      <p>Painel ao lado da tela, visto só por líderes. Os alunos nunca recebem esse roteiro, nem no próprio celular.</p>
      <ul className="list-disc space-y-2 pl-5">
        <li><strong>Tempo, fala e técnica</strong> da tela atual.</li>
        <li><strong>Roteiro completo:</strong> toque em uma tela para pular direto para ela.</li>
        <li><strong>Resgate</strong> de quem faltou na aula anterior (veja a seção Resgate).</li>
        <li><strong>Zerar placar e progresso desta aula</strong>, com confirmação.</li>
      </ul>
      <p>Não projete o Modo Professor: ele é o seu roteiro.</p>

      <SubTitle>Times e placar</SubTitle>
      <GuideTable caption="Como os pontos entram" head={["Como", "Pontos", "Quem lança"]} rows={[
        ["Acerto no quiz", "+10 por pergunta (bônus: +20)", "Automático, para o time da vez"],
        ["Erro no quiz", "0", "—"],
        ["Atividades da aula (memória, arena, leitura)", "+10 a cada toque", "Professor, no placar do topo"],
        ["Resgate de quem faltou", `+${pontos} por aluno, até +${limitePorTime} por time`, "Professor, no Modo Professor"],
      ]} />
      <p>No quiz a vez alterna: 1ª pergunta do Sal, 2ª da Luz, 3ª do Sal… Cada pergunta pontua uma vez só; <strong>Refazer o quiz</strong> tira os pontos dele e recomeça. O placar nunca fica negativo. O <strong>Placar do trimestre</strong>, na página da trilha, soma as aulas daquele notebook.</p>
      <Example>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Jogo da memória: Sal acerta dois objetos, Luz um. O professor toca +10 duas vezes no Sal e uma na Luz → Sal 20 × Luz 10.</li>
          <li>Quiz de 5 perguntas, a última bônus: Sal acerta a 1ª e a 5ª (+10 e +20); Luz acerta a 2ª e a 4ª (+20) → Sal 50 × Luz 30.</li>
          <li>Resgate: um aluno que faltou na semana passada joga pela Luz e responde bem → +{pontos} na Luz. Final: Sal 50 × Luz {30 + pontos}.</li>
        </ol>
      </Example>

      <SubTitle>Tipos de tela</SubTitle>
      <GuideTable caption="Tipos de tela e como conduzir" head={["Tela", "Como conduzir"]} rows={[
        ["Capa", "Forme os times enquanto ela está na tela."],
        ["Gancho", "Peça mãos levantadas antes de revelar a resposta."],
        ["Jogo da memória", "Um item por vez; os times respondem antes da revelação."],
        ["Leitura bíblica", "Chame os leitores e peça leitura em voz alta, devagar (ARC)."],
        ["Fase", "O ensino principal: uma ideia por vez, feche com o destaque."],
        ["Comparação", "Dois lados com contraste ou humor; deixe rir e puxe a pergunta."],
        ["Raio-X", "Autoavaliação no papel. Nada é salvo e as folhas não são recolhidas."],
        ["Power-ups", "Libere um por vez; termine com a pergunta-espelho, sem pedir resposta em voz alta."],
        ["Arena", "Uma pergunta por vez; ninguém é obrigado a responder."],
        ["Quiz", "A vez alterna entre Sal e Luz; os pontos entram sozinhos."],
        ["Missão", "Tarefa da semana; a recompensa é do time, não de quem cumpriu."],
        ["Encerramento", "Oração e teaser da próxima missão."],
      ]} />

      <SubTitle>Chamada e indicadores</SubTitle>
      <p>A Revista não faz chamada. A chamada continua no evento de EBD do domingo; a página da EBD mostra a lição do dia com um atalho para a aula. No <strong>painel</strong>, o bloco da Revista liga cada lição à EBD do mesmo domingo:</p>
      <GuideTable caption="Situação da lição no painel" head={["No painel", "Significa", "O que fazer"]} rows={[
        ["EBD registrada", "A chamada do domingo foi concluída", "Nada"],
        ["Registrar chamada hoje", "É o domingo da lição e a chamada ainda não foi concluída", "Registrar ao fim da aula"],
        ["Sem EBD registrada", "O domingo passou sem chamada concluída", "Registrar o quanto antes"],
        ["Prevista", "A lição ainda não aconteceu", "Preparar a aula"],
      ]} />
      <p>O placar dos times não aparece no painel, porque fica só no notebook do projetor.</p>

      <SubTitle>Cuidados</SubTitle>
      <ul className="list-disc space-y-2 pl-5">
        <li><strong>Nunca exponha quem faltou nem quem errou.</strong> Anuncie só totais de time.</li>
        <li><strong>Ponto não é nota espiritual.</strong> Nenhum time é “mais crente” por ter mais pontos.</li>
        <li><strong>Equilibre os times.</strong> Se um time ganha sempre, misture na chegada seguinte.</li>
        <li><strong>O conteúdo é licenciado.</strong> Não fotografe as telas para grupos ou redes sociais; quem quiser rever entra no portal.</li>
      </ul>
    </GuideSection>

    <GuideSection id="resgate" icon="🛟" title="Revista: resgate de quem faltou">
      <p>Quem faltou pode estudar a lição em casa e, no domingo seguinte, ganhar <strong>+{pontos}</strong> para o time em que estiver jogando, se responder ao vivo às perguntas do professor.</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Vale para falta justificada ou não. O motivo não é investigado.</li>
        <li>Nos {janelaDias} dias depois do domingo, o aluno vê na trilha o convite “Faltou na Lição X? Faça o resgate!”.</li>
        <li>A prova é oral e presencial: 2 ou 3 perguntas sobre a lição.</li>
        <li>Limite de <strong>+{limitePorTime} por time</strong> em cada aula: a aula presencial sempre vale mais.</li>
        <li><strong>A chamada não muda:</strong> o aluno continua ausente ou justificado naquela EBD.</li>
        <li>Nada sobre o aluno é salvo; só o total de cada time no notebook do projetor.</li>
      </ul>
      <p><strong>Como lançar:</strong> abra o Modo Professor na aula do dia. O bloco “Resgate da Lição X” mostra o andamento de cada time (ex.: “Sal: 10/{limitePorTime}”). Toque <strong>+{pontos}</strong> para dar o resgate e <strong>−</strong> para desfazer.</p>
      <Example>
        <p>Ana faltou na Lição 7. Na semana, viu o convite e estudou no celular. No domingo seguinte, o professor a chama à parte, sem anunciar à turma, e pergunta: “Qual era o texto áureo?”, “Em quais áreas Jesus crescia?”. Ela responde bem e hoje joga pela Luz: o professor toca +{pontos} na Luz. Na abertura, anuncia só: “A Luz começa com +{pontos} de resgate!”</p>
      </Example>
      <p>Se o aluno não souber responder, agradeça o esforço e convide a revisar, sem punição. Para quem não tem celular ou internet, entregue a lição impressa: a validação é a mesma.</p>

      <SubTitle>Dúvidas comuns da Revista</SubTitle>
      <div className="space-y-4">
        <div><h4 className="font-black">O placar sumiu ou voltou a zero.</h4><p>A aula foi aberta em outro aparelho, outro navegador ou numa janela anônima. Volte ao notebook de sempre.</p></div>
        <div><h4 className="font-black">A lição continua “em breve” na segunda-feira.</h4><p>O conteúdo ainda não foi lançado. Avise quem prepara as lições.</p></div>
        <div><h4 className="font-black">O aluno não consegue abrir a Revista.</h4><p>Ele precisa de inscrição ativa na trilha de aprendizado. Peça ao administrador.</p></div>
        <div><h4 className="font-black">A tela cheia não funciona.</h4><p>Alguns navegadores, como o Safari do iPhone, bloqueiam a tela cheia. A aula já ocupa a tela toda; use um notebook no projetor.</p></div>
        <div><h4 className="font-black">O botão +{pontos} do resgate travou.</h4><p>O time chegou ao limite de +{limitePorTime} nesta aula. É o esperado.</p></div>
        <div><h4 className="font-black">Dei pontos ao time errado.</h4><p>Use − no time errado e + no certo.</p></div>
      </div>
    </GuideSection>
  </>;
}

export function RevistaGuiaAluno() {
  return (
    <GuideSection id="revista" icon="🎮" title="Revista Gamificada e resgate">
      <p>Em <strong>Conhecimento → Revista Gamificada</strong> você encontra as missões das aulas da EBD. Na sala, a turma joga em dois times: Sal 🧂 e Luz 💡.</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>A lição abre na segunda-feira antes da aula, para você estudar se quiser.</li>
        <li>Depois do domingo, ela continua aberta para revisar.</li>
        <li><strong>Faltou?</strong> Nos {janelaDias} dias depois da aula, estude a lição e, no domingo seguinte, conte ao professor o que aprendeu. Se responder às perguntas dele, você leva +{pontos} para o seu time.</li>
      </ul>
      <p>Seus pontos são sempre do time. Ninguém fica sabendo quem faltou.</p>
      <p><Link href="/conhecimento/revista" className="font-bold text-[#176b49] hover:underline">Abrir a Revista Gamificada →</Link></p>
    </GuideSection>
  );
}
