-- Preenche a cláusula da CONTRATADA com placeholders do cadastro do estabelecimento.
update public.tenant_contract_templates
set template_html = replace(
  template_html,
  '<p><strong>CONTRATADA:</strong> Espaço de festas (conforme cadastro do estabelecimento).</p>',
  '<p><strong>CONTRATADA:</strong> {{nome_espaco}}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº {{cnpj_espaco}}, com sede na {{endereco_completo_espaco}}, neste ato representada por {{nome_representante_espaco}}, CPF nº {{cpf_representante_espaco}}, doravante denominada CONTRATADA.</p>'
)
where template_html like '%Espaço de festas (conforme cadastro do estabelecimento)%';
