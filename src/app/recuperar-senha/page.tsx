import Link from "next/link";
import { RecoveryForm } from "@/features/auth/recovery-form";

export default function RecoverPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-sm font-black tracking-[.2em] text-[#176b49]">SAL DA TERRA</Link>
        <section className="card p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#176b49]">Acesso seguro</p>
          <h1 className="mt-2 text-3xl font-black">Recuperar senha</h1>
          <p className="mt-3 mb-7 text-sm leading-6 text-[#647268]">Solicite o link no aparelho e navegador em que você pretende concluir a recuperação.</p>
          <RecoveryForm />
          <Link href="/login" className="mt-6 block text-center text-sm font-bold text-[#176b49] hover:underline">Voltar para entrar</Link>
        </section>
      </div>
    </main>
  );
}
