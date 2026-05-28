/** Normaliza texto colado (proposta, planilha, lista do buffet) em itens individuais. */
export function parseListItems(raw: string): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const push = (value: string) => {
    const cleaned = value
      .trim()
      .replace(/^\d+[.)]\s*/, "")
      .replace(/^[-•*–—]\s*/, "")
      .trim();

    if (!cleaned || seen.has(cleaned)) return;
    seen.add(cleaned);
    result.push(cleaned);
  };

  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const hasSeparator = /[,;]/.test(trimmed);
    const parts = hasSeparator ? trimmed.split(/[,;]+/) : [trimmed];

    for (const part of parts) {
      push(part);
    }
  }

  return result;
}

export function isBulkListPaste(text: string): boolean {
  if (text.includes("\n") || text.includes("\r")) return true;
  if (/[,;]/.test(text) && parseListItems(text).length > 1) return true;
  return false;
}
