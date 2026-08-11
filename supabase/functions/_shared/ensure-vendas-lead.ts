import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { isTrivialInboundReengagementMessage } from "./inbound-reengagement-message.ts";
import { buildPhoneLookupVariants } from "./phone-lookup.ts";
import { normalizeBrazilPhoneForStorage, phonesMatch } from "./phone.ts";

export interface EnsureVendasLeadInboundMessage {
  text: string | null;
  type: string;
}

export interface EnsureVendasLeadInput {
  customerName: string | null;
  customerPhone: string;
  inboundMessage?: EnsureVendasLeadInboundMessage;
  tenantId: number;
}

export interface EnsureVendasLeadResult {
  created: boolean;
  eventoId: number | null;
  reactivated?: boolean;
  reactivationStage?: "contato_inicial" | "negociacao";
  skippedReason?:
    | "existing_vendas_lead"
    | "existing_festa_lead"
    | "invalid_phone"
    | "trivial_reengagement";
}

const isFu4PerdidoLead = (evento: {
  etapa: string;
  followup_4_enviado_em?: string | null;
}): boolean =>
  evento.etapa === "perdido" && typeof evento.followup_4_enviado_em === "string";

const isFu0bPerdidoLead = (evento: {
  etapa: string;
  followup_0b_enviado_em?: string | null;
  followup_4_enviado_em?: string | null;
}): boolean =>
  evento.etapa === "perdido" &&
  typeof evento.followup_0b_enviado_em === "string" &&
  typeof evento.followup_4_enviado_em !== "string";

export const ensureVendasLeadFromWhatsapp = async (
  service: SupabaseClient,
  input: EnsureVendasLeadInput,
): Promise<EnsureVendasLeadResult> => {
  const storedPhone = normalizeBrazilPhoneForStorage(input.customerPhone);
  if (!storedPhone) {
    return { created: false, eventoId: null, skippedReason: "invalid_phone" };
  }

  const { data: vendasEventos, error: queryError } = await service
    .from("eventos")
    .select(
      "id, cliente_telefone, etapa, status_interno, followup_0b_enviado_em, followup_4_enviado_em, followup_status",
    )
    .eq("tenant_id", input.tenantId)
    .eq("funil", "vendas")
    .neq("status_interno", "cancelado")
    .order("updated_at", { ascending: false });

  if (queryError) throw queryError;

  const existingLead = (vendasEventos ?? []).find((evento) =>
    phonesMatch(evento.cliente_telefone, storedPhone),
  );

  if (existingLead) {
    if (existingLead.etapa === "perdido") {
      if (isFu4PerdidoLead(existingLead)) {
        const inbound = input.inboundMessage ?? { text: null, type: "unknown" };

        if (isTrivialInboundReengagementMessage(inbound)) {
          return {
            created: false,
            eventoId: existingLead.id,
            skippedReason: "trivial_reengagement",
          };
        }

        const reactivatedAt = new Date().toISOString();
        const { error: updateError } = await service
          .from("eventos")
          .update({
            etapa: "negociacao",
            motivo_perda: null,
            status_interno: "ativo",
          })
          .eq("id", existingLead.id);

        if (updateError) throw updateError;

        const reactivatedBR = new Date(reactivatedAt).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        await service.from("evento_notas").insert({
          evento_id: existingLead.id,
          tenant_id: input.tenantId,
          texto:
            `[Automação] Cliente retomou contato após follow-up de proposta (FU4) — ${reactivatedBR}\n` +
            "Lead movido para Negociação para retomada do atendimento.",
        });

        return {
          created: false,
          eventoId: existingLead.id,
          reactivated: true,
          reactivationStage: "negociacao",
        };
      }

      if (isFu0bPerdidoLead(existingLead)) {
        const inbound = input.inboundMessage ?? { text: null, type: "unknown" };

        if (isTrivialInboundReengagementMessage(inbound)) {
          return {
            created: false,
            eventoId: existingLead.id,
            skippedReason: "trivial_reengagement",
          };
        }

        const reactivatedAt = new Date().toISOString();
        const { error: updateError } = await service
          .from("eventos")
          .update({
            etapa: "contato_inicial",
            followup_status: null,
            motivo_perda: null,
            status_interno: "novo",
          })
          .eq("id", existingLead.id);

        if (updateError) throw updateError;

        const reactivatedBR = new Date(reactivatedAt).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        await service.from("evento_notas").insert({
          evento_id: existingLead.id,
          tenant_id: input.tenantId,
          texto:
            `[Automação] Cliente retomou contato após follow-up de contato inicial (FU0b) — ${reactivatedBR}\n` +
            "Lead movido de volta para Contato Inicial.",
        });

        return {
          created: false,
          eventoId: existingLead.id,
          reactivated: true,
          reactivationStage: "contato_inicial",
        };
      }

      const { error: updateError } = await service
        .from("eventos")
        .update({
          etapa: "contato_inicial",
          motivo_perda: null,
          status_interno: "novo",
        })
        .eq("id", existingLead.id);

      if (updateError) throw updateError;

      return {
        created: false,
        eventoId: existingLead.id,
        reactivated: true,
        reactivationStage: "contato_inicial",
      };
    }

    return {
      created: false,
      eventoId: existingLead.id,
      skippedReason: "existing_vendas_lead",
    };
  }

  const phoneVariants = buildPhoneLookupVariants(storedPhone);
  if (phoneVariants.length > 0) {
    const { data: festaEventos, error: festaQueryError } = await service
      .from("eventos")
      .select("id, cliente_telefone")
      .eq("tenant_id", input.tenantId)
      .eq("funil", "festa")
      .in("cliente_telefone", phoneVariants);

    if (festaQueryError) throw festaQueryError;

    const existingFestaLead = (festaEventos ?? []).find((evento) =>
      phonesMatch(evento.cliente_telefone, storedPhone),
    );

    if (existingFestaLead) {
      return {
        created: false,
        eventoId: existingFestaLead.id,
        skippedReason: "existing_festa_lead",
      };
    }
  }

  const clienteNome = input.customerName?.trim() || "Lead WhatsApp";

  const { data: created, error: insertError } = await service
    .from("eventos")
    .insert({
      cliente_nome: clienteNome,
      cliente_telefone: storedPhone,
      etapa: "contato_inicial",
      funil: "vendas",
      origem: "whatsapp",
      status_interno: "novo",
      tenant_id: input.tenantId,
      tipo_evento: "festa",
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  return {
    created: true,
    eventoId: created.id,
  };
};
