import { buildPhoneLookupVariants } from "./phone-lookup.ts";
import { normalizeBrazilPhoneForStorage, phonesMatch } from "./phone.ts";

type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

export interface PauseOportunidadeFuturaFollowupInput {
  customerPhone: string;
  respondedAt: string;
  tenantId: number;
}

export interface PauseOportunidadeFuturaFollowupResult {
  eventoId: number | null;
  paused: boolean;
  vendasEventoId: number | null;
  vendasLeadAction: "created" | "reused" | "reactivated" | null;
}

const selectSourceFields =
  "id, aniversariante_data_nascimento, aniversariante_idade, aniversariante_nome, aniversariante_personagem, aniversariante_tema, cliente_bairro, cliente_cep, cliente_cidade, cliente_cpf, cliente_email, cliente_estado, cliente_nome, cliente_numero, cliente_rg, cliente_rua, cliente_telefone, etapa, fof1_enviado_em, fof2_enviado_em, fof3_enviado_em, fof_festa_alvo, fof_resposta_cliente_em, fof_status, funil, status_interno";

export const pauseOportunidadeFuturaFollowupOnCustomerReply = async (
  admin: ServiceClient,
  input: PauseOportunidadeFuturaFollowupInput,
): Promise<PauseOportunidadeFuturaFollowupResult> => {
  const { data: candidates, error: listError } = await admin
    .from("eventos")
    .select(selectSourceFields)
    .eq("tenant_id", input.tenantId)
    .eq("funil", "executadas")
    .eq("etapa", "oportunidade_futura")
    .neq("status_interno", "cancelado")
    .order("updated_at", { ascending: false });

  if (listError) throw listError;

  const match = (candidates ?? []).find((evento) => {
    const hasFofSent =
      typeof evento.fof1_enviado_em === "string" ||
      typeof evento.fof2_enviado_em === "string" ||
      typeof evento.fof3_enviado_em === "string";

    if (!hasFofSent) return false;
    if (evento.fof_status !== "ativo") return false;

    return phonesMatch(
      typeof evento.cliente_telefone === "string" ? evento.cliente_telefone : null,
      input.customerPhone,
    );
  });

  if (!match) {
    return { eventoId: null, paused: false, vendasEventoId: null, vendasLeadAction: null };
  }

  if (match.fof_status === "pausado_resposta") {
    return {
      eventoId: match.id as number,
      paused: false,
      vendasEventoId: null,
      vendasLeadAction: null,
    };
  }

  const respostaBR = new Date(input.respondedAt).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const targetPartyDate =
    typeof match.fof_festa_alvo === "string"
      ? match.fof_festa_alvo
      : null;

  const { error: pauseError } = await admin
    .from("eventos")
    .update({
      fof_resposta_cliente_em: input.respondedAt,
      fof_status: "pausado_resposta",
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", match.id)
    .eq("etapa", "oportunidade_futura")
    .eq("fof_status", "ativo");

  if (pauseError) throw pauseError;

  await admin.from("evento_notas").insert({
    evento_id: match.id,
    tenant_id: input.tenantId,
    texto:
      `[Automação] Cliente respondeu ao follow-up FOF (oportunidade futura) — ${respostaBR}\n` +
      "Sequência FOF pausada. Lead de vendas será criado ou reaproveitado.",
  });

  const storedPhone = normalizeBrazilPhoneForStorage(
    typeof match.cliente_telefone === "string" ? match.cliente_telefone : input.customerPhone,
  );

  if (!storedPhone) {
    return {
      eventoId: match.id as number,
      paused: true,
      vendasEventoId: null,
      vendasLeadAction: null,
    };
  }

  const { data: vendasEventos, error: vendasError } = await admin
    .from("eventos")
    .select("id, cliente_telefone, etapa, status_interno")
    .eq("tenant_id", input.tenantId)
    .eq("funil", "vendas")
    .order("updated_at", { ascending: false });

  if (vendasError) throw vendasError;

  const existingVendas = (vendasEventos ?? []).find((evento) =>
    phonesMatch(
      typeof evento.cliente_telefone === "string" ? evento.cliente_telefone : null,
      storedPhone,
    ),
  );

  if (existingVendas) {
    if (existingVendas.etapa === "perdido") {
      const { error: reactivateError } = await admin
        .from("eventos")
        .update({
          data_evento: targetPartyDate,
          etapa: "contato_inicial",
          motivo_perda: null,
          status_interno: "novo",
        })
        .eq("id", existingVendas.id);

      if (reactivateError) throw reactivateError;

      await admin.from("evento_notas").insert({
        evento_id: existingVendas.id,
        tenant_id: input.tenantId,
        texto:
          `[Automação] Lead reativado em Contato Inicial após resposta ao FOF — ${respostaBR}\n` +
          `Origem: evento #${match.id} (oportunidade futura).` +
          (targetPartyDate ? `\nData alvo sugerida: ${targetPartyDate}.` : ""),
      });

      await admin.from("evento_notas").insert({
        evento_id: match.id,
        tenant_id: input.tenantId,
        texto: `[Automação] Lead de vendas #${existingVendas.id} reativado em Contato Inicial.`,
      });

      return {
        eventoId: match.id as number,
        paused: true,
        vendasEventoId: existingVendas.id as number,
        vendasLeadAction: "reactivated",
      };
    }

    const updates: Record<string, unknown> = {};
    if (targetPartyDate) {
      updates.data_evento = targetPartyDate;
    }

    if (Object.keys(updates).length > 0) {
      await admin.from("eventos").update(updates).eq("id", existingVendas.id);
    }

    await admin.from("evento_notas").insert({
      evento_id: existingVendas.id,
      tenant_id: input.tenantId,
      texto:
        `[Automação] Cliente respondeu ao FOF (oportunidade futura) — ${respostaBR}\n` +
        `Lead de vendas reaproveitado. Origem: evento #${match.id}.` +
        (targetPartyDate ? `\nData alvo sugerida: ${targetPartyDate}.` : ""),
    });

    await admin.from("evento_notas").insert({
      evento_id: match.id,
      tenant_id: input.tenantId,
      texto: `[Automação] Lead de vendas existente #${existingVendas.id} reaproveitado (sem criar card novo).`,
    });

    return {
      eventoId: match.id as number,
      paused: true,
      vendasEventoId: existingVendas.id as number,
      vendasLeadAction: "reused",
    };
  }

  const phoneVariants = buildPhoneLookupVariants(storedPhone);
  if (phoneVariants.length > 0) {
    const { data: festaEventos, error: festaError } = await admin
      .from("eventos")
      .select("id, cliente_telefone")
      .eq("tenant_id", input.tenantId)
      .eq("funil", "festa")
      .in("cliente_telefone", phoneVariants);

    if (festaError) throw festaError;

    const existingFesta = (festaEventos ?? []).find((evento) =>
      phonesMatch(
        typeof evento.cliente_telefone === "string" ? evento.cliente_telefone : null,
        storedPhone,
      ),
    );

    if (existingFesta) {
      await admin.from("evento_notas").insert({
        evento_id: match.id,
        tenant_id: input.tenantId,
        texto:
          `[Automação] Cliente respondeu ao FOF, mas já existe festa ativa #${existingFesta.id} — ` +
          "nenhum lead novo em Vendas foi criado.",
      });

      return {
        eventoId: match.id as number,
        paused: true,
        vendasEventoId: existingFesta.id as number,
        vendasLeadAction: null,
      };
    }
  }

  const clienteNome =
    typeof match.cliente_nome === "string" && match.cliente_nome.trim()
      ? match.cliente_nome.trim()
      : "Lead WhatsApp";

  const { data: created, error: insertError } = await admin
    .from("eventos")
    .insert({
      aniversariante_data_nascimento: match.aniversariante_data_nascimento ?? null,
      aniversariante_idade: match.aniversariante_idade ?? null,
      aniversariante_nome: match.aniversariante_nome ?? null,
      aniversariante_personagem: match.aniversariante_personagem ?? null,
      aniversariante_tema: match.aniversariante_tema ?? null,
      cliente_bairro: match.cliente_bairro ?? null,
      cliente_cep: match.cliente_cep ?? null,
      cliente_cidade: match.cliente_cidade ?? null,
      cliente_cpf: match.cliente_cpf ?? null,
      cliente_email: match.cliente_email ?? null,
      cliente_estado: match.cliente_estado ?? null,
      cliente_nome: clienteNome,
      cliente_numero: match.cliente_numero ?? null,
      cliente_rg: match.cliente_rg ?? null,
      cliente_rua: match.cliente_rua ?? null,
      cliente_telefone: storedPhone,
      data_evento: targetPartyDate,
      etapa: "contato_inicial",
      funil: "vendas",
      origem: "oportunidade_futura_fof",
      status_interno: "novo",
      tenant_id: input.tenantId,
      tipo_evento: "festa",
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  await admin.from("evento_notas").insert({
    evento_id: created.id,
    tenant_id: input.tenantId,
    texto:
      `[Automação] Lead criado em Contato Inicial após resposta ao FOF — ${respostaBR}\n` +
      `Origem: evento #${match.id} (oportunidade futura).` +
      (targetPartyDate ? `\nData alvo sugerida: ${targetPartyDate}.` : ""),
  });

  await admin.from("evento_notas").insert({
    evento_id: match.id,
    tenant_id: input.tenantId,
    texto: `[Automação] Novo lead de vendas #${created.id} criado em Contato Inicial.`,
  });

  return {
    eventoId: match.id as number,
    paused: true,
    vendasEventoId: created.id as number,
    vendasLeadAction: "created",
  };
};
