import {
  DEFAULT_ALUGUEL_ESPACO_HORA_TERMINO,
  isAluguelEspacoTemplateKey,
  type ContractTemplateKey,
} from "./contract-template-types.ts";
import { formatBrazilPhone } from "./phone.ts";

const EMPTY_PLACEHOLDER = "—";

const packageRowHasBuffet = (row: Record<string, unknown> | null): boolean => {
  if (!row?.buffet || typeof row.buffet !== "object") return true;
  return (row.buffet as { hasBuffet?: boolean }).hasBuffet !== false;
};

const resolveEventoHoraTerminoValue = (
  horaTermino: unknown,
  options: { packageRow: Record<string, unknown> | null; templateKey: ContractTemplateKey | null },
): string | null => {
  if (typeof horaTermino === "string" && horaTermino.trim()) return horaTermino.trim();
  if (isAluguelEspacoTemplateKey(options.templateKey)) return DEFAULT_ALUGUEL_ESPACO_HORA_TERMINO;
  if (!packageRowHasBuffet(options.packageRow)) return DEFAULT_ALUGUEL_ESPACO_HORA_TERMINO;
  return null;
};

export const hashContractContent = async (content: string): Promise<string> => {
  const data = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const buildContractNumber = (
  tenantId: number,
  eventoId: number,
  sequence: number,
  generatedAt = new Date(),
): string => {
  const datePart = generatedAt.toISOString().slice(0, 10).replace(/-/g, "");
  return `CTR-${tenantId}-${eventoId}-${datePart}-${String(sequence).padStart(2, "0")}`;
};

const formatCurrency = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(Number(value))) return EMPTY_PLACEHOLDER;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return EMPTY_PLACEHOLDER;
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
};

const formatTime = (value: string | null | undefined) => {
  if (!value) return EMPTY_PLACEHOLDER;
  return value.slice(0, 5);
};

const stripHtmlToText = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const applyPlaceholders = (
  templateHtml: string,
  placeholders: Record<string, string>,
): string =>
  templateHtml.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_match, key: string) => {
    const value = placeholders[key.toLowerCase()] ?? EMPTY_PLACEHOLDER;
    return escapeHtml(value);
  });

const parsePackageItems = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => (typeof item === "string" && item.trim() ? [item.trim()] : []));
};

export interface AdicionalSnapshotItem {
  category: string;
  id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  type: string;
}

export const parseAdicionaisSnapshot = (value: unknown): AdicionalSnapshotItem[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "number" || typeof row.name !== "string") return [];

    return [
      {
        category: typeof row.category === "string" ? row.category : "outros",
        id: row.id,
        name: row.name,
        price: typeof row.price === "number" ? row.price : 0,
        quantity: typeof row.quantity === "number" && row.quantity > 0 ? row.quantity : 1,
        subtotal: typeof row.subtotal === "number" ? row.subtotal : 0,
        type: typeof row.type === "string" ? row.type : "fixo",
      },
    ];
  });
};

export interface AcceptanceTermLike {
  active: boolean;
  appearsInContract: boolean;
  content: string;
  id: number;
  showInForm: boolean;
  termKey: string | null;
  title: string;
}

export interface ContractSnapshotTerm {
  accepted: boolean;
  content: string;
  termId: number;
  termKey: string | null;
  title: string;
}

const formatAceiteStatusLabel = (termKey: string | null, accepted: boolean): string => {
  if (termKey === "uso_imagem") {
    return accepted ? "[Autorizado]" : "[Não autorizado]";
  }
  return accepted ? "[Aceito]" : "[Pendente]";
};

const formatAceitesBlock = (aceites: ContractSnapshotTerm[]): string => {
  if (aceites.length === 0) return "Nenhum consentimento registrado no formulário.";

  return aceites
    .map((term) => {
      const status = formatAceiteStatusLabel(term.termKey, term.accepted);
      return `${status} ${term.title}\n${term.content}`;
    })
    .join("\n\n");
};

const formatAdditionalsBlock = (snapshot: AdicionalSnapshotItem[]): string => {
  if (snapshot.length === 0) return "Nenhum adicional contratado.";

  return snapshot
    .map(
      (item) =>
        `- ${item.name} (${item.quantity}x) — ${formatCurrency(item.subtotal)} [${item.category}]`,
    )
    .join("\n");
};

const formatAddress = (evento: Record<string, unknown>): string => {
  const parts = [
    evento.cliente_rua,
    evento.cliente_numero,
    evento.cliente_bairro,
    evento.cliente_cidade,
    evento.cliente_estado,
    evento.cliente_cep,
  ].filter((part) => typeof part === "string" && part.trim());

  return parts.length > 0 ? parts.join(", ") : EMPTY_PLACEHOLDER;
};

