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
  pausedEventoIds: number[];
  vendasEventoId: number | null;
  vendasLeadAction: "created" | "reused" | "reactivated" | null;
}

const selectSourceFields =
  "id, aniversariante_data_nascimento, aniversariante_idade, aniversariante_nome, aniversariante_personagem, aniversariante_tema, cliente_bairro, cliente_cep, cliente_cidade, cliente_cpf, cliente_email, cliente_estado, cliente_nome, cliente_numero, cliente_rg, cliente_rua, cliente_telefone, etapa, fof1_enviado_em, fof2_enviado_em, fof3_enviado_em, fof_festa_alvo, fof_resposta_cliente_em, fof_status, funil, status_interno";

type OfMatch = Record<string, unknown> & { id: number };

const isActiveFofMatch = (evento: Record<string, unknown>): boolean => {
  const hasFofSent =
    typeof evento.fof1_enviado_em === "string" ||
    typeof evento.fof2_enviado_em === "string" ||
    typeof evento.fof3_enviado_em === "string";

  return hasFofSent && evento.fof_status === "ativo";
};

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

  const matches = (candidates ?? []).filter((evento) => {
    if (!isActiveFofMatch(evento)) return false;

    return phonesMatch(
      typeof evento.cliente_telefone === "string" ? evento.cliente_telefone : null,
      input.customerPhone,
    );
  }) as OfMatch[];

  if (matches.length === 0) {
    return {
      eventoId: null,
      paused: false,
      pausedEventoIds: [],
      vendasEventoId: null,
      vendasLeadAction: null,
    };
  }

  // Preferência: festa alvo / card mais recente como origem dos dados de vendas.
  const primary = matches[0];

  const respostaBR = new Date(input.respondedAt).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const targetPartyDate =
    typeof primary.fof_festa_alvo === "string" ? primary.fof_festa_alvo : null;

  const pausedEventoIds: number[] = [];

  for (const match of matches) {
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
    pausedEventoIds.push(match.id as number);

    await admin.from("evento_notas").insert({
      evento_id: match.id,
      tenant_id: input.tenantId,
      texto:
        `[Automação] Cliente respondeu ao follow-up FOF (oportunidade futura) — ${respostaBR}\n` +
        "Sequência FOF pausada. Lead de vendas será criado ou reaproveitado.",
    });
  }

  const storedPhone = normalizeBrazilPhoneForStorage(
    typeof primary.cliente_telefone === "string" ? primary.cliente_telefone : input.customerPhone,
  );

  if (!storedPhone) {
    return {
      eventoId: primary.id as number,
      paused: true,
      pausedEventoIds,
      vendasEventoId: null,
      vendasLeadAction: null,
    };
  }

  const { data: vendasEventos, error: vendasError } = await admin
    .from("eventos")
    .select("id, cliente_telefone, etapa, status_interno, data_evento")
    .eq("tenant_id", input.tenantId)
    .eq("funil", "vendas")
    .neq("status_interno", "cancelado")
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
          `Origem: evento #${primary.id} (oportunidade futura).` +
          (targetPartyDate ? `\nData alvo sugerida: ${targetPartyDate}.` : ""),
      });

      await admin.from("evento_notas").insert({
        evento_id: primary.id,
        tenant_id: input.tenantId,
        texto: `[Automação] Lead de vendas #${existingVendas.id} reativado em Contato Inicial.`,
      });

      return {
        eventoId: primary.id as number,
        paused: true,
        pausedEventoIds,
        vendasEventoId: existingVendas.id as number,
        vendasLeadAction: "reactivated",
      };
    }

    // Cotação já em andamento: não sobrescreve data_evento nem etapa.
    await admin.from("evento_notas").insert({
      evento_id: existingVendas.id,
      tenant_id: input.tenantId,
      texto:
        `[Automação] Cliente respondeu ao FOF (oportunidade futura) — ${respostaBR}\n` +
        `Lead de vendas reaproveitado sem alterar a cotação. Origem: evento #${primary.id}.`,
    });

    await admin.from("evento_notas").insert({
      evento_id: primary.id,
      tenant_id: input.tenantId,
      texto: `[Automação] Lead de vendas existente #${existingVendas.id} reaproveitado (sem criar card novo; cotação preservada).`,
    });

    return {
      eventoId: primary.id as number,
      paused: true,
      pausedEventoIds,
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
        evento_id: primary.id,
        tenant_id: input.tenantId,
        texto:
          `[Automação] Cliente respondeu ao FOF, mas já existe festa ativa #${existingFesta.id} — ` +
          "nenhum lead novo em Vendas foi criado.",
      });

      return {
        eventoId: primary.id as number,
        paused: true,
        pausedEventoIds,
        vendasEventoId: existingFesta.id as number,
        vendasLeadAction: null,
      };
    }
  }

  const clienteNome =
    typeof primary.cliente_nome === "string" && primary.cliente_nome.trim()
      ? primary.cliente_nome.trim()
      : "Lead WhatsApp";

  const { data: created, error: insertError } = await admin
    .from("eventos")
    .insert({
      aniversariante_data_nascimento: primary.aniversariante_data_nascimento ?? null,
      aniversariante_idade: primary.aniversariante_idade ?? null,
      aniversariante_nome: primary.aniversariante_nome ?? null,
      aniversariante_personagem: primary.aniversariante_personagem ?? null,
      aniversariante_tema: primary.aniversariante_tema ?? null,
      cliente_bairro: primary.cliente_bairro ?? null,
      cliente_cep: primary.cliente_cep ?? null,
      cliente_cidade: primary.cliente_cidade ?? null,
      cliente_cpf: primary.cliente_cpf ?? null,
      cliente_email: primary.cliente_email ?? null,
      cliente_estado: primary.cliente_estado ?? null,
      cliente_nome: clienteNome,
      cliente_numero: primary.cliente_numero ?? null,
      cliente_rg: primary.cliente_rg ?? null,
      cliente_rua: primary.cliente_rua ?? null,
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
      `Origem: evento #${primary.id} (oportunidade futura).` +
      (targetPartyDate ? `\nData alvo sugerida: ${targetPartyDate}.` : ""),
  });

  await admin.from("evento_notas").insert({
    evento_id: primary.id,
    tenant_id: input.tenantId,
    texto: `[Automação] Novo lead de vendas #${created.id} criado em Contato Inicial.`,
  });

  return {
    eventoId: primary.id as number,
    paused: true,
    pausedEventoIds,
    vendasEventoId: created.id as number,
    vendasLeadAction: "created",
  };
};
