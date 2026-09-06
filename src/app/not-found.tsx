import Link from "next/link";
export default function NotFound(){return <section className="card p-10 text-center"><h1 className="text-2xl font-black">Registro não encontrado</h1><p className="mt-2 text-[#647268]">Ele pode não existir ou estar fora do seu escopo autorizado.</p><Link className="button-secondary mt-5" href="/dashboard">Voltar ao painel</Link></section>}
