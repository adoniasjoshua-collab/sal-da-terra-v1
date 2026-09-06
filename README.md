# SAL DA TERRA V1

Plataforma segura de gestão, presença EBD e acompanhamento pastoral de adolescentes.

## Executar

1. Copie `.env.example` para `.env.local` e preencha URL e publishable key do Supabase.
2. Execute `supabase start`, depois `supabase db reset` para migration e seed locais.
3. Execute `npm install` e `npm run dev`.

Somente no banco local gerado pelo seed: `lider.demo@saldaterra.invalid`, `admin.demo@saldaterra.invalid` e `aluno.demo@saldaterra.invalid` usam a senha fictícia `SalDaTerra-DEMO-2026!`. Nunca replique essas credenciais em produção.

Validação: `npm run check`. A aplicação usa dados fictícios no seed; nunca adicione dados reais de menores ao repositório.

Consulte [AGENTS.md](./AGENTS.md) e `docs/` para arquitetura, segurança e operação.
