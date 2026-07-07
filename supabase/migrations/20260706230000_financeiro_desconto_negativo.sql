-- Permite descontos em entradas com valor negativo.

alter table public.financeiro_lancamentos
  drop constraint if exists financeiro_lancamentos_valor_check;

alter table public.financeiro_lancamentos
  add constraint financeiro_lancamentos_valor_check check (
    (tipo = 'saida' and valor > 0)
    or (tipo = 'entrada' and valor <> 0)
  );
