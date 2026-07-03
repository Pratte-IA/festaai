-- Remove perguntas extras do seed anterior e normaliza ordem do modelo padrão.
delete from public.tenant_satisfaction_survey_questions
where question_key in ('experiencia_aberta', 'festa_perfeita', 'uso_depoimento_redes');

update public.tenant_satisfaction_survey_questions
set
  sort_order = case question_key
    when 'nps_indicacao' then 1
    when 'experiencia_geral' then 2
    when 'atendimento_pre_festa' then 3
    when 'organizacao_equipe' then 4
    when 'conforme_combinado' then 5
    when 'melhorias' then 6
    when 'crianca_aproveitou' then 7
    when 'contrataria_novamente' then 8
    when 'depoimento_aberto' then 9
    else sort_order
  end,
  label = case question_key
    when 'depoimento_aberto' then 'Deixe aqui um depoimento sobre sua experiência na {{nome_empresa}}'
    else label
  end,
  required = case question_key
    when 'nps_indicacao' then true
    when 'experiencia_geral' then true
    when 'contrataria_novamente' then true
    when 'melhorias' then false
    when 'depoimento_aberto' then false
    else required
  end
where question_key in (
  'nps_indicacao',
  'experiencia_geral',
  'atendimento_pre_festa',
  'organizacao_equipe',
  'conforme_combinado',
  'melhorias',
  'crianca_aproveitou',
  'contrataria_novamente',
  'depoimento_aberto'
);
