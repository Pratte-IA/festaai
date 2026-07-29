import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const PREVIEW_MAX = 160;

const buildPreview = (text: string | null | undefined, messageType: string | null | undefined) => {
  const trimmed = text?.trim();
  if (trimmed) {
    return trimmed.length > PREVIEW_MAX ? `${trimmed.slice(0, PREVIEW_MAX - 1)}…` : trimmed;
  }

  switch (messageType) {
    case "image":
      return "[Imagem]";
    case "audio":
      return "[Áudio]";
    case "video":
      return "[Vídeo]";
    case "document":
      return "[Documento]";
    case "sticker":
      return "[Figurinha]";
    default:
      return "[Mensagem]";
  }
};

export const upsertPlatformWhatsappConversation = async (
  service: SupabaseClient,
  input: {
    connectionId: number;
    customerName: string | null;
    customerPhone: string;
    messageText: string | null;
    messageType: string | null;
    messageTimestamp: string | null;
  },
) => {
  const lastMessageAt = input.messageTimestamp ?? new Date().toISOString();
  const lastMessagePreview = buildPreview(input.messageText, input.messageType);

  const { data: existing, error: existingError } = await service
    .from("platform_whatsapp_conversations")
    .select("id, customer_name")
    .eq("connection_id", input.connectionId)
    .eq("customer_phone", input.customerPhone)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const updates: Record<string, unknown> = {
      last_message_at: lastMessageAt,
      last_message_preview: lastMessagePreview,
    };

    if (input.customerName && !existing.customer_name) {
      updates.customer_name = input.customerName;
    }

    const { error: updateError } = await service
      .from("platform_whatsapp_conversations")
      .update(updates)
      .eq("id", existing.id);

    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await service.from("platform_whatsapp_conversations").insert({
    connection_id: input.connectionId,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    last_message_at: lastMessageAt,
    last_message_preview: lastMessagePreview,
    stage: "contato_inicial",
  });

  if (insertError) throw insertError;
};
