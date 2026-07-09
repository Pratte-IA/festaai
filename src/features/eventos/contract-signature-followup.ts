export const CONTRACT_SIGNATURE_FOLLOWUP_TEMPLATE_KEY = "follow-up-assinatura-contrato";

export const CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_DELAY_HOURS = 3;

// Antecipa o badge no Kanban ~1h antes do disparo automático em 3h.
export const CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_AGUARDANDO_BADGE_HOURS = 2;

export const CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS = 6;

export const CONTRACT_SIGNATURE_FOLLOWUP_BUSINESS_HOUR_START = 8;

export const CONTRACT_SIGNATURE_FOLLOWUP_BUSINESS_HOUR_END = 18;

export const CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_TEMPLATE =
  "follow-up-assinatura-contrato-inicial";

export const CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_TEMPLATE =
  "follow-up-assinatura-contrato-lembrete";

export const DEFAULT_CONTRACT_SIGNATURE_FOLLOWUP_INICIAL = `Oi, {{primeiro_nome}}! Tudo bem? 😊

Recebemos seu formulário de contratação na {{nome_empresa}} — obrigada pelo carinho em escolher a gente para a festa de {{nome_aniversariante}}! 🎉

Seu contrato já está pronto. Falta só um último passo: a assinatura eletrônica.

É rapidinho e pode ser feito pelo celular:
{{link_formulario}}

Se tiver qualquer dúvida sobre o contrato, pacote ou pagamento, estamos por aqui para te ajudar. 💛✨`;

export const DEFAULT_CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE = `Oi, {{primeiro_nome}}! Passando para lembrar da assinatura do contrato da festa de {{nome_aniversariante}}. 😊

O link continua disponível:
{{link_formulario}}

Qualquer dúvida, estamos por aqui! 💛`;

export const buildPublicContractFormUrl = (tenantSlug: string, eventoId: number) => {
  const base = `${typeof window !== "undefined" ? window.location.origin : "https://festaai.com.br"}/formulario/${tenantSlug}`;
  return `${base}?evento=${eventoId}`;
};

export const CONTRACT_SIGNATURE_FOLLOWUP_PREVIEW = {
  aniversarianteNome: "Helena",
  clienteNome: "Mariana Silva",
  dataEvento: "2026-08-15",
  eventoId: 123,
} as const;

const formatDateBR = (dateIso: string): string => {
  const [year, month, day] = dateIso.split("-");
  if (!year || !month || !day) return dateIso;
  return `${day}/${month}/${year}`;
};

const extractFirstName = (fullName: string): string => {
  const trimmed = fullName.trim();
  if (!trimmed) return "Cliente";
  return trimmed.split(/\s+/)[0] ?? trimmed;
};

export const buildContractSignatureFollowupInicialPreviewMessage = (input: {
  aniversarianteNome: string;
  clienteNome: string;
  companyLegalName: string;
  dataEvento: string;
  linkFormulario: string;
  templateBody?: string;
}): string => {
  const template = input.templateBody?.trim() || DEFAULT_CONTRACT_SIGNATURE_FOLLOWUP_INICIAL;

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_aniversariante}}", input.aniversarianteNome)
    .replaceAll("{{data_festa}}", formatDateBR(input.dataEvento))
    .replaceAll("{{nome_empresa}}", input.companyLegalName)
    .replaceAll("{{link_formulario}}", input.linkFormulario);
};

export const buildContractSignatureFollowupLembretePreviewMessage = (input: {
  aniversarianteNome: string;
  clienteNome: string;
  companyLegalName: string;
  dataEvento: string;
  linkFormulario: string;
  templateBody?: string;
}): string => {
  const template = input.templateBody?.trim() || DEFAULT_CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE;

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_aniversariante}}", input.aniversarianteNome)
    .replaceAll("{{data_festa}}", formatDateBR(input.dataEvento))
    .replaceAll("{{nome_empresa}}", input.companyLegalName)
    .replaceAll("{{link_formulario}}", input.linkFormulario);
};

export interface EventoContractSignatureFollowupSummary {
  assinatura_followup_inicial_enviado_em: string | null;
  assinatura_followup_lembrete_count: number;
  assinatura_followup_ultimo_enviado_em: string | null;
  generated_at: string;
}

export const getContractSignatureFollowupKanbanBadge = (evento: {
  contract_signature_followup?: EventoContractSignatureFollowupSummary | null;
  etapa: string;
}): { className: string; label: string } | null => {
  if (evento.etapa !== "negociacao") return null;

  const followup = evento.contract_signature_followup;
  if (!followup) return null;

  const now = Date.now();

  if (followup.assinatura_followup_inicial_enviado_em) {
    const lastSent =
      followup.assinatura_followup_ultimo_enviado_em ??
      followup.assinatura_followup_inicial_enviado_em;
    const hoursSinceLast = (now - new Date(lastSent).getTime()) / (1000 * 60 * 60);

    if (hoursSinceLast >= CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS) {
      return { className: "bg-muted text-muted-foreground", label: "Aguard. Ass. FU" };
    }

    return { className: "bg-success/15 text-success", label: "Ass. FU ✓" };
  }

  const hoursSinceGenerated =
    (now - new Date(followup.generated_at).getTime()) / (1000 * 60 * 60);

  if (hoursSinceGenerated >= CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_AGUARDANDO_BADGE_HOURS) {
    return { className: "bg-muted text-muted-foreground", label: "Aguard. Ass. FU" };
  }

  return null;
};
