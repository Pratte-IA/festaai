import { funnelTabs, stageMap } from "./constants";
import { getDefaultStageForFunnel, resolveFunnelStageForImport } from "./stage-validation";
import { EventType, FunnelType, InternalStatus, Stage } from "./types";

export interface LeadCsvRowParsed {
  aniversariante_data_nascimento: string | null;
  aniversariante_nome: string | null;
  cliente_email: string | null;
  cliente_nome: string;
  cliente_telefone: string | null;
  data_evento: string | null;
  etapa: Stage;
  funil: FunnelType;
  hora_evento: string | null;
  observacoes: string | null;
  origem: string | null;
  pacote_nome: string | null;
  quantidade_convidados: number | null;
  status_interno: InternalStatus;
  tipo_evento: EventType;
  valor_adicionais: number;
  valor_entrada: number;
  valor_pacote: number;
  valor_total: number;
}

export interface LeadCsvParseIssue {
  line: number;
  message: string;
}

export interface LeadCsvParseSuccess {
  line: number;
  row: LeadCsvRowParsed;
}

export interface LeadCsvParseResult {
  issues: LeadCsvParseIssue[];
  rows: LeadCsvRowParsed[];
  successes: LeadCsvParseSuccess[];
}

export const MAX_LEAD_UPLOAD_ROWS = 500;

/** Aliases keyed by semantic field names (matching LeadCsvRowParsed keys we fill from CSV). */
const HEADER_ALIASES: Record<string, string[]> = {
  cliente_nome: ["nome", "cliente", "name", "cliente_nome", "responsavel", "nome_cliente"],
  cliente_telefone: ["telefone", "celular", "whatsapp", "tel", "fone", "cliente_telefone", "ddd"],
  cliente_email: ["email", "e_mail", "mail", "cliente_email"],
  origem: ["origem", "fonte", "canal"],
  data_evento: ["data_evento", "data_festa", "data", "dia_evento"],
  hora_evento: ["hora", "horario", "hora_evento"],
  aniversariante_nome: ["aniversariante", "crianca", "nome_aniversariante"],
  aniversariante_data_nascimento: [
    "nascimento",
    "data_nascimento",
    "data_de_nascimento",
    "aniversariante_data_nascimento",
  ],
  quantidade_convidados: ["convidados", "qtd_convidados", "quantidade_convidados", "guests"],
  pacote_nome: ["pacote", "pacote_nome"],
  valor_pacote: ["valor_pacote", "valor_do_pacote", "pacote_valor"],
  valor_adicionais: ["valor_adicionais", "adicionais"],
  valor_entrada: ["valor_entrada", "entrada"],
  observacoes: ["observacoes", "obs", "notas", "mensagem"],
  etapa: ["etapa", "fase", "coluna_etapa", "quadro"],
  funil: ["funil", "pipeline", "funnel"],
  tipo_evento: ["tipo_evento", "tipo", "type"],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const stripUtf8Bom = (text: string): string => (text.startsWith("\ufeff") ? text.slice(1) : text);

export const normalizeHeaderKey = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

export const splitCsvLines = (text: string): string[] =>
  text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");

/** Minimal RFC-style CSV row parser (quoted fields, commas). */
export const parseCsvRow = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result.map((cell) => cell.trim());
};

const resolveHeaderMap = (headers: string[]): Map<string, number> => {
  const columnByField = new Map<string, number>();

  headers.forEach((header, columnIndex) => {
    const key = normalizeHeaderKey(header);
    if (!key) return;

    let matchedField: string | null = null;
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (key === field || aliases.includes(key)) {
        matchedField = field;
        break;
      }
    }

    if (matchedField && !columnByField.has(matchedField)) {
      columnByField.set(matchedField, columnIndex);
    }
  });

  return columnByField;
};

const cellAt = (fields: string[], columnByField: Map<string, number>, field: string): string => {
  const index = columnByField.get(field);
  if (index === undefined) return "";
  return fields[index] ?? "";
};

export const parseDateFlexible = (raw: string): { iso: string } | null => {
  const t = raw.trim();
  if (!t) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (iso) return { iso: t };

  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (br) {
    const dd = br[1].padStart(2, "0");
    const mm = br[2].padStart(2, "0");
    const yyyy = br[3];
    return { iso: `${yyyy}-${mm}-${dd}` };
  }

  return null;
};

