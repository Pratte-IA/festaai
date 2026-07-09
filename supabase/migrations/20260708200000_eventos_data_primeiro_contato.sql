-- Data real do primeiro contato do lead (importação legado / histórico WhatsApp).
-- Distinto de created_at (quando o registro foi criado no FestaAI).

alter table public.eventos
  add column if not exists data_primeiro_contato date;

comment on column public.eventos.data_primeiro_contato is
  'Data em que o lead entrou em contato pela primeira vez (ex.: importação do CRM legado ou primeira mensagem WhatsApp).';
