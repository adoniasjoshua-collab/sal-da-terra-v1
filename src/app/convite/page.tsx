import type { Metadata } from "next";
import Link from "next/link";
import { acceptInvite } from "@/features/auth/invite-actions";
import { InviteSubmitButton } from "@/features/auth/invite-submit-button";
import { getCurrentRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Confirmar acesso", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ token_hash?: string; type?: string; erro?: string }> };

// Opening this page has no side effects: link previews (WhatsApp, e-mail scanners)
// must not consume the one-time token. Verification happens only on "Continuar".
export default async function InvitePage({ searchParams }: Props) {
  const { token_hash: tokenHash, type, erro } = await searchParams;
  const role = await getCurrentRole();
  const staffSession = role === "admin" || role === "leader" || erro === "sessao-equipe";
  const valid = Boolean(tokenHash && (type === "invite" || type === "recovery"));
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-sm font-black tracking-[.2em] text-[#176b49]">SAL DA TERRA</Link>
        <section className="card p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#176b49]">{type === "recovery" ? "Nova senha" : "Convite de acesso"}</p>
          <h1 className="mt-2 text-3xl font-black">{type === "recovery" ? "Vamos criar uma nova senha" : "Bem-vindo ao Sal da Terra"}</h1>
          {staffSession ? <div role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-bold">Você está na sessão da liderança.</p><p className="mt-2">Para testar como aluno, abra o link original do convite em uma janela anônima ou em outro navegador. Sua sessão de administrador será preservada e o convite ainda poderá ser usado.</p><Link className="button-secondary mt-4" href="/administracao#aluno-teste">Voltar aos alunos de teste</Link></div> : valid ? (
            <form action={acceptInvite} className="mt-6 space-y-5">
              <input type="hidden" name="token_hash" value={tokenHash} />
              <input type="hidden" name="type" value={type} />
              <p className="leading-7 text-[#647268]">Toque em continuar para confirmar seu acesso e criar sua senha. Este link é pessoal: não compartilhe.</p>
              <InviteSubmitButton />
            </form>
          ) : (
            <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">Este link está incompleto. Peça um novo link à liderança.</p>
          )}
        </section>
      </div>
    </main>
  );
}
