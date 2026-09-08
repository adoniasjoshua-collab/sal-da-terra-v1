"use client";

import { useState } from "react";

type Signatory = { full_name: string; role_title: string; phone: string | null; email: string | null };

export function ReportActions({ subject, summary, signatories }: { subject: string; summary: string; signatories: Signatory[] }) {
  const [recipient, setRecipient] = useState("");
  const signatures = signatories.map((item) => [item.full_name, item.role_title, item.phone, item.email].filter(Boolean).join(" · ")).join("\n");

  function prepareEmail() {
    const body = `${summary}\n\n${signatures ? `Responsáveis:\n${signatures}\n\n` : ""}O relatório detalhado pode ser salvo em PDF pelo botão Imprimir / salvar PDF e anexado a este e-mail.\n\nDocumento de uso responsável. Não encaminhe dados de adolescentes a pessoas não autorizadas.`;
    window.location.href = `mailto:${encodeURIComponent(recipient.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return <div className="no-print card mb-6 grid gap-4 p-4 lg:grid-cols-[auto_minmax(240px,1fr)_auto] lg:items-end">
    <button type="button" className="button-primary" onClick={() => window.print()}>Imprimir / salvar PDF</button>
    <div><label className="label" htmlFor="report-recipient">Destinatário do e-mail (opcional)</label><input className="input" id="report-recipient" type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="destinatario@exemplo.com" /></div>
    <button type="button" className="button-secondary" onClick={prepareEmail}>Enviar por e-mail</button>
    <p className="text-xs leading-5 text-[#647268] lg:col-span-3">O envio abre seu aplicativo de e-mail. Salve o documento em PDF e revise destinatário e conteúdo antes de anexar e enviar.</p>
  </div>;
}
