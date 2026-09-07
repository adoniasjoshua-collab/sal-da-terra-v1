import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireAuth, type AppRole } from "@/lib/auth";

const roleContent: Record<AppRole, { label: string; summary: string; startHref: string; startLabel: string }> = {
  student: {
    label: "Adolescente",
    summary: "Você pode consultar somente seu perfil básico, sua participação na EBD e os próximos eventos.",
    startHref: "/minha-participacao",
    startLabel: "Abrir minha participação",
  },
  leader: {
    label: "Líder",
    summary: "Você pode acompanhar o ministério, administrar adolescentes, eventos, chamadas e acompanhamentos do seu ministério.",
    startHref: "/dashboard",
    startLabel: "Abrir visão geral",
  },
  admin: {
    label: "Administrador",
    summary: "Você possui as funções do líder e também administra funções, acessos e a auditoria do seu ministério.",
    startHref: "/administracao",
    startLabel: "Abrir administração",
  },
};

const topics = [
  ["🧭", "Primeiros passos", "#primeiros-passos"],
  ["🔐", "Níveis de acesso", "#acessos"],
  ["👥", "Adolescentes", "#adolescentes"],
  ["📅", "Eventos e EBD", "#eventos"],
  ["✅", "Chamada", "#chamada"],
  ["📊", "Indicadores", "#indicadores"],
  ["🗃️", "Arquivar e desativar", "#protecao"],
  ["✉️", "Convites", "#convites"],
  ["🛡️", "Privacidade", "#privacidade"],
  ["🆘", "Dúvidas comuns", "#duvidas"],
] as const;

function Icon({ children }: { children: string }) {
  return <span aria-hidden="true" className="text-2xl">{children}</span>;
}

function GuideSection({ id, icon, title, children }: { id: string; icon: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-6 p-5 sm:p-7" aria-labelledby={`${id}-title`}>
      <div className="flex items-center gap-3">
        <Icon>{icon}</Icon>
        <h2 id={`${id}-title`} className="text-xl font-black sm:text-2xl">{title}</h2>
      </div>
      <div className="mt-5 space-y-4 text-sm leading-6 text-[#405048] sm:text-base">{children}</div>
    </section>
  );
}

function Example({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#cfe3d7] bg-[#f0f8f3] p-4">
      <p className="mb-1 text-xs font-black uppercase tracking-[.12em] text-[#176b49]">Exemplo</p>
      {children}
    </div>
  );
}

