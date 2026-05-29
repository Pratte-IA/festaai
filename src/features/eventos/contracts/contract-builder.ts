import type { ClosingFormField } from "@/features/configuracoes/closing-form-types";
import type { FinancialSettings } from "@/features/configuracoes/financial-settings-types";
import type { TenantAcceptanceTerm } from "@/features/configuracoes/acceptance-term-types";
import type { Evento } from "@/features/eventos/types";
import { parsePackageItems } from "@/data/packagesData";
import type { PackageData } from "@/data/packagesData";

import { parseAdicionaisSnapshot } from "../closing-form-runtime";
import { hashContractContent } from "./contract-hash";
import {
  EMPTY_PLACEHOLDER,
  type ContractSnapshot,
  type ContractSnapshotTerm,
} from "./contract-types";

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

const formatAddress = (evento: Evento): string => {
  const parts = [
    evento.cliente_rua,
    evento.cliente_numero,
    evento.cliente_bairro,
    evento.cliente_cidade,
    evento.cliente_estado,
    evento.cliente_cep,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : EMPTY_PLACEHOLDER;
};

const stripHtmlToText = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export interface ContractBuildInput {
  acceptanceResponses: Record<string, boolean>;
  acceptanceTerms: TenantAcceptanceTerm[];
  closingFields: ClosingFormField[];
  closingResponses: Record<string, string>;
  contractNumber: string;
  evento: Evento;
  financialSettings: FinancialSettings;
  packageData: PackageData | null;
  templateHtml: string;
}

export interface ContractBuildResult {
  contractHash: string;
  contractHtml: string;
  contractSnapshot: ContractSnapshot;
  contractText: string;
}

const buildAceitesSnapshot = (
  terms: TenantAcceptanceTerm[],
  responses: Record<string, boolean>,
): ContractSnapshotTerm[] =>
  terms
    .filter((term) => term.active && term.appearsInContract)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((term) => ({
      accepted: responses[term.id] ?? false,
      content: term.content,
      termId: Number(term.id),
      title: term.title,
    }));

const formatAceitesBlock = (aceites: ContractSnapshotTerm[]): string => {
  if (aceites.length === 0) return "Nenhum termo configurado.";

  return aceites
    .map((term) => {
      const status = term.accepted ? "[Aceito]" : "[Pendente]";
      return `${status} ${term.title}\n${term.content}`;
    })
    .join("\n\n");
};

const formatAdditionalsBlock = (snapshot: ReturnType<typeof parseAdicionaisSnapshot>): string => {
  if (snapshot.length === 0) return "Nenhum adicional contratado.";

  return snapshot
    .map(
      (item) =>
        `- ${item.name} (${item.quantity}x) — ${formatCurrency(item.subtotal)} [${item.category}]`,
    )
    .join("\n");
};

export const buildContractSnapshot = (input: ContractBuildInput): ContractSnapshot => {
  const adicionais = parseAdicionaisSnapshot(input.evento.adicionais_snapshot);
  const aceites = buildAceitesSnapshot(input.acceptanceTerms, input.acceptanceResponses);

  const customFields: Record<string, string> = {};
  input.closingFields.forEach((field) => {
    if (field.fieldKey) return;
    const value = input.closingResponses[field.id];
    if (value) customFields[field.label] = value;
  });

  const includedItems =
    input.packageData?.includedItems ??
    parsePackageItems(
      (input.evento as Record<string, unknown>).included_items as unknown,
    );

  const excludedItems =
    input.packageData?.excludedItems ??
    parsePackageItems(
      (input.evento as Record<string, unknown>).excluded_items as unknown,
    );

  return {
    aceites,
    adicionais,
    customFields,
    evento: {
      aniversariante_data_nascimento: input.evento.aniversariante_data_nascimento,
      aniversariante_nome: input.evento.aniversariante_nome,
      aniversariante_tema: input.evento.aniversariante_tema,
      cliente_cpf: input.evento.cliente_cpf,
      cliente_email: input.evento.cliente_email,
      cliente_nome: input.evento.cliente_nome,
      cliente_telefone: input.evento.cliente_telefone,
      data_evento: input.evento.data_evento,
      forma_pagamento_entrada: input.evento.forma_pagamento_entrada,
      forma_pagamento_saldo: input.evento.forma_pagamento_saldo,
      hora_evento: input.evento.hora_evento,
      hora_termino: input.evento.hora_termino,
      observacoes: input.evento.observacoes,
      observacoes_festa: input.evento.observacoes_festa,
      pacote_nome: input.evento.pacote_nome,
      parcelas: input.evento.parcelas,
      quantidade_adultos: input.evento.quantidade_adultos,
      quantidade_convidados: input.evento.quantidade_convidados,
      quantidade_crianas: input.evento.quantidade_crianas,
      valor_adicionais: input.evento.valor_adicionais,
      valor_entrada: input.evento.valor_entrada,
      valor_pacote: input.evento.valor_pacote,
      valor_saldo: input.evento.valor_saldo,
      valor_total: input.evento.valor_total,
    },
    financial: {
      cancellationPolicy: input.financialSettings.cancellation_policy,
      reschedulingPolicy: input.financialSettings.rescheduling_policy,
    },
    generatedAt: new Date().toISOString(),
    package: input.evento.pacote_nome
      ? {
          excludedItems,
          includedGuests:
            input.evento.pacote_convidados_inclusos ?? input.packageData?.includedGuests ?? null,
          includedItems,
          name: input.evento.pacote_nome,
        }
      : null,
  };
};

export const buildPlaceholderMap = (
  input: ContractBuildInput,
  snapshot: ContractSnapshot,
): Record<string, string> => {
  const { evento } = input;

  return {
    aceites: formatAceitesBlock(snapshot.aceites),
    adicionais_contratados: formatAdditionalsBlock(snapshot.adicionais),
    aniversariante_data_nascimento: formatDate(evento.aniversariante_data_nascimento),
    aniversariante_nome: evento.aniversariante_nome ?? EMPTY_PLACEHOLDER,
    aniversariante_tema: evento.aniversariante_tema ?? EMPTY_PLACEHOLDER,
    cliente_cpf: evento.cliente_cpf ?? EMPTY_PLACEHOLDER,
    cliente_email: evento.cliente_email ?? EMPTY_PLACEHOLDER,
    cliente_endereco: formatAddress(evento),
    cliente_nome: evento.cliente_nome ?? EMPTY_PLACEHOLDER,
    cliente_telefone: evento.cliente_telefone ?? EMPTY_PLACEHOLDER,
    contract_number: input.contractNumber,
    data_evento: formatDate(evento.data_evento),
    forma_pagamento_entrada: evento.forma_pagamento_entrada ?? EMPTY_PLACEHOLDER,
    forma_pagamento_saldo: evento.forma_pagamento_saldo ?? EMPTY_PLACEHOLDER,
    hora_evento: formatTime(evento.hora_evento),
    hora_termino: formatTime(evento.hora_termino),
    itens_inclusos:
      snapshot.package?.includedItems?.length
        ? snapshot.package.includedItems.join("\n")
        : EMPTY_PLACEHOLDER,
    itens_nao_inclusos:
      snapshot.package?.excludedItems?.length
        ? snapshot.package.excludedItems.join("\n")
        : EMPTY_PLACEHOLDER,
    observacoes: evento.observacoes ?? EMPTY_PLACEHOLDER,
    observacoes_festa: evento.observacoes_festa ?? EMPTY_PLACEHOLDER,
    pacote_convidados_inclusos:
      snapshot.package?.includedGuests != null
        ? String(snapshot.package.includedGuests)
        : EMPTY_PLACEHOLDER,
    pacote_nome: evento.pacote_nome ?? EMPTY_PLACEHOLDER,
    parcelas: evento.parcelas != null ? String(evento.parcelas) : EMPTY_PLACEHOLDER,
    politica_cancelamento:
      snapshot.financial.cancellationPolicy?.trim() || "Conforme política do espaço.",
    politica_remarcacao:
      snapshot.financial.reschedulingPolicy?.trim() || "Conforme política do espaço.",
    quantidade_adultos:
      evento.quantidade_adultos != null ? String(evento.quantidade_adultos) : EMPTY_PLACEHOLDER,
    quantidade_convidados:
      evento.quantidade_convidados != null
        ? String(evento.quantidade_convidados)
        : EMPTY_PLACEHOLDER,
    quantidade_crianas:
      evento.quantidade_crianas != null ? String(evento.quantidade_crianas) : EMPTY_PLACEHOLDER,
    valor_adicionais: formatCurrency(evento.valor_adicionais),
    valor_entrada: formatCurrency(evento.valor_entrada),
    valor_pacote: formatCurrency(evento.valor_pacote),
    valor_saldo: formatCurrency(evento.valor_saldo),
    valor_total: formatCurrency(evento.valor_total),
  };
};

export const applyPlaceholders = (
  templateHtml: string,
  placeholders: Record<string, string>,
): string =>
  templateHtml.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_match, key: string) => {
    return placeholders[key.toLowerCase()] ?? EMPTY_PLACEHOLDER;
  });

export const buildContract = async (input: ContractBuildInput): Promise<ContractBuildResult> => {
  const contractSnapshot = buildContractSnapshot(input);
  const placeholders = buildPlaceholderMap(input, contractSnapshot);
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

export const buildContractNumber = (
  tenantId: number,
  eventoId: number,
  sequence: number,
  generatedAt = new Date(),
): string => {
  const datePart = generatedAt.toISOString().slice(0, 10).replace(/-/g, "");
  return `CTR-${tenantId}-${eventoId}-${datePart}-${String(sequence).padStart(2, "0")}`;
};
