import Link from "next/link";
import { PasswordForm } from "@/features/auth/password-form";

export default function SetPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-8 block text-center text-sm font-black tracking-[.2em] text-[#176b49]">SAL DA TERRA</Link>
        <section className="card p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#176b49]">Conta protegida</p>
          <h1 className="mt-2 text-3xl font-black">Defina sua senha</h1>
          <p className="mt-3 mb-7 leading-7 text-[#647268]">Crie uma senha exclusiva para concluir seu acesso. Aguarde a validação segura do convite antes de continuar.</p>
          <PasswordForm />
        </section>
      </div>
    </main>
  );
}