const defaultTemplateParams = () => ({
  agencia: "",
  banco: "",
  capacidade_maxima_espaco: null as number | null,
  chave_pix: "",
  comarca_foro: "",
  conta: "",
  idade_cobranca_convidado_extra: 3,
  percentual_multa_cancelamento: 50,
  prazo_alteracao_convidados: 7,
  prazo_cancelamento_com_multa: 15,
  prazo_cancelamento_sem_multa_adicional: 30,
  prazo_confirmacao_entrada: 3,
  prazo_maximo_remarcacao: 6,
  tolerancia_encerramento: 30,
  titular_conta: "",
  valor_hora_extra: null as number | null,
});

export const parseTenantContractTemplateParams = (value: unknown) => {
  const defaults = defaultTemplateParams();
  if (!value || typeof value !== "object") return defaults;

  const raw = value as Record<string, unknown>;
  const readNumber = (key: keyof ReturnType<typeof defaultTemplateParams>) => {
    const parsed = Number(raw[key]);
    return Number.isFinite(parsed) ? parsed : defaults[key];
  };
  const readString = (key: keyof ReturnType<typeof defaultTemplateParams>) =>
    typeof raw[key] === "string" ? (raw[key] as string) : defaults[key];

  return {
    agencia: readString("agencia"),
    banco: readString("banco"),
    capacidade_maxima_espaco: readNumber("capacidade_maxima_espaco"),
    chave_pix: readString("chave_pix"),
    comarca_foro: readString("comarca_foro"),
    conta: readString("conta"),
    idade_cobranca_convidado_extra: readNumber("idade_cobranca_convidado_extra"),
    percentual_multa_cancelamento: readNumber("percentual_multa_cancelamento"),
    prazo_alteracao_convidados: readNumber("prazo_alteracao_convidados"),
    prazo_cancelamento_com_multa: readNumber("prazo_cancelamento_com_multa"),
    prazo_cancelamento_sem_multa_adicional: readNumber("prazo_cancelamento_sem_multa_adicional"),
    prazo_confirmacao_entrada: readNumber("prazo_confirmacao_entrada"),
    prazo_maximo_remarcacao: readNumber("prazo_maximo_remarcacao"),
    tolerancia_encerramento: readNumber("tolerancia_encerramento"),
    titular_conta: readString("titular_conta"),
    valor_hora_extra: readNumber("valor_hora_extra"),
  };
};

const formatCompanyAddress = (profile: Record<string, unknown> | null): string => {
  if (!profile) return EMPTY_PLACEHOLDER;

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 8) return value;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const parts = [
    profile.address_street,
    profile.address_number,
    profile.address_complement,
    profile.address_neighborhood,
    profile.address_city,
    profile.address_state,
    typeof profile.address_cep === "string" ? formatCep(profile.address_cep) : null,
  ].filter((part) => typeof part === "string" && part.trim());

  return parts.length > 0 ? parts.join(", ") : EMPTY_PLACEHOLDER;
};

const formatCnpj = (value: string | null | undefined): string => {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length !== 14) return value?.trim() || EMPTY_PLACEHOLDER;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
};

const formatCpf = (value: string | null | undefined): string => {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length !== 11) return value?.trim() || EMPTY_PLACEHOLDER;
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
};

const buildContratadaClause = (profile: Record<string, unknown> | null): string => {
  const companyName = (profile?.company_name as string | undefined)?.trim() || EMPTY_PLACEHOLDER;
  const cnpj = formatCnpj(profile?.cnpj as string | undefined);
  const address = formatCompanyAddress(profile);
  const representativeName =
    (profile?.legal_representative_name as string | undefined)?.trim() || EMPTY_PLACEHOLDER;
  const representativeCpf = formatCpf(profile?.legal_representative_cpf as string | undefined);

  return `${companyName}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${cnpj}, com sede na ${address}, neste ato representada por ${representativeName}, CPF nº ${representativeCpf}, doravante denominada CONTRATADA`;
};

export interface BuildEventoContractInput {
  acceptanceResponses: Record<string, boolean>;
  acceptanceTerms: AcceptanceTermLike[];
  closingFields: Array<{ fieldKey: string | null; id: number; label: string }>;
  closingResponses: Record<string, string>;
  companyProfile: Record<string, unknown> | null;
  contractNumber: string;
  evento: Record<string, unknown>;
  financialSettings: Record<string, unknown> | null;
  packageRow: Record<string, unknown> | null;
  templateHtml: string;
  templateKey?: ContractTemplateKey | null;
  templateParams: ReturnType<typeof parseTenantContractTemplateParams>;
}

