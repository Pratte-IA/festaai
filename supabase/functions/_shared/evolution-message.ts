import { toWhatsAppPhoneKey } from "./phone.ts";

export interface EvolutionReplyTo {
  id: string | null;
  text: string | null;
  type: string | null;
  participant: string | null;
}

export interface ParsedEvolutionMessage {
  customerName: string | null;
  customerPhone: string | null;
  fromMe: boolean;
  id: string | null;
  mediaBase64: string | null;
  mediaMimetype: string | null;
  remoteJid: string | null;
  replyTo: EvolutionReplyTo | null;
  text: string | null;
  timestamp: string | null;
  type: string;
}

const GROUP_JID_SUFFIX = "@g.us";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** @deprecated Use toWhatsAppPhoneKey from phone.ts */
export const normalizeBrazilPhone = toWhatsAppPhoneKey;

const MESSAGE_WRAPPER_KEYS = [
  "ephemeralMessage",
  "viewOnceMessage",
  "viewOnceMessageV2",
  "viewOnceMessageV2Extension",
  "documentWithCaptionMessage",
  "editedMessage",
] as const;

const CONTEXT_INFO_CONTAINER_KEYS = [
  "extendedTextMessage",
  "imageMessage",
  "videoMessage",
  "documentMessage",
  "audioMessage",
  "stickerMessage",
  "buttonsResponseMessage",
  "listResponseMessage",
  "templateButtonReplyMessage",
  "buttonsMessage",
  "listMessage",
  "contactMessage",
  "locationMessage",
  "reactionMessage",
  "templateMessage",
] as const;

const QUOTED_MESSAGE_TYPE_KEYS = [
  "extendedTextMessage",
  "imageMessage",
  "videoMessage",
  "documentMessage",
  "audioMessage",
  "stickerMessage",
  "buttonsResponseMessage",
  "listResponseMessage",
  "templateButtonReplyMessage",
  "buttonsMessage",
  "listMessage",
  "templateMessage",
  "contactMessage",
  "locationMessage",
  "reactionMessage",
] as const;

