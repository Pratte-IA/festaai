-- Texto de uso de imagem: autorização do aniversariante e família (não do ambiente da festa)

update public.tenant_acceptance_terms
set
  title = 'Uso de imagem nas redes sociais',
  content = 'Autorizo o uso de imagens e vídeos do aniversariante e da família para divulgação nas redes sociais do espaço. A divulgação do ambiente, decoração e itens da festa não depende desta autorização.'
where term_key = 'uso_imagem';

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
      'Uso de imagem nas redes sociais',
      'Autorizo o uso de imagens e vídeos do aniversariante e da família para divulgação nas redes sociais do espaço. A divulgação do ambiente, decoração e itens da festa não depende desta autorização.',
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
