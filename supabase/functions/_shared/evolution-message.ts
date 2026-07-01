import { toWhatsAppPhoneKey } from "./phone.ts";

export interface ParsedEvolutionMessage {
  customerName: string | null;
  customerPhone: string | null;
  fromMe: boolean;
  id: string | null;
  mediaBase64: string | null;
  mediaMimetype: string | null;
  remoteJid: string | null;
  text: string | null;
  timestamp: string | null;
  type: string;
}

const GROUP_JID_SUFFIX = "@g.us";

/** @deprecated Use toWhatsAppPhoneKey from phone.ts */
export const normalizeBrazilPhone = toWhatsAppPhoneKey;

const extractMessageText = (message: Record<string, unknown> | null | undefined): string | null => {
  if (!message) return null;

  const conversation = message.conversation;
  if (typeof conversation === "string" && conversation.trim()) return conversation.trim();

  const extended = message.extendedTextMessage;
  if (typeof extended === "object" && extended) {
    const text = (extended as { text?: unknown }).text;
    if (typeof text === "string" && text.trim()) return text.trim();
  }

  const image = message.imageMessage;
  if (typeof image === "object" && image) {
    const caption = (image as { caption?: unknown }).caption;
    if (typeof caption === "string" && caption.trim()) return caption.trim();
    return "[imagem]";
  }

  const video = message.videoMessage;
  if (typeof video === "object" && video) {
    const caption = (video as { caption?: unknown }).caption;
    if (typeof caption === "string" && caption.trim()) return caption.trim();
    return "[vídeo]";
  }

  const audio = message.audioMessage;
  if (audio) return "[áudio]";

  const document = message.documentMessage;
  if (typeof document === "object" && document) {
    const caption = (document as { caption?: unknown }).caption;
    if (typeof caption === "string" && caption.trim()) return caption.trim();
    return "[documento]";
  }

  const sticker = message.stickerMessage;
  if (sticker) return "[sticker]";

  const contact = message.contactMessage;
  if (contact) return "[contato]";

  const location = message.locationMessage;
  if (location) return "[localização]";

  return null;
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

  for (const key of MEDIA_MESSAGE_KEYS) {
    const media = message[key];
    if (typeof media === "object" && media) {
      const mimetype = (media as { mimetype?: unknown }).mimetype;
      if (typeof mimetype === "string" && mimetype.trim()) return mimetype.trim();
    }
  }

  return null;
};

const extractMediaBase64 = (entry: Record<string, unknown>): string | null => {
  const candidates: unknown[] = [entry.base64, entry.mediaBase64];

  const message = entry.message;
  if (typeof message === "object" && message) {
    candidates.push((message as Record<string, unknown>).base64);
  }

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
  }

  return null;
};

const resolveMessageType = (message: Record<string, unknown> | null | undefined): string => {
  if (!message) return "unknown";
  if (message.conversation || message.extendedTextMessage) return "text";
  if (message.imageMessage) return "image";
  if (message.videoMessage) return "video";
  if (message.audioMessage) return "audio";
  if (message.documentMessage) return "document";
  if (message.stickerMessage) return "sticker";
  if (message.contactMessage) return "contact";
  if (message.locationMessage) return "location";
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

const parseSingleMessage = (entry: Record<string, unknown>): ParsedEvolutionMessage | null => {
  const key =
    (typeof entry.key === "object" && entry.key ? (entry.key as Record<string, unknown>) : null) ??
    (typeof entry.messageKey === "object" && entry.messageKey
      ? (entry.messageKey as Record<string, unknown>)
      : null);

  const remoteJid =
    typeof key?.remoteJid === "string"
      ? key.remoteJid
      : typeof key?.remoteJidAlt === "string"
        ? key.remoteJidAlt
        : null;

  if (!remoteJid || remoteJid.includes(GROUP_JID_SUFFIX)) return null;

  const fromMe = key?.fromMe === true;
  const id = typeof key?.id === "string" ? key.id : null;

  const messageContent =
    typeof entry.message === "object" && entry.message
      ? (entry.message as Record<string, unknown>)
      : entry;

  const text = extractMessageText(messageContent);
  const type = resolveMessageType(messageContent);
  const mediaBase64 = extractMediaBase64(entry);
  const mediaMimetype = extractMediaMimetype(messageContent) ?? extractMediaMimetype(entry);
  const customerPhone = toWhatsAppPhoneKey(remoteJid);

  const pushName = entry.pushName ?? entry.notifyName;
  const customerName = typeof pushName === "string" && pushName.trim() ? pushName.trim() : null;

  const timestamp = toIsoTimestamp(
    entry.messageTimestamp ??
      entry.timestamp ??
      entry.t ??
      (typeof entry.message === "object" && entry.message
        ? (entry.message as Record<string, unknown>).messageTimestamp
        : null),
  );

  return {
    customerName,
    customerPhone,
    fromMe,
    id,
    mediaBase64,
    mediaMimetype,
    remoteJid,
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

export const shouldSkipMessage = (message: ParsedEvolutionMessage): string | null => {
  if (message.fromMe) return "fromMe";
  if (!message.customerPhone) return "invalid_phone";
  if (!message.text?.trim()) return "empty_message";
  return null;
};

export const isMessagesUpsertEvent = (eventName: string | null): boolean =>
  eventName === "MESSAGES_UPSERT" || eventName === "messages.upsert";

export const isConnectionUpdateEvent = (eventName: string | null): boolean =>
  eventName === "CONNECTION_UPDATE" || eventName === "connection.update";
