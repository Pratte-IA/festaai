type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

/** Mensagem já registrada como envio de automação/bot — não reencaminhar ao n8n como intervenção humana. */
export const isKnownAutomationOutboundMessage = async (
  service: ServiceClient,
  input: { messageId: string | null; tenantId: number },
): Promise<boolean> => {
  if (!input.messageId) return false;

  const { data: agentRow } = await service
    .from("agent_conversation_messages")
    .select("id")
    .eq("tenant_id", input.tenantId)
    .eq("message_id", input.messageId)
    .eq("role", "ai")
    .maybeSingle();
  if (agentRow) return true;

  const { data: dispatchRow } = await service
    .from("automation_dispatch_logs")
    .select("id")
    .eq("tenant_id", input.tenantId)
    .eq("message_id", input.messageId)
    .in("direction", ["outbound_whatsapp", "outbound_from_n8n"])
    .maybeSingle();
  if (dispatchRow) return true;

  return false;
};
