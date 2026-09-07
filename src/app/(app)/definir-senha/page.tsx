import { PasswordForm } from "@/features/auth/password-form";

export default function SetPasswordPage() {
  return (
    <section className="mx-auto max-w-lg">
      <div className="card p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.16em] text-[#176b49]">Conta protegida</p>
        <h1 className="mt-2 text-3xl font-black">Defina sua senha</h1>
        <p className="mt-3 mb-7 leading-7 text-[#647268]">Crie uma senha exclusiva para concluir seu acesso ao SAL DA TERRA. Não compartilhe esta senha.</p>
        <PasswordForm />
      </div>
    </section>
  );
}