/** Accepts values like ""1.234,56"" or ""1234.56"". */
export const parseMoneyFlexible = (raw: string): number | null => {
  let t = raw.trim();
  if (!t) return null;

  // Remove locale thousand separators commonly used with decimal comma.
  const hasComma = t.includes(",");
  const hasDot = t.includes(".");
  if (hasComma && hasDot) {
    if (t.lastIndexOf(",") > t.lastIndexOf(".")) {
      t = t.replace(/\./g, "").replace(",", ".");
    } else {
      t = t.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    t = t.replace(",", ".");
  }

  t = t.replace(/\s/g, "").replace(/^R\$/, "");
  const n = Number(t);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
};

const parseNullableInt = (raw: string): number | null => {
  const t = raw.trim();
  if (!t) return null;
  const n = Number.parseInt(t.replace(/\./g, ""), 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
};

const parseOptionalTime = (raw: string): string | null => {
  const t = raw.trim();
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t);
  if (!m) return null;
  const hh = m[1].padStart(2, "0");
  const mm = m[2];
  return `${hh}:${mm}:00`;
};

const parseOptionalEmail = (raw: string): { value: string | null; error?: string } => {
  const t = raw.trim();
  if (!t) return { value: null };
  if (!EMAIL_RE.test(t)) return { value: null, error: "E-mail invalido." };
  return { value: t };
};

const formatStageChoices = (funil: FunnelType): string =>
  stageMap[funil]
    .map((s) => `${s.label} (${s.key})`)
    .join(", ");

export const resolveFunilCell = (raw: string): { funil: FunnelType } | { error: string } | null => {
  const t = raw.trim();
  if (!t) return null;

  const normalized = normalizeHeaderKey(t);

  const keyMatch = (["vendas", "festa", "executadas"] as const).find((k) => k === normalized);
  if (keyMatch) return { funil: keyMatch };

  for (const tab of funnelTabs) {
    if (normalizeHeaderKey(tab.label) === normalized) {
      return { funil: tab.key };
    }
  }

  return {
    error:
      "Funil invalido. Use a chave vendas, festa ou executadas (ou o nome Vendas, Festa, Executadas), conforme o modelo.",
  };
};

/** Resolve etapa por chave tecnica ou por rotulo da etapa (ex.: Negociacao ou negociacao). */
export const resolveEtapaCell = (
  raw: string,
  funil: FunnelType,
): { etapa: Stage } | { error: string } | null => {
  const t = raw.trim();
  if (!t) return null;

  const normalized = normalizeHeaderKey(t);

  const stagesForFunnel = stageMap[funil];
  const byKeyMatch = stagesForFunnel.find((s) => s.key === normalized);
  if (byKeyMatch) {
    return { etapa: byKeyMatch.key };
  }

  for (const s of stagesForFunnel) {
    if (normalizeHeaderKey(s.label) === normalized) {
      return { etapa: s.key };
    }
  }

  return {
    error: `Etapa invalida para este funil. Opcoes permitidas (chave ou nome): ${formatStageChoices(funil)}.`,
  };
};

const deriveStatusInternoFromEtapa = (etapa: Stage): InternalStatus => (etapa === "perdido" ? "perdido" : "ativo");

export const resolveTipoEventoCell = (raw: string): { tipo_evento: EventType } | { error: string } => {
  const normalized = normalizeHeaderKey(raw);
  if (!normalized) return { tipo_evento: "festa" };

  if (normalized === "festa") return { tipo_evento: "festa" };
  if (normalized === "visita") return { tipo_evento: "visita" };

  return { error: 'Tipo de evento invalido. Use "festa" ou "visita".' };
};

/** Parseia CSV UTF-8: cada linha define funil e etapa (colunas obrigatorias no cabecalho; celula etapa vazia usa 1a etapa do funil). */
export const parseLeadImportCsv = (text: string): LeadCsvParseResult => {
  const cleaned = stripUtf8Bom(text).trimEnd();
  const lines = splitCsvLines(cleaned).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return {
      issues: [{ line: 1, message: "O arquivo precisa de uma linha de cabecalho e ao menos uma linha de dados." }],
      rows: [],
      successes: [],
    };
  }

  const headerCells = parseCsvRow(lines[0]);
  const columnByField = resolveHeaderMap(headerCells);

  if (!columnByField.has("cliente_nome")) {
    const example = HEADER_ALIASES.cliente_nome.join(", ");
    return {
      issues: [{ line: 1, message: `Nao encontramos coluna com nome do cliente. Use algo como: ${example}.` }],
      rows: [],
      successes: [],
    };
  }

  if (!columnByField.has("funil")) {
    return {
      issues: [
        {
          line: 1,
          message:
            "Coluna obrigatoria: funil (vendas, festa ou executadas). Baixe modelo-importacao-leads.csv como referencia.",
        },
      ],
      rows: [],
      successes: [],
    };
  }

  if (!columnByField.has("etapa")) {
    return {
      issues: [
        {
          line: 1,
          message:
            "Coluna obrigatoria: etapa (chave tecnica ou nome da etapa do funil na linha). Veja exemplo no modelo CSV.",
        },
      ],
      rows: [],
      successes: [],
    };
  }

  const issues: LeadCsvParseIssue[] = [];
  const rows: LeadCsvRowParsed[] = [];
  const successes: LeadCsvParseSuccess[] = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    const fields = parseCsvRow(lines[i]);

    if (fields.every((f) => f.trim() === "")) continue;

    const nome = cellAt(fields, columnByField, "cliente_nome").trim();

    if (nome.length < 2) {
      issues.push({ line: lineNumber, message: "Nome do cliente obrigatorio (minimo 2 caracteres)." });
      continue;
    }

    const funilRaw = cellAt(fields, columnByField, "funil");
    const funilHit = resolveFunilCell(funilRaw);
    if (!funilHit) {
      issues.push({ line: lineNumber, message: "Celula funil obrigatoria em cada linha." });
      continue;
    }
    if ("error" in funilHit) {
      issues.push({ line: lineNumber, message: funilHit.error });
      continue;
    }
    let rowFunil = funilHit.funil;

    const cliente_telefone = cellAt(fields, columnByField, "cliente_telefone").trim() || null;
    const telefone_digits = cliente_telefone?.replace(/\D/g, "") ?? "";

    let cliente_email: string | null = null;
    const emailRaw = cellAt(fields, columnByField, "cliente_email");
    const parsedEmail = parseOptionalEmail(emailRaw);
    if (parsedEmail.error) {
      issues.push({ line: lineNumber, message: parsedEmail.error });
      continue;
    }
    cliente_email = parsedEmail.value;

    const dataRaw = cellAt(fields, columnByField, "data_evento");
    let data_evento: string | null = null;
    if (dataRaw.trim()) {
      const parsed = parseDateFlexible(dataRaw);
      if (!parsed) {
        issues.push({ line: lineNumber, message: "Data do evento invalida. Use DD/MM/AAAA ou AAAA-MM-DD." });
        continue;
      }
      data_evento = parsed.iso;
    }

    const nascimentoRaw = cellAt(fields, columnByField, "aniversariante_data_nascimento");
    let aniversariante_data_nascimento: string | null = null;
    if (nascimentoRaw.trim()) {
      const parsed = parseDateFlexible(nascimentoRaw);
      if (!parsed) {
        issues.push({ line: lineNumber, message: "Data de nascimento invalida. Use DD/MM/AAAA ou AAAA-MM-DD." });
        continue;
      }
      aniversariante_data_nascimento = parsed.iso;
    }

    const horaRaw = cellAt(fields, columnByField, "hora_evento");
    let hora_evento: string | null = null;
    if (horaRaw.trim()) {
      const h = parseOptionalTime(horaRaw);
      if (!h) {
        issues.push({ line: lineNumber, message: "Horario invalido. Use HH:MM." });
        continue;
      }
      hora_evento = h;
    }

    const quantidade_convidados = parseNullableInt(cellAt(fields, columnByField, "quantidade_convidados"));

    const tipoEventoRaw = cellAt(fields, columnByField, "tipo_evento");
    const tipoEventoHit = resolveTipoEventoCell(tipoEventoRaw);
    if ("error" in tipoEventoHit) {
      issues.push({ line: lineNumber, message: tipoEventoHit.error });
      continue;
    }

    const valor_pacote = parseMoneyFlexible(cellAt(fields, columnByField, "valor_pacote")) ?? 0;
    const valor_adicionais = parseMoneyFlexible(cellAt(fields, columnByField, "valor_adicionais")) ?? 0;
    const valor_entrada = parseMoneyFlexible(cellAt(fields, columnByField, "valor_entrada")) ?? 0;
    const valor_total = Math.round((valor_pacote + valor_adicionais) * 100) / 100;

    const etapaRaw = cellAt(fields, columnByField, "etapa");
    let etapa: Stage;

    if (normalizeHeaderKey(etapaRaw) === "fechado") {
      const migrated = resolveFunnelStageForImport(rowFunil, "fechado" as Stage);
      rowFunil = migrated.funnel;
      etapa = migrated.stage;
    } else {
      const hit = resolveEtapaCell(etapaRaw, rowFunil);
      if (hit && "error" in hit) {
        issues.push({ line: lineNumber, message: hit.error });
        continue;
      }
      etapa = hit && "etapa" in hit ? hit.etapa : getDefaultStageForFunnel(rowFunil);
    }

    const row: LeadCsvRowParsed = {
      aniversariante_data_nascimento,
      aniversariante_nome: cellAt(fields, columnByField, "aniversariante_nome").trim() || null,
      cliente_email,
      cliente_nome: nome,
      cliente_telefone: telefone_digits.length > 0 ? cliente_telefone : null,
      data_evento,
      etapa,
      funil: rowFunil,
      hora_evento,
      observacoes: cellAt(fields, columnByField, "observacoes").trim() || null,
      origem: cellAt(fields, columnByField, "origem").trim() || null,
      pacote_nome: cellAt(fields, columnByField, "pacote_nome").trim() || null,
      quantidade_convidados,
      status_interno: deriveStatusInternoFromEtapa(etapa),
      tipo_evento: tipoEventoHit.tipo_evento,
      valor_adicionais,
      valor_entrada,
      valor_pacote,
      valor_total,
    };

    rows.push(row);
    successes.push({ line: lineNumber, row });
  }

  if (rows.length > MAX_LEAD_UPLOAD_ROWS) {
    return {
      issues: [
        {
          line: 0,
          message: `Limite de ${MAX_LEAD_UPLOAD_ROWS} linhas por arquivo. Encontradas ${rows.length} linhas validas.`,
        },
      ],
      rows: [],
      successes: [],
    };
  }

  return { issues, rows, successes };
};
