import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import {
  isValidBrazilMobilePhone,
  normalizeBrazilPhoneForStorage,
  phonesMatch,
} from "./phone.ts";

export interface EnsureVendasLeadInput {
  customerName: string | null;
  customerPhone: string;
  tenantId: number;
}

export interface EnsureVendasLeadResult {
  created: boolean;
  eventoId: number | null;
  reactivated?: boolean;
  skippedReason?: "existing_vendas_lead" | "invalid_phone";
}

export const ensureVendasLeadFromWhatsapp = async (
  service: SupabaseClient,
  input: EnsureVendasLeadInput,
): Promise<EnsureVendasLeadResult> => {
  const storedPhone = normalizeBrazilPhoneForStorage(input.customerPhone);
  if (!storedPhone || !isValidBrazilMobilePhone(storedPhone)) {
    return { created: false, eventoId: null, skippedReason: "invalid_phone" };
  }

  const { data: vendasEventos, error: queryError } = await service
    .from("eventos")
    .select("id, cliente_telefone, etapa")
    .eq("tenant_id", input.tenantId)
    .eq("funil", "vendas")
    .order("updated_at", { ascending: false });

  if (queryError) throw queryError;

  const existingLead = (vendasEventos ?? []).find((evento) =>
    phonesMatch(evento.cliente_telefone, storedPhone),
  );

  if (existingLead) {
    if (existingLead.etapa === "perdido") {
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
      };
    }

    return {
      created: false,
      eventoId: existingLead.id,
      skippedReason: "existing_vendas_lead",
    };
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
