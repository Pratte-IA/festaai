-- Repara coluna de rastreio da pesquisa, normaliza telefones migrados e vincula pacote da Caroline Hames (#699).

alter table public.eventos
  add column if not exists satisfaction_survey_whatsapp_enviado_em timestamptz;

comment on column public.eventos.satisfaction_survey_whatsapp_enviado_em is
  'Quando o link da pesquisa de satisfação foi disparado pelo WhatsApp via automação.';

update public.eventos
set cliente_telefone = public.normalize_brazil_phone_storage(cliente_telefone)
where tenant_id = 2
  and funil = 'festa'
  and etapa = 'planejamento'
  and status_interno = 'ativo'
  and cliente_telefone is not null
  and public.normalize_brazil_phone_storage(cliente_telefone) is not null
  and cliente_telefone is distinct from public.normalize_brazil_phone_storage(cliente_telefone);

update public.eventos
set
  pacote_id = pkg.id,
  pacote_nome = pkg.name,
  pacote_convidados_inclusos = pkg.included_guests,
  updated_at = now()
from public.tenant_packages pkg
where eventos.id = 699
  and eventos.tenant_id = 2
  and pkg.id = 7
  and pkg.tenant_id = 2
  and eventos.pacote_id is null;
