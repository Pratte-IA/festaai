-- Follow-up automático quando a nota NPS da pesquisa de satisfação é de 0 a 7.

alter table public.eventos
  add column if not exists satisfaction_survey_nps_baixa_enviado_em timestamptz;

comment on column public.eventos.satisfaction_survey_nps_baixa_enviado_em is
  'WhatsApp enviado após resposta da pesquisa com NPS ≤ 7, pedindo detalhes da experiência.';

create index if not exists eventos_satisfaction_survey_nps_baixa_enviado_idx
  on public.eventos (tenant_id, satisfaction_survey_nps_baixa_enviado_em)
  where satisfaction_survey_nps_baixa_enviado_em is not null;
