-- Aceites em duas fases: formulário (consentimentos leves) e assinatura do contrato (aceite legal)

alter table public.tenant_acceptance_terms
  add column if not exists show_in_form boolean not null default true,
  add column if not exists show_at_signing boolean not null default false;

-- Aceite legal: só na assinatura do contrato
update public.tenant_acceptance_terms
set
  show_in_form = false,
  show_at_signing = true,
  active = true,
  appears_in_contract = true,
  title = 'Li e aceito este contrato',
  content = 'Declaro que li integralmente o contrato acima, compreendi todas as cláusulas, valores, condições de pagamento, políticas de cancelamento e remarcação, e concordo com os termos estabelecidos.'
where term_key = 'termos_contratacao';

-- Consentimentos do formulário
update public.tenant_acceptance_terms
set
  show_in_form = true,
  show_at_signing = false,
  active = true,
  appears_in_contract = true
where term_key in ('informacoes_verdadeiras', 'uso_imagem');

-- Redundantes com o corpo do contrato — inativar
update public.tenant_acceptance_terms
set
  active = false,
  show_in_form = false,
  show_at_signing = false
where term_key in (
  'politica_cancelamento',
  'politica_remarcacao',
  'regras_espaco',
  'horarios_contratados',
  'itens_inclusos'
);

-- Aceites personalizados existentes: permanecem no formulário
update public.tenant_acceptance_terms
set
  show_in_form = true,
  show_at_signing = false
where term_key is null;

create or replace function public.seed_tenant_acceptance_terms()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tenant_acceptance_terms (
    tenant_id, term_key, title, content, is_required, appears_in_contract,
    is_system, active, sort_order, show_in_form, show_at_signing
  )
  values
    (
      new.id,
      'termos_contratacao',
      'Li e aceito este contrato',
      'Declaro que li integralmente o contrato acima, compreendi todas as cláusulas, valores, condições de pagamento, políticas de cancelamento e remarcação, e concordo com os termos estabelecidos.',
      true,
      true,
      true,
      true,
      1,
      false,
      true
    ),
    (
      new.id,
      'informacoes_verdadeiras',
      'Declaro que as informações preenchidas são verdadeiras',
      'Confirmo que todas as informações fornecidas neste formulário são verdadeiras e completas.',
      true,
      true,
      true,
      true,
      2,
      true,
      false
    ),
    (
      new.id,
      'uso_imagem',
      'Autorizo o uso de imagem para redes sociais',
      'Autorizo o uso de imagens e vídeos da festa para divulgação nas redes sociais do espaço. Você pode escolher autorizar ou não autorizar abaixo.',
      true,
      true,
      true,
      true,
      3,
      true,
      false
    )
  on conflict (tenant_id, term_key) do nothing;

  return new;
end;
$$;
