import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export const normalizePhoneDigits = (phone: string | null | undefined): string =>
  (phone ?? "").replace(/\D/g, "");

export const phonesMatch = (left: string | null | undefined, right: string | null | undefined): boolean => {
  const a = normalizePhoneDigits(left);
  const b = normalizePhoneDigits(right);
  if (!a || !b) return false;
  if (a === b) return true;

  const suffixA = a.length > 11 && a.startsWith("55") ? a.slice(2) : a;
  const suffixB = b.length > 11 && b.startsWith("55") ? b.slice(2) : b;
  if (suffixA === suffixB) return true;

  const coreA = suffixA.length >= 10 ? suffixA.slice(-10) : suffixA;
  const coreB = suffixB.length >= 10 ? suffixB.slice(-10) : suffixB;
  return coreA.length >= 10 && coreA === coreB;
};

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
  const phoneDigits = normalizePhoneDigits(input.customerPhone);
  if (phoneDigits.length < 10) {
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
    phonesMatch(evento.cliente_telefone, input.customerPhone),
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
      cliente_telefone: input.customerPhone,
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
