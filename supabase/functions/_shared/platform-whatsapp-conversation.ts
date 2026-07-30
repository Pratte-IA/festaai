import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { fetchEvolutionProfilePictureUrl } from "./evolution-client.ts";

const PREVIEW_MAX = 160;
const AVATAR_REFRESH_MS = 1000 * 60 * 60 * 24; // 24h

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

const isDuplicateKeyError = (error: { code?: string; message?: string } | null) =>
  error?.code === "23505" || Boolean(error?.message?.includes("platform_whatsapp_messages_evolution_id_unique"));

const shouldRefreshAvatar = (avatarUrl: string | null | undefined, avatarFetchedAt: string | null | undefined) => {
  if (!avatarUrl) return true;
  if (!avatarFetchedAt) return true;
  const fetchedAt = Date.parse(avatarFetchedAt);
  if (Number.isNaN(fetchedAt)) return true;
  return Date.now() - fetchedAt > AVATAR_REFRESH_MS;
};

export const refreshPlatformConversationAvatar = async (
  service: SupabaseClient,
  input: {
    conversationId: number;
    connectionId: number;
    customerPhone: string;
    force?: boolean;
  },
) => {
  const { data: conversation } = await service
    .from("platform_whatsapp_conversations")
    .select("id, avatar_url, avatar_fetched_at")
    .eq("id", input.conversationId)
    .maybeSingle();

  if (!conversation) return null;

  if (
    !input.force &&
    !shouldRefreshAvatar(conversation.avatar_url, conversation.avatar_fetched_at)
  ) {
    return conversation.avatar_url as string | null;
  }

  const { data: connection } = await service
    .from("whatsapp_connections")
    .select("instance_name, status")
    .eq("id", input.connectionId)
    .maybeSingle();

  if (!connection?.instance_name || connection.status !== "connected") {
    return conversation.avatar_url as string | null;
  }

  try {
    const avatarUrl = await fetchEvolutionProfilePictureUrl(
      connection.instance_name,
      input.customerPhone,
    );

    const { error } = await service
      .from("platform_whatsapp_conversations")
      .update({
        avatar_url: avatarUrl,
        avatar_fetched_at: new Date().toISOString(),
      })
      .eq("id", input.conversationId);

    if (error) throw error;
    return avatarUrl;
  } catch (error) {
    console.error(
      "refreshPlatformConversationAvatar failed:",
      error instanceof Error ? error.message : error,
    );
    // Marca tentativa para não martelar a Evolution a cada mensagem.
    await service
      .from("platform_whatsapp_conversations")
      .update({ avatar_fetched_at: new Date().toISOString() })
      .eq("id", input.conversationId);
    return conversation.avatar_url as string | null;
  }
};

export const upsertPlatformWhatsappConversation = async (
  service: SupabaseClient,
  input: {
    connectionId: number;
    customerName: string | null;
    customerPhone: string;
    evolutionMessageId: string | null;
    fromMe: boolean;
    messageText: string | null;
    messageType: string | null;
    messageTimestamp: string | null;
  },
) => {
  const lastMessageAt = input.messageTimestamp ?? new Date().toISOString();
  const lastMessagePreview = buildPreview(input.messageText, input.messageType);
  const isInbound = !input.fromMe;
  const direction = isInbound ? "inbound" : "outbound";
  const body = input.messageText?.trim() || lastMessagePreview;

  const { data: existing, error: existingError } = await service
    .from("platform_whatsapp_conversations")
    .select("id, customer_name, is_unread, avatar_url, avatar_fetched_at")
    .eq("connection_id", input.connectionId)
    .eq("customer_phone", input.customerPhone)
    .maybeSingle();

  if (existingError) throw existingError;

  let conversationId: number;
  let shouldFetchAvatar = true;

  if (existing) {
    conversationId = existing.id;
    shouldFetchAvatar = shouldRefreshAvatar(existing.avatar_url, existing.avatar_fetched_at);

    const updates: Record<string, unknown> = {
      last_message_at: lastMessageAt,
      last_message_preview: lastMessagePreview,
    };

    if (isInbound) {
      updates.is_unread = true;
    }

    if (input.customerName && !existing.customer_name) {
      updates.customer_name = input.customerName;
    }

    const { error: updateError } = await service
      .from("platform_whatsapp_conversations")
      .update(updates)
      .eq("id", existing.id);

    if (updateError) throw updateError;
  } else {
    const { data: created, error: insertError } = await service
      .from("platform_whatsapp_conversations")
      .insert({
        connection_id: input.connectionId,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        is_unread: isInbound,
        last_message_at: lastMessageAt,
        last_message_preview: lastMessagePreview,
        stage: "contato_inicial",
      })
      .select("id")
      .single();

    if (insertError) throw insertError;
    conversationId = created.id;
  }

  const { error: messageError } = await service.from("platform_whatsapp_messages").insert({
    body,
    connection_id: input.connectionId,
    conversation_id: conversationId,
    direction,
    evolution_message_id: input.evolutionMessageId,
    from_me: input.fromMe,
    message_type: input.messageType ?? "text",
    sent_at: lastMessageAt,
  });

  if (messageError && !isDuplicateKeyError(messageError)) {
    throw messageError;
  }

  if (shouldFetchAvatar) {
    // best-effort — não bloqueia o webhook se a Evolution falhar
    void refreshPlatformConversationAvatar(service, {
      connectionId: input.connectionId,
      conversationId,
      customerPhone: input.customerPhone,
      force: true,
    });
  }

  return conversationId;
};