const buildAceitesSnapshot = (
  terms: AcceptanceTermLike[],
  responses: Record<string, boolean>,
): ContractSnapshotTerm[] =>
  terms
    .filter((term) => term.active && term.appearsInContract && term.showInForm)
    .sort((a, b) => a.id - b.id)
    .map((term) => ({
      accepted: responses[String(term.id)] ?? false,
      content: term.content,
      termId: term.id,
      termKey: term.termKey,
      title: term.title,
    }));

export const buildEventoContract = async (input: BuildEventoContractInput) => {
  const { evento } = input;
  const adicionais = parseAdicionaisSnapshot(evento.adicionais_snapshot);
  const aceites = buildAceitesSnapshot(input.acceptanceTerms, input.acceptanceResponses);

  const customFields: Record<string, string> = {};
  input.closingFields.forEach((field) => {
    if (field.fieldKey) return;
    const value = input.closingResponses[String(field.id)];
    if (value) customFields[field.label] = value;
  });

  const includedItems = input.packageRow
    ? parsePackageItems(input.packageRow.included_items)
    : [];
  const excludedItems = input.packageRow
    ? parsePackageItems(input.packageRow.excluded_items)
    : [];

  const cancellationPolicy =
    typeof input.financialSettings?.cancellation_policy === "string"
      ? input.financialSettings.cancellation_policy
      : null;
  const reschedulingPolicy =
    typeof input.financialSettings?.rescheduling_policy === "string"
      ? input.financialSettings.rescheduling_policy
      : null;

  const clientAddress = formatAddress(evento);
  const clientName = (evento.cliente_nome as string | null) ?? EMPTY_PLACEHOLDER;
  const clientCpf = formatCpf(evento.cliente_cpf as string | null);
  const clientPhone = formatBrazilPhone(evento.cliente_telefone as string | null) || EMPTY_PLACEHOLDER;
  const clientEmail = (evento.cliente_email as string | null) ?? EMPTY_PLACEHOLDER;
  const profile = input.companyProfile;
  const params = input.templateParams;
  const pacoteNome = (evento.pacote_nome as string | null) ?? EMPTY_PLACEHOLDER;
  const convidadosInclusos =
    evento.pacote_convidados_inclusos != null
      ? String(evento.pacote_convidados_inclusos)
      : evento.quantidade_convidados != null
        ? String(evento.quantidade_convidados)
        : EMPTY_PLACEHOLDER;
  const duracaoServicosEquipe =
    input.packageRow?.duration_minutes != null
      ? String(Math.round(Number(input.packageRow.duration_minutes) / 60))
      : EMPTY_PLACEHOLDER;
  const guestCountForExtraPrice =
    evento.pacote_convidados_inclusos != null
      ? Number(evento.pacote_convidados_inclusos)
      : input.packageRow?.included_guests != null
        ? Number(input.packageRow.included_guests)
        : evento.quantidade_convidados != null
          ? Number(evento.quantidade_convidados)
          : null;
  const pacoteValue = evento.valor_pacote != null ? Number(evento.valor_pacote) : null;
  const valorConvidadoExtra =
    pacoteValue != null &&
    guestCountForExtraPrice != null &&
    guestCountForExtraPrice > 0 &&
    Number.isFinite(pacoteValue)
      ? formatCurrency(Math.round((pacoteValue / guestCountForExtraPrice) * 100) / 100)
      : EMPTY_PLACEHOLDER;
  const horarioInicio = formatTime(evento.hora_evento as string);
  const horaTerminoResolvida = resolveEventoHoraTerminoValue(evento.hora_termino, {
    packageRow: input.packageRow,
    templateKey: input.templateKey ?? null,
  });
  const horarioTermino = formatTime(horaTerminoResolvida);
  const duracaoEvento =
    horarioInicio !== EMPTY_PLACEHOLDER && horarioTermino !== EMPTY_PLACEHOLDER
      ? `${horarioInicio} às ${horarioTermino}`
      : EMPTY_PLACEHOLDER;
  const itensPacoteAnexo = includedItems.length
    ? includedItems.map((item) => `- ${item}`).join("\n")
    : pacoteNome !== EMPTY_PLACEHOLDER
      ? `Pacote: ${pacoteNome}`
      : EMPTY_PLACEHOLDER;

  const prazoSaldo =
    input.financialSettings?.remaining_due_days_before_event != null
      ? String(input.financialSettings.remaining_due_days_before_event)
      : input.financialSettings?.max_balance_due_days != null
        ? String(input.financialSettings.max_balance_due_days)
        : EMPTY_PLACEHOLDER;

  const placeholders: Record<string, string> = {
    aceites: formatAceitesBlock(aceites),
    adicionais_contratados: formatAdditionalsBlock(adicionais),
    autoriza_uso_imagem: aceites.find((term) => term.termKey === "uso_imagem")
      ? aceites.find((term) => term.termKey === "uso_imagem")!.accepted
        ? "Autorizo"
        : "Não autorizo"
      : EMPTY_PLACEHOLDER,
    agencia: params.agencia.trim() || EMPTY_PLACEHOLDER,
    aniversariante_data_nascimento: formatDate(evento.aniversariante_data_nascimento as string),
    aniversariante_nome: (evento.aniversariante_nome as string) ?? EMPTY_PLACEHOLDER,
    aniversariante_tema: (evento.aniversariante_tema as string) ?? EMPTY_PLACEHOLDER,
    banco: params.banco.trim() || EMPTY_PLACEHOLDER,
    capacidade_maxima_espaco:
      params.capacidade_maxima_espaco != null
        ? String(params.capacidade_maxima_espaco)
        : EMPTY_PLACEHOLDER,
    celular_locatario: clientPhone,
    chave_pix: params.chave_pix.trim() || EMPTY_PLACEHOLDER,
    cidade_contrato: params.comarca_foro.trim() || (profile?.address_city as string) || EMPTY_PLACEHOLDER,
    cliente_cpf: clientCpf,
    cliente_email: clientEmail,
    cliente_endereco: clientAddress,
    cliente_nome: clientName,
    cliente_telefone: clientPhone,
    cnpj_espaco: formatCnpj(profile?.cnpj as string | undefined),
    comarca_foro: params.comarca_foro.trim() || (profile?.address_city as string) || EMPTY_PLACEHOLDER,
    conta: params.conta.trim() || EMPTY_PLACEHOLDER,
    contract_number: input.contractNumber,
    contratada: buildContratadaClause(profile),
    cpf_contratante: clientCpf,
    cpf_locatario: clientCpf,
    cpf_representante_espaco: formatCpf(profile?.legal_representative_cpf as string | undefined),
    data_contrato: new Date().toLocaleDateString("pt-BR"),
    data_evento: formatDate(evento.data_evento as string),
    data_limite_pagamento: formatDate(evento.data_limite_pagamento as string),
    duracao_evento: duracaoEvento,
    duracao_servicos_equipe: duracaoServicosEquipe,
    email_contratante: clientEmail,
    email_locatario: clientEmail,
    endereco_completo_contratante: clientAddress,
    endereco_completo_espaco: formatCompanyAddress(profile),
    endereco_completo_locatario: clientAddress,
    forma_pagamento:
      (evento.forma_pagamento_saldo as string) ??
      (evento.forma_pagamento_entrada as string) ??
      EMPTY_PLACEHOLDER,
    forma_pagamento_entrada: (evento.forma_pagamento_entrada as string) ?? EMPTY_PLACEHOLDER,
    forma_pagamento_saldo: (evento.forma_pagamento_saldo as string) ?? EMPTY_PLACEHOLDER,
    hora_evento: horarioInicio,
    horario_inicio: horarioInicio,
    horario_termino: horarioTermino,
    idade_cobranca_convidado_extra:
      params.idade_cobranca_convidado_extra != null
        ? String(params.idade_cobranca_convidado_extra)
        : EMPTY_PLACEHOLDER,
    itens_inclusos: includedItems.length ? includedItems.join("\n") : EMPTY_PLACEHOLDER,
    itens_nao_inclusos: excludedItems.length ? excludedItems.join("\n") : EMPTY_PLACEHOLDER,
    itens_pacote_anexo: itensPacoteAnexo,
    nome_aniversariante_ou_evento: (evento.aniversariante_nome as string) ?? EMPTY_PLACEHOLDER,
    nome_contratante: clientName,
    nome_espaco: (profile?.company_name as string)?.trim() || EMPTY_PLACEHOLDER,
    nome_locatario: clientName,
    nome_pacote: pacoteNome,
    nome_representante_espaco: (profile?.legal_representative_name as string)?.trim() || EMPTY_PLACEHOLDER,
    numero_pessoas:
      evento.quantidade_convidados != null ? String(evento.quantidade_convidados) : EMPTY_PLACEHOLDER,
    observacoes: (evento.observacoes as string) ?? EMPTY_PLACEHOLDER,
    observacoes_festa: (evento.observacoes_festa as string) ?? EMPTY_PLACEHOLDER,
    pacote_convidados_inclusos: convidadosInclusos,
    pacote_escolhido: pacoteNome,
    pacote_nome: pacoteNome,
    parcelas: evento.parcelas != null ? String(evento.parcelas) : EMPTY_PLACEHOLDER,
    percentual_multa_cancelamento:
      params.percentual_multa_cancelamento != null
        ? String(params.percentual_multa_cancelamento)
        : EMPTY_PLACEHOLDER,
    politica_cancelamento: cancellationPolicy?.trim()
      ? stripHtmlToText(cancellationPolicy)
      : "Conforme política do espaço.",
    politica_remarcacao: reschedulingPolicy?.trim()
      ? stripHtmlToText(reschedulingPolicy)
      : "Conforme política do espaço.",
    prazo_alteracao_convidados:
      params.prazo_alteracao_convidados != null
        ? String(params.prazo_alteracao_convidados)
        : EMPTY_PLACEHOLDER,
    prazo_cancelamento_com_multa:
      params.prazo_cancelamento_com_multa != null
        ? String(params.prazo_cancelamento_com_multa)
        : EMPTY_PLACEHOLDER,
    prazo_cancelamento_sem_multa_adicional:
      params.prazo_cancelamento_sem_multa_adicional != null
        ? String(params.prazo_cancelamento_sem_multa_adicional)
        : EMPTY_PLACEHOLDER,
    prazo_confirmacao_entrada:
      params.prazo_confirmacao_entrada != null
        ? String(params.prazo_confirmacao_entrada)
        : EMPTY_PLACEHOLDER,
    prazo_maximo_remarcacao:
      params.prazo_maximo_remarcacao != null
        ? String(params.prazo_maximo_remarcacao)
        : EMPTY_PLACEHOLDER,
    prazo_pagamento_saldo: prazoSaldo,
    quantidade_adultos:
      evento.quantidade_adultos != null ? String(evento.quantidade_adultos) : EMPTY_PLACEHOLDER,
    quantidade_convidados:
      evento.quantidade_convidados != null ? String(evento.quantidade_convidados) : EMPTY_PLACEHOLDER,
    quantidade_convidados_inclusa: convidadosInclusos,
    quantidade_crianas:
      evento.quantidade_crianas != null ? String(evento.quantidade_crianas) : EMPTY_PLACEHOLDER,
    telefone_contratante: clientPhone,
    tema_decoracao: (evento.aniversariante_tema as string) ?? EMPTY_PLACEHOLDER,
    tipo_evento: (evento.tipo_evento as string) ?? EMPTY_PLACEHOLDER,
    titular_conta: params.titular_conta.trim() || (profile?.company_name as string) || EMPTY_PLACEHOLDER,
    tolerancia_encerramento:
      params.tolerancia_encerramento != null
        ? String(params.tolerancia_encerramento)
        : EMPTY_PLACEHOLDER,
    valor_adicionais: formatCurrency(evento.valor_adicionais as number),
    valor_convidado_extra: valorConvidadoExtra,
    valor_entrada: formatCurrency(evento.valor_entrada as number),
    valor_hora_extra: formatCurrency(params.valor_hora_extra),
    valor_pacote: formatCurrency(evento.valor_pacote as number),
    valor_saldo: formatCurrency(evento.valor_saldo as number),
    valor_total: formatCurrency(evento.valor_total as number),
    valor_total_contrato: formatCurrency(evento.valor_total as number),
  };

  const contractSnapshot = {
    aceites,
    adicionais,
    customFields,
    evento,
    financial: {
      cancellationPolicy,
      reschedulingPolicy,
    },
    generatedAt: new Date().toISOString(),
    package: evento.pacote_nome
      ? {
          excludedItems,
          includedGuests: evento.pacote_convidados_inclusos ?? null,
          includedItems,
          name: evento.pacote_nome,
        }
      : null,
  };

  const contractHtml = applyPlaceholders(input.templateHtml, placeholders);
  const contractText = stripHtmlToText(contractHtml);
  const contractHash = await hashContractContent(contractHtml);

  return {
    contractHash,
    contractHtml,
    contractSnapshot,
    contractText,
  };
};

export const CONTRACT_ACCEPTANCE_DECLARATION =
  "Declaro que li integralmente o contrato acima, compreendi todas as cláusulas, valores, condições de pagamento, políticas de cancelamento e remarcação, e concordo com os termos estabelecidos.";
