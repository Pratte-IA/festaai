-- Formulário público sem contrato assinado: volta para Vendas / Negociação.
update public.eventos e
set
  funil = 'vendas',
  etapa = 'negociacao',
  status_interno = 'ativo',
  fechamento_confirmado_em = null,
  boas_vindas_whatsapp_agendado_em = null,
  boas_vindas_whatsapp_enviado_em = null,
  motivo_perda = null,
  updated_at = now()
where e.funil = 'festa'
  and e.etapa = 'boas_vindas'
  and e.fechamento_confirmado_em is null
  and not exists (
    select 1
    from public.evento_contracts ec
    where ec.evento_id = e.id
      and ec.tenant_id = e.tenant_id
      and ec.status = 'accepted'
  );