const asTrimmedString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const unwrapMessageContent = (
  message: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null => {
  if (!message) return null;

  for (const key of MESSAGE_WRAPPER_KEYS) {
    const wrapper = message[key];
    if (!isRecord(wrapper)) continue;
    const nested = wrapper.message;
    if (isRecord(nested)) {
      return unwrapMessageContent(nested) ?? nested;
    }
  }

  return message;
};

/**
 * Extrai texto legível de um nó de mensagem WhatsApp/Evolution.
 * Usado para a mensagem atual (com placeholders de mídia) e para quotedMessage.
 */
export const extractMessageText = (
  message: Record<string, unknown> | null | undefined,
  options?: { mediaPlaceholders?: boolean },
): string | null => {
  if (!message) return null;

  const usePlaceholders = options?.mediaPlaceholders !== false;
  const content = unwrapMessageContent(message) ?? message;

  const conversation = asTrimmedString(content.conversation);
  if (conversation) return conversation;

  if (isRecord(content.extendedTextMessage)) {
    const text = asTrimmedString(content.extendedTextMessage.text);
    if (text) return text;
  }

  if (isRecord(content.imageMessage)) {
    const caption = asTrimmedString(content.imageMessage.caption);
    if (caption) return caption;
    return usePlaceholders ? "[imagem]" : null;
  }

  if (isRecord(content.videoMessage)) {
    const caption = asTrimmedString(content.videoMessage.caption);
    if (caption) return caption;
    return usePlaceholders ? "[vídeo]" : null;
  }

  if (content.audioMessage) return usePlaceholders ? "[áudio]" : null;

  if (isRecord(content.documentMessage)) {
    const caption = asTrimmedString(content.documentMessage.caption);
    if (caption) return caption;
    return usePlaceholders ? "[documento]" : null;
  }

  if (content.stickerMessage) return usePlaceholders ? "[sticker]" : null;

  if (isRecord(content.reactionMessage)) {
    const emoji = asTrimmedString(content.reactionMessage.text);
    if (emoji) return emoji;
    return usePlaceholders ? "[reação]" : null;
  }

  if (content.contactMessage) return usePlaceholders ? "[contato]" : null;

  if (content.locationMessage) return usePlaceholders ? "[localização]" : null;

  if (isRecord(content.buttonsResponseMessage)) {
    const text = asTrimmedString(content.buttonsResponseMessage.selectedDisplayText);
    if (text) return text;
  }

  if (isRecord(content.listResponseMessage)) {
    const text = asTrimmedString(content.listResponseMessage.title);
    if (text) return text;
  }

  if (isRecord(content.templateButtonReplyMessage)) {
    const text = asTrimmedString(content.templateButtonReplyMessage.selectedDisplayText);
    if (text) return text;
  }

  if (isRecord(content.buttonsMessage)) {
    const text = asTrimmedString(content.buttonsMessage.contentText);
    if (text) return text;
  }

  if (isRecord(content.listMessage)) {
    const text = asTrimmedString(content.listMessage.description);
    if (text) return text;
  }

  if (isRecord(content.templateMessage) && isRecord(content.templateMessage.hydratedTemplate)) {
    const text = asTrimmedString(content.templateMessage.hydratedTemplate.hydratedContentText);
    if (text) return text;
  }

  return null;
};

/** Localiza contextInfo em qualquer tipo de mensagem suportado pela Evolution/Baileys. */
export const findContextInfo = (
  message: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null => {
  if (!message) return null;

  const content = unwrapMessageContent(message) ?? message;

  if (isRecord(content.contextInfo)) return content.contextInfo;

  for (const key of CONTEXT_INFO_CONTAINER_KEYS) {
    const nested = content[key];
    if (isRecord(nested) && isRecord(nested.contextInfo)) {
      return nested.contextInfo;
    }
  }

  return null;
};

export const resolveQuotedMessageType = (
  quotedMessage: Record<string, unknown> | null | undefined,
): string | null => {
  if (!quotedMessage) return null;

  if (quotedMessage.conversation != null) return "conversation";

  for (const key of QUOTED_MESSAGE_TYPE_KEYS) {
    if (quotedMessage[key] != null) return key;
  }

  return null;
};

export const extractQuotedMessageText = (
  quotedMessage: Record<string, unknown> | null | undefined,
): string | null => extractMessageText(quotedMessage, { mediaPlaceholders: false });

export const extractReplyTo = (
  message: Record<string, unknown> | null | undefined,
): EvolutionReplyTo | null => {
  const contextInfo = findContextInfo(message);
  if (!contextInfo) return null;

  const id =
    asTrimmedString(contextInfo.stanzaId) ??
    asTrimmedString(contextInfo.stanzaID) ??
    asTrimmedString(contextInfo.quotedMessageId);

  const participant =
    asTrimmedString(contextInfo.participant) ??
    asTrimmedString(contextInfo.participantAlt) ??
    asTrimmedString(contextInfo.remoteJid);

  const quotedMessage = isRecord(contextInfo.quotedMessage) ? contextInfo.quotedMessage : null;

  // Sem ID e sem quotedMessage → não é uma resposta rastreável.
  if (!id && !quotedMessage) return null;

  if (!quotedMessage) {
    return {
      id,
      text: null,
      type: null,
      participant,
    };
  }

  return {
    id,
    text: extractQuotedMessageText(quotedMessage),
    type: resolveQuotedMessageType(quotedMessage),
    participant,
  };
};

const MEDIA_MESSAGE_KEYS = [
  "audioMessage",
  "imageMessage",
  "videoMessage",
  "documentMessage",
  "stickerMessage",
] as const;

const extractMediaMimetype = (message: Record<string, unknown> | null | undefined): string | null => {
  if (!message) return null;

  const content = unwrapMessageContent(message) ?? message;

  for (const key of MEDIA_MESSAGE_KEYS) {
    const media = content[key];
    if (isRecord(media)) {
      const mimetype = asTrimmedString(media.mimetype);
      if (mimetype) return mimetype;
    }
  }

  return null;
};

const extractMediaBase64 = (entry: Record<string, unknown>): string | null => {
  const candidates: unknown[] = [entry.base64, entry.mediaBase64];

  const message = entry.message;
  if (isRecord(message)) {
    candidates.push(message.base64);
  }

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
  }

  return null;
};

const resolveMessageType = (message: Record<string, unknown> | null | undefined): string => {
  if (!message) return "unknown";

  const content = unwrapMessageContent(message) ?? message;

  if (content.conversation || content.extendedTextMessage) return "text";
  if (content.imageMessage) return "image";
  if (content.videoMessage) return "video";
  if (content.audioMessage) return "audio";
  if (content.documentMessage) return "document";
  if (content.stickerMessage) return "sticker";
  if (content.reactionMessage) return "reaction";
  if (content.contactMessage) return "contact";
  if (content.locationMessage) return "location";
  if (content.buttonsResponseMessage || content.listResponseMessage || content.templateButtonReplyMessage) {
    return "text";
  }
  return "unknown";
};

const toIsoTimestamp = (value: unknown): string | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 1_000_000_000_000 ? value : value * 1000;
    return new Date(ms).toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  }
  return null;
};

