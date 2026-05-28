-- Planos comerciais alinhados à página /contratar (slugs avista, parcelado, fidelidade).
insert into public.subscription_plans
  (slug, name, description, monthly_price, setup_price, setup_installments, loyalty_months, provider, metadata, active)
values
  (
    'avista',
    'À vista',
    'Para quem quer começar com desconto no setup e sem fidelidade.',
    750,
    2200,
    1,
    null,
    'asaas',
    '{"highlight": false}'::jsonb,
    true
  ),
  (
    'parcelado',
    'Parcelado',
    'Para quem prefere diluir o valor da implantação e manter liberdade contratual.',
    750,
    2500,
    6,
    null,
    'asaas',
    '{"highlight": false}'::jsonb,
    true
  ),
  (
    'fidelidade',
    'Fidelidade',
    'Para quem quer a melhor condição comercial e pretende crescer com o FestaAI por pelo menos 12 meses.',
    650,
    2000,
    6,
    12,
    'asaas',
    '{"highlight": true, "badgeLabel": "Melhor condição"}'::jsonb,
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price = excluded.monthly_price,
  setup_price = excluded.setup_price,
  setup_installments = excluded.setup_installments,
  loyalty_months = excluded.loyalty_months,
  provider = excluded.provider,
  metadata = excluded.metadata,
  active = true;

-- Planos legados da fase anterior (Starter/Profissional/Enterprise) deixam de ser ofertados publicamente.
update public.subscription_plans
set active = false
where slug in ('starter', 'profissional', 'enterprise');
