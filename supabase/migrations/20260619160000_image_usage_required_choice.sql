-- Uso de imagem: resposta obrigatória (Autorizo / Não autorizo), padrão Autorizo na UI

update public.tenant_acceptance_terms
set
  is_required = true,
  content = 'Autorizo o uso de imagens e vídeos da festa para divulgação nas redes sociais do espaço. Você pode escolher autorizar ou não autorizar abaixo.'
where term_key = 'uso_imagem';