const pickRemoteJid = (key: Record<string, unknown> | null): string | null => {
  if (!key) return null;

  const candidates = [key.remoteJid, key.remoteJidAlt].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  // Preferir JID de telefone; Evolution pode enviar LID em remoteJid e o número em remoteJidAlt.
  const phoneJid = candidates.find(
    (jid) => !jid.includes(GROUP_JID_SUFFIX) && !jid.includes("@lid"),
  );
  if (phoneJid) return phoneJid;

  return candidates.find((jid) => !jid.includes(GROUP_JID_SUFFIX)) ?? null;
};

const parseSingleMessage = (entry: Record<string, unknown>): ParsedEvolutionMessage | null => {
  const key =
    (isRecord(entry.key) ? entry.key : null) ??
    (isRecord(entry.messageKey) ? entry.messageKey : null);

  const remoteJid = pickRemoteJid(key);

  if (!remoteJid || remoteJid.includes(GROUP_JID_SUFFIX)) return null;

  const fromMe = key?.fromMe === true;
  const id = typeof key?.id === "string" ? key.id : null;

  const messageContent =
    isRecord(entry.message) ? entry.message : entry;

  const text = extractMessageText(messageContent);
  const type = resolveMessageType(messageContent);
  const mediaBase64 = extractMediaBase64(entry);
  const mediaMimetype = extractMediaMimetype(messageContent) ?? extractMediaMimetype(entry);
  const customerPhone = toWhatsAppPhoneKey(remoteJid);
  // Evolution pode trazer contextInfo dentro do nó da mensagem OU no nível do entry
  // (ex.: messageType=conversation com quotedMessage no sibling contextInfo).
  const replyTo =
    extractReplyTo(messageContent) ??
    (isRecord(entry.contextInfo) ? extractReplyTo({ contextInfo: entry.contextInfo }) : null);

  const pushName = entry.pushName ?? entry.notifyName;
  const customerName = typeof pushName === "string" && pushName.trim() ? pushName.trim() : null;

  const timestamp = toIsoTimestamp(
    entry.messageTimestamp ??
      entry.timestamp ??
      entry.t ??
      (isRecord(entry.message) ? entry.message.messageTimestamp : null),
  );

  return {
    customerName,
    customerPhone,
    fromMe,
    id,
    mediaBase64,
    mediaMimetype,
    remoteJid,
    replyTo,
    text,
    timestamp,
    type,
  };
};

export const isMediaMessageType = (type: string): boolean =>
  type === "audio" ||
  type === "image" ||
  type === "video" ||
  type === "document" ||
  type === "sticker";

export const extractMessageEntries = (payload: Record<string, unknown>): Record<string, unknown>[] => {
  const data = payload.data;

  if (Array.isArray(data)) {
    return data.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  }

  if (typeof data === "object" && data) {
    return [data as Record<string, unknown>];
  }

  if (typeof payload.message === "object" && payload.message) {
    return [payload.message as Record<string, unknown>];
  }

  return [];
};

export const parseEvolutionMessages = (payload: Record<string, unknown>): ParsedEvolutionMessage[] => {
  const entries = extractMessageEntries(payload);
  const parsed: ParsedEvolutionMessage[] = [];

  for (const entry of entries) {
    const message = parseSingleMessage(entry);
    if (message) parsed.push(message);
  }

  return parsed;
};

export const hasForwardableContent = (message: ParsedEvolutionMessage): boolean => {
  if (message.text?.trim()) return true;
  if (isMediaMessageType(message.type)) return true;
  if (message.type === "audio") return true;
  return false;
};

/** Intervenção manual do número conectado (WhatsApp app/Web) — deve chegar ao n8n com fromMe: true. */
export const isHumanInterventionMessage = (message: ParsedEvolutionMessage): boolean =>
  message.fromMe === true && Boolean(message.customerPhone) && hasForwardableContent(message);

export const shouldSkipMessage = (message: ParsedEvolutionMessage): string | null => {
  if (!message.customerPhone) return "invalid_phone";
  if (!hasForwardableContent(message)) return "empty_message";
  return null;
};

/** Resposta inbound do cliente que deve pausar a sequência de follow-up de proposta. */
export const isInboundCustomerReplyMessage = (message: ParsedEvolutionMessage): boolean => {
  if (message.fromMe || !message.customerPhone) return false;
  if (message.text?.trim()) return true;
  if (message.type === "audio") return true;
  return false;
};

export const isMessagesUpsertEvent = (eventName: string | null): boolean =>
  eventName === "MESSAGES_UPSERT" || eventName === "messages.upsert";

export const isConnectionUpdateEvent = (eventName: string | null): boolean =>
  eventName === "CONNECTION_UPDATE" || eventName === "connection.update";
