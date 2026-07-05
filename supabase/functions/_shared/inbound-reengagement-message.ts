export interface InboundReengagementMessageInput {
  text: string | null;
  type: string;
}

const TRIVIAL_MEDIA_TYPES = new Set(["sticker", "reaction"]);

const TRIVIAL_ACK_PATTERNS: RegExp[] = [
  /^ok(?:ay)?[\s!.]*$/i,
  /^obrigad[oa][\s!.🙏]*$/i,
  /^brigad[oa][\s!.🙏]*$/i,
  /^valeu[\s!.]*$/i,
  /^vlw[\s!.]*$/i,
  /^blz[\s!.]*$/i,
  /^beleza[\s!.]*$/i,
  /^certo[\s!.]*$/i,
  /^entendi[\s!.]*$/i,
  /^show[\s!.]*$/i,
  /^legal[\s!.]*$/i,
  /^t[aá]\s*bom[\s!.]*$/i,
  /^t[aá]\s*bem[\s!.]*$/i,
  /^combinado[\s!.]*$/i,
  /^perfeito[\s!.]*$/i,
  /^maravilha[\s!.]*$/i,
  /^otimo[\s!.]*$/i,
  /^ótimo[\s!.]*$/i,
  /^👍+$/,
  /^🙏+$/,
  /^❤️?$/,
  /^💕+$/,
  /^😊+$/,
  /^🥰+$/,
  /^👏+$/,
];

const EMOJI_ONLY_PATTERN = /^[\p{Extended_Pictographic}\s]+$/u;

const normalizeAckText = (text: string): string =>
  text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!]+$/g, "")
    .trim();

/** Mensagens curtas de cortesia/reação que não retomam o funil após FU4. */
export const isTrivialInboundReengagementMessage = (
  message: InboundReengagementMessageInput,
): boolean => {
  if (TRIVIAL_MEDIA_TYPES.has(message.type)) return true;

  const raw = message.text?.trim();
  if (!raw) return true;

  const normalized = normalizeAckText(raw);
  if (!normalized) return true;

  if (TRIVIAL_ACK_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  if (normalized.length <= 3 && EMOJI_ONLY_PATTERN.test(normalized)) {
    return true;
  }

  return false;
};
