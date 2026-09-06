import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/login-form";
export const metadata: Metadata = { title: "Entrar" };
export default function LoginPage() { return <main className="grid min-h-screen place-items-center px-5 py-10"><div className="w-full max-w-md"><Link href="/" className="mb-8 block text-center text-sm font-black tracking-[.2em] text-[#176b49]">SAL DA TERRA</Link><section className="card p-6 sm:p-8"><h1 className="text-3xl font-black">Bem-vindo</h1><p className="mt-2 mb-7 text-[#647268]">Entre com sua conta autorizada.</p><LoginForm /></section><p className="mt-5 text-center text-xs leading-5 text-[#647268]">O acesso é restrito. Em caso de dificuldade, procure a administração do ministério.</p></div></main>; }
