-- Índice amplo por tenant + competência (complementa o parcial WHERE evento_id IS NULL).
create index if not exists financeiro_lancamentos_tenant_competencia_all_idx
  on public.financeiro_lancamentos (tenant_id, data_competencia);
