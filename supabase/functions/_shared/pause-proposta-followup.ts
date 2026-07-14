import { phonesMatch } from "./phone.ts";

type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

export interface PausePropostaFollowupInput {
  customerPhone: string;
  respondedAt: string;
  tenantId: number;
}

export interface PausePropostaFollowupResult {
  eventoId: number | null;
  paused: boolean;
  responseUpdated: boolean;
}

export const pausePropostaFollowupOnCustomerReply = async (
  admin: ServiceClient,
  input: PausePropostaFollowupInput,
): Promise<PausePropostaFollowupResult> => {
  // Considera leads ainda ativos (para pausar) e também os já pausados por
  // resposta (para atualizar a data caso o cliente responda de novo, agora após
  // o follow-up ter sido enviado).
  const { data: candidates, error: listError } = await admin
    .from("eventos")
    .select("id, cliente_telefone, proposta_enviada_em, followup_status, followup_resposta_cliente_em")
    .eq("tenant_id", input.tenantId)
    .eq("funil", "vendas")
    .eq("etapa", "proposta_enviada")
    .in("followup_status", ["ativo", "pausado_resposta"])
    .not("proposta_enviada_em", "is", null)
    .order("proposta_enviada_em", { ascending: false });

  if (listError) throw listError;

  const match = (candidates ?? []).find((evento) =>
    phonesMatch(
      typeof evento.cliente_telefone === "string" ? evento.cliente_telefone : null,
      input.customerPhone,
    ),
  );

  if (!match) {
    return { eventoId: null, paused: false, responseUpdated: false };
  }

  // Lead já pausado por uma resposta anterior: apenas avança a data da última
  // resposta. Assim, um retorno posterior ao follow-up passa a ser reconhecido
  // como "respondeu ao follow-up". Não recria nota nem altera o status.
  if (match.followup_status === "pausado_resposta") {
    const respostaAtualMs =
      typeof match.followup_resposta_cliente_em === "string"
        ? new Date(match.followup_resposta_cliente_em).getTime()
        : null;
    const novaRespostaMs = new Date(input.respondedAt).getTime();

    // Só avança no tempo — nunca retrocede a data por mensagens fora de ordem.
    if (
      !Number.isFinite(novaRespostaMs) ||
      (respostaAtualMs !== null && Number.isFinite(respostaAtualMs) && novaRespostaMs <= respostaAtualMs)
    ) {
      return { eventoId: match.id as number, paused: false, responseUpdated: false };
    }

    const { error: refreshError } = await admin
      .from("eventos")
      .update({ followup_resposta_cliente_em: input.respondedAt })
      .eq("tenant_id", input.tenantId)
      .eq("id", match.id)
      .eq("followup_status", "pausado_resposta");

    if (refreshError) throw refreshError;

    return { eventoId: match.id as number, paused: false, responseUpdated: true };
  }

  const { error: updateError } = await admin
    .from("eventos")
    .update({
      followup_resposta_cliente_em: input.respondedAt,
      followup_status: "pausado_resposta",
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", match.id)
    .eq("followup_status", "ativo");

  if (updateError) throw updateError;

  const notaTexto =
    `[Automação] Cliente respondeu no WhatsApp — sequência de follow-up pausada.\n` +
    `Resposta registrada em ${new Date(input.respondedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`;

  await admin.from("evento_notas").insert({
    evento_id: match.id,
    tenant_id: input.tenantId,
    texto: notaTexto,
  });

  return { eventoId: match.id as number, paused: true, responseUpdated: true };
};
