export function Icon({ children }: { children: string }) {
  return <span aria-hidden="true" className="text-2xl">{children}</span>;
}

export function GuideSection({ id, icon, title, children }: { id: string; icon: string; title: string; children: React.ReactNode }) {
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

export function Example({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#cfe3d7] bg-[#f0f8f3] p-4">
      <p className="mb-1 text-xs font-black uppercase tracking-[.12em] text-[#176b49]">Exemplo</p>
      {children}
    </div>
  );
}

/** A simple, scrollable table for the help guides. */
export function GuideTable({ caption, head, rows }: { caption: string; head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#dfe6df]">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-[#f5f7f3] text-xs font-black uppercase tracking-[.08em] text-[#526158]">
          <tr>{head.map((cell) => <th key={cell} scope="col" className="px-3 py-2">{cell}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[#e7ece8]">
          {rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th key={j} scope="row" className="px-3 py-2 align-top font-bold text-[#17231d]">{cell}</th> : <td key={j} className="px-3 py-2 align-top">{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 text-base font-black text-[#17231d] sm:text-lg">{children}</h3>;
}