export default async function HelpPage() {
  const actor = await requireAuth();
  const currentRole = roleContent[actor.role];

  return (
    <>
      <PageHeading
        eyebrow="Central de ajuda"
        title="Guia de uso do portal"
        description="Orientações simples para usar o SAL DA TERRA com segurança, clareza e respeito aos adolescentes."
      />

      <section className="card mb-6 border-[#9bc9ad] bg-[#f0f8f3] p-5 sm:p-6" aria-labelledby="your-access-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Icon>👤</Icon>
            <div>
              <h2 id="your-access-title" className="font-black">Seu nível de acesso: {currentRole.label}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[#405048]">{currentRole.summary}</p>
            </div>
          </div>
          <Link href={currentRole.startHref} className="button-primary">{currentRole.startLabel}</Link>
        </div>
      </section>

      <nav className="mb-7" aria-label="Tópicos deste guia">
        <h2 className="mb-3 text-sm font-black uppercase tracking-[.12em] text-[#526158]">Encontre uma orientação</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {topics.map(([icon, label, href]) => (
            <a key={href} href={href} className="card flex min-h-14 items-center gap-2 px-4 py-3 text-sm font-bold hover:border-[#86ad96] hover:text-[#176b49]">
              <span aria-hidden="true">{icon}</span>{label}
            </a>
          ))}
        </div>
      </nav>

      <div className="grid gap-6">
        <GuideSection id="primeiros-passos" icon="🧭" title="Primeiros passos">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Entre com o e-mail e a senha da sua conta autorizada.</li>
            <li>Confira seu nome e seu nível de acesso no alto da tela.</li>
            <li>Use o menu para abrir somente as áreas liberadas para você.</li>
            <li>Ao terminar, selecione <strong>Sair</strong>, principalmente em aparelhos compartilhados.</li>
          </ol>
          <p>Se aparecer “Acesso ainda não configurado”, sua conta existe, mas ainda precisa ser vinculada a um ministério por um administrador.</p>
        </GuideSection>

        <GuideSection id="acessos" icon="🔐" title="Níveis de acesso">
          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-[#dfe6df] p-4"><h3 className="font-black">Adolescente</h3><p className="mt-2">Vê apenas seus próprios dados permitidos, sua frequência e próximos eventos.</p></article>
            <article className="rounded-xl border border-[#dfe6df] p-4"><h3 className="font-black">Líder</h3><p className="mt-2">Trabalha com adolescentes, eventos, presença e acompanhamento somente no próprio ministério.</p></article>
            <article className="rounded-xl border border-[#dfe6df] p-4"><h3 className="font-black">Administrador</h3><p className="mt-2">Possui as funções do líder e também altera funções e ativa ou desativa acessos.</p></article>
          </div>
          <p><strong>Importante:</strong> o administrador possui o maior acesso, mas nem ele apaga definitivamente os históricos pelo portal.</p>
        </GuideSection>

        <GuideSection id="adolescentes" icon="👥" title="Cadastrar e acompanhar adolescentes">
          <p>Para cadastrar, abra <strong>Adolescentes → Novo adolescente</strong>. Preencha somente as informações necessárias e autorizadas.</p>
          <p>Para atualizar, abra o nome do adolescente, localize o formulário de cadastro e selecione <strong>Salvar alterações</strong>.</p>
          <Example>Gabriel passou a usar outro telefone. Abra o perfil, atualize somente o telefone autorizado e salve. O histórico de presença permanece preservado.</Example>
          <p>O perfil reúne frequência EBD, últimas participações, radar operacional e acompanhamentos autorizados. Esses indicadores apoiam o cuidado; não avaliam fé ou espiritualidade.</p>
        </GuideSection>

        <GuideSection id="eventos" icon="📅" title="Criar eventos e escolher a contagem">
          <p>Abra <strong>Eventos e EBD → Novo evento</strong>. Escolha o tipo, a data e a forma de registro mais adequada:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Chamada completa:</strong> registra presente, ausente ou justificado por nome. A EBD sempre usa esta opção.</li>
            <li><strong>Participação identificada:</strong> registra quem participou, sem transformar a não participação em falta.</li>
            <li><strong>Somente quantidade:</strong> guarda apenas o total, sem nomes. É indicado para cultos e eventos grandes.</li>
          </ul>
          <Example>Em um culto com 22 adolescentes, sendo 4 visitantes, registre total 22 e visitantes 4. Não é necessário guardar uma lista de nomes.</Example>
        </GuideSection>

        <GuideSection id="chamada" icon="✅" title="Fazer a chamada da EBD">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Abra <strong>Eventos e EBD</strong> e selecione o domingo.</li>
            <li>Marque cada adolescente como presente, ausente ou justificado.</li>
            <li>Revise a lista e selecione <strong>Salvar chamada</strong>.</li>
          </ol>
          <Example>Se Ana avisou que estava doente, marque “Justificada”. Essa situação é mostrada separadamente e não recebe o mesmo peso pastoral de uma ausência comum.</Example>
          <p>A chamada pode ser corrigida por um líder ou administrador autorizado. O sistema impede dois registros para a mesma pessoa no mesmo evento.</p>
        </GuideSection>

        <GuideSection id="indicadores" icon="📊" title="Entender o painel e os indicadores">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Frequência EBD:</strong> mostra a participação nos encontros considerados.</li>
            <li><strong>Ausências consecutivas:</strong> ajuda a perceber quem pode precisar de contato.</li>
            <li><strong>Radar Pastoral:</strong> organiza a fila de cuidado com uma regra transparente.</li>
            <li><strong>Outros eventos:</strong> mostram volume de participação sem misturar o resultado com a frequência da EBD.</li>
          </ul>
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"><strong>Essencial:</strong> nenhum gráfico representa nível de fé, santidade ou espiritualidade.</p>
        </GuideSection>

        <GuideSection id="protecao" icon="🗃️" title="Por que arquivar ou desativar em vez de excluir?">
          <p>A exclusão definitiva poderia quebrar ou apagar informações importantes. Por isso, o portal preserva o histórico:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Arquivar adolescente:</strong> retira o cadastro da rotina ativa, mas preserva presenças e histórico.</li>
            <li><strong>Reativar adolescente:</strong> devolve o cadastro para a rotina quando ele retorna.</li>
            <li><strong>Desativar acesso:</strong> impede a entrada do usuário sem apagar seus registros.</li>
            <li><strong>Ativar acesso:</strong> permite que a pessoa autorizada volte a entrar.</li>
          </ul>
          <Example>Lucas mudou de cidade. Arquive o cadastro. Se ele retornar meses depois, reative-o; não crie outro cadastro e não perca o histórico anterior.</Example>
        </GuideSection>

        <GuideSection id="convites" icon="✉️" title="Convites e novas contas">
          <p>O cadastro de acesso é controlado. Não existe inscrição pública em que a pessoa escolhe sua própria função.</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>A administração responsável providencia a conta pelo fluxo seguro do Supabase.</li>
            <li>A pessoa recebe o convite no e-mail e define sua senha.</li>
            <li>Um administrador vincula a conta ao ministério e define a função correta.</li>
            <li>Somente com vínculo ativo a pessoa acessa o portal.</li>
          </ol>
          <p><strong>O convite sozinho não libera dados.</strong> A função e o vínculo ativo são proteções adicionais.</p>
        </GuideSection>

        <GuideSection id="privacidade" icon="🛡️" title="Privacidade e cuidado com menores">
          <ul className="list-disc space-y-2 pl-5">
            <li>Não compartilhe sua senha nem deixe a sessão aberta em aparelho compartilhado.</li>
            <li>Registre somente dados necessários, corretos e autorizados.</li>
            <li>Não escreva diagnósticos, documentos pessoais ou detalhes íntimos em observações gerais.</li>
            <li>Informações pastorais não aparecem para adolescentes.</li>
            <li>Usuários acessam somente o ministério e as informações permitidas para sua função.</li>
          </ul>
        </GuideSection>

        <GuideSection id="duvidas" icon="🆘" title="Dúvidas comuns">
          <div className="space-y-4">
            <div><h3 className="font-black">Não consigo ver o painel principal.</h3><p>Confira o nível mostrado no cabeçalho. O perfil Adolescente abre “Minha participação”; o painel de gestão é destinado a Líder e Administrador.</p></div>
            <div><h3 className="font-black">Minha conta entra, mas mostra acesso não configurado.</h3><p>Peça a um administrador para conferir se seu vínculo com o ministério está ativo.</p></div>
            <div><h3 className="font-black">Não encontro um adolescente na lista principal.</h3><p>Confira os filtros “Inativos” e “Arquivados” antes de criar outro cadastro.</p></div>
            <div><h3 className="font-black">Posso apagar uma presença antiga?</h3><p>Não pelo portal. Um líder ou administrador pode corrigir a chamada, preservando a rastreabilidade.</p></div>
            <div><h3 className="font-black">Quem pode alterar acessos?</h3><p>Somente um Administrador. O último administrador ativo é protegido e não pode ser desativado.</p></div>
          </div>
          <div className="pt-2"><Link href="/ajuda" className="font-bold text-[#176b49] hover:underline">Voltar ao início ↑</Link></div>
        </GuideSection>
      </div>
    </>
  );
}
