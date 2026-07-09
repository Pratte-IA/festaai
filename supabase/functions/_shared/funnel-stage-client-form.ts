/** Enquanto o contrato aguarda assinatura após envio do formulário público. */
export const resolveFunnelStagePendingContractSignature = () => ({
  boas_vindas_whatsapp_agendado_em: null,
  boas_vindas_whatsapp_enviado_em: null,
  etapa: "negociacao",
  fechamento_confirmado_em: null,
  funil: "vendas",
  motivo_perda: null,
  status_interno: "ativo" as const,
});

/** Após assinatura do contrato: migração de Vendas para Festa / Boas Vindas. */
export const resolveFunnelStageAfterContractAcceptance = (funil: string) => {
  if (funil !== "vendas") return null;

  return {
    etapa: "boas_vindas",
    funil: "festa",
    status_interno: "ativo" as const,
  };
};
