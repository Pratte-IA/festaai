import type { FinancialSettings } from "@/features/configuracoes/financial-settings-types";
import { downPaymentMethodLabels } from "@/features/configuracoes/financial-settings-types";
import type { PackageData } from "@/data/packagesData";
import { packageHasBuffet } from "@/data/packagesData";
import type { Evento } from "@/features/eventos/types";
import type { TenantCompanyProfile } from "@/features/guided-setup/types";
import { formatCepDisplay, formatCnpjDisplay, formatCpfDisplay } from "@/lib/brazil-documents";

import { EMPTY_PLACEHOLDER } from "./contract-types";
import { applyPlaceholders } from "./contract-builder";

export const CONTRACT_PREVIEW_PLACEHOLDER = "[Preenchido na contratação]";

export interface TenantContractTemplateParams {
  banco: string;
  capacidade_maxima_espaco: number | null;
  chave_pix: string;
  comarca_foro: string;
  conta: string;
  idade_cobranca_convidado_extra: number | null;
  percentual_multa_cancelamento: number | null;
  prazo_alteracao_convidados: number | null;
  prazo_cancelamento_com_multa: number | null;
  prazo_cancelamento_sem_multa_adicional: number | null;
  prazo_confirmacao_entrada: number | null;
  prazo_maximo_remarcacao: number | null;
  tolerancia_encerramento: number | null;
  titular_conta: string;
  valor_convidado_extra: number | null;
  valor_hora_extra: number | null;
  agencia: string;
}

export const defaultTenantContractTemplateParams = (): TenantContractTemplateParams => ({
  agencia: "",
  banco: "",
  capacidade_maxima_espaco: null,
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
  valor_convidado_extra: null,
  valor_hora_extra: null,
});

export const parseTenantContractTemplateParams = (
  value: unknown,
): TenantContractTemplateParams => {
  const defaults = defaultTenantContractTemplateParams();
  if (!value || typeof value !== "object") return defaults;

  const raw = value as Record<string, unknown>;
  const readNumber = (key: keyof TenantContractTemplateParams) => {
    const parsed = Number(raw[key]);
    return Number.isFinite(parsed) ? parsed : defaults[key];
  };
  const readString = (key: keyof TenantContractTemplateParams) =>
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
    valor_convidado_extra: readNumber("valor_convidado_extra"),
    valor_hora_extra: readNumber("valor_hora_extra"),
  };
};

const formatCurrency = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(Number(value))) return EMPTY_PLACEHOLDER;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
};

const formatCompanyAddress = (profile: TenantCompanyProfile | null | undefined): string => {
  if (!profile) return EMPTY_PLACEHOLDER;

  const parts = [
    profile.addressStreet,
    profile.addressNumber,
    profile.addressComplement,
    profile.addressNeighborhood,
    profile.addressCity,
    profile.addressState,
    profile.addressCep ? formatCepDisplay(profile.addressCep) : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : EMPTY_PLACEHOLDER;
};

const formatBuffetBlock = (pkg: PackageData): string => {
  if (!packageHasBuffet(pkg.buffet)) {
    return "Sem buffet incluso.";
  }

  const sections = [
    pkg.buffet.salgados.length ? `Salgados: ${pkg.buffet.salgados.join(", ")}` : null,
    pkg.buffet.doces.length ? `Doces: ${pkg.buffet.doces.join(", ")}` : null,
    pkg.buffet.bolo.length ? `Bolo: ${pkg.buffet.bolo.join(", ")}` : null,
    pkg.buffet.bebidas.length ? `Bebidas: ${pkg.buffet.bebidas.join(", ")}` : null,
  ].filter(Boolean);

  return sections.length > 0 ? sections.join("\n") : "Buffet conforme pacote.";
};

const formatPackageAnnex = (pkg: PackageData | null | undefined): string => {
  if (!pkg) {
    return "Itens do pacote serão listados conforme o pacote escolhido na contratação.";
  }

  const lines = [
    `Pacote: ${pkg.name}`,
    pkg.includedGuests != null ? `Convidados inclusos: ${pkg.includedGuests}` : null,
    pkg.durationMinutes != null ? `Duração: ${Math.round(pkg.durationMinutes / 60)} hora(s)` : null,
    pkg.includedItems.length ? `Itens inclusos:\n- ${pkg.includedItems.join("\n- ")}` : null,
    pkg.estrutura.brinquedos.length
      ? `Brinquedos/estrutura:\n- ${pkg.estrutura.brinquedos.join("\n- ")}`
      : null,
    formatBuffetBlock(pkg),
    pkg.excludedItems.length ? `Não inclusos:\n- ${pkg.excludedItems.join("\n- ")}` : null,
  ].filter(Boolean);

  return lines.join("\n\n");
};

export interface BuildContractPreviewPlaceholdersInput {
  companyProfile: TenantCompanyProfile | null | undefined;
  financialSettings: FinancialSettings | null | undefined;
  packageSample: PackageData | null | undefined;
  params: TenantContractTemplateParams;
}

export const buildContractPreviewPlaceholders = (
  input: BuildContractPreviewPlaceholdersInput,
): Record<string, string> => {
  const { companyProfile, financialSettings, packageSample, params } = input;
  const prazoSaldo =
    financialSettings?.remaining_due_before_event_enabled &&
    financialSettings.remaining_due_days_before_event != null
      ? String(financialSettings.remaining_due_days_before_event)
      : financialSettings?.max_balance_due_days != null
        ? String(financialSettings.max_balance_due_days)
        : EMPTY_PLACEHOLDER;

  const formaPagamento = financialSettings
    ? downPaymentMethodLabels[financialSettings.down_payment_method]
    : EMPTY_PLACEHOLDER;

  const pacoteNome = packageSample?.name ?? CONTRACT_PREVIEW_PLACEHOLDER;
  const convidadosInclusos =
    packageSample?.includedGuests != null
      ? String(packageSample.includedGuests)
      : CONTRACT_PREVIEW_PLACEHOLDER;
  const duracaoHoras =
    packageSample?.durationMinutes != null
      ? String(Math.round(packageSample.durationMinutes / 60))
      : CONTRACT_PREVIEW_PLACEHOLDER;

  const sharedTenant = {
    agencia: params.agencia.trim() || EMPTY_PLACEHOLDER,
    banco: params.banco.trim() || EMPTY_PLACEHOLDER,
    capacidade_maxima_espaco:
      params.capacidade_maxima_espaco != null
        ? String(params.capacidade_maxima_espaco)
        : EMPTY_PLACEHOLDER,
    chave_pix: params.chave_pix.trim() || EMPTY_PLACEHOLDER,
    cidade_contrato: params.comarca_foro.trim() || companyProfile?.addressCity || EMPTY_PLACEHOLDER,
    cnpj_espaco: formatCnpjDisplay(companyProfile?.cnpj) || EMPTY_PLACEHOLDER,
    comarca_foro: params.comarca_foro.trim() || companyProfile?.addressCity || EMPTY_PLACEHOLDER,
    conta: params.conta.trim() || EMPTY_PLACEHOLDER,
    cpf_representante_espaco:
      formatCpfDisplay(companyProfile?.legalRepresentativeCpf) || EMPTY_PLACEHOLDER,
    data_contrato: new Date().toLocaleDateString("pt-BR"),
    endereco_completo_espaco: formatCompanyAddress(companyProfile),
    forma_pagamento: formaPagamento,
    idade_cobranca_convidado_extra:
      params.idade_cobranca_convidado_extra != null
        ? String(params.idade_cobranca_convidado_extra)
        : EMPTY_PLACEHOLDER,
    itens_pacote_anexo: formatPackageAnnex(packageSample),
    nome_espaco: companyProfile?.companyName?.trim() || EMPTY_PLACEHOLDER,
    nome_representante_espaco:
      companyProfile?.legalRepresentativeName?.trim() || EMPTY_PLACEHOLDER,
    percentual_multa_cancelamento:
      params.percentual_multa_cancelamento != null
        ? String(params.percentual_multa_cancelamento)
        : EMPTY_PLACEHOLDER,
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
    titular_conta: params.titular_conta.trim() || companyProfile?.companyName || EMPTY_PLACEHOLDER,
    tolerancia_encerramento:
      params.tolerancia_encerramento != null
        ? String(params.tolerancia_encerramento)
        : EMPTY_PLACEHOLDER,
    valor_convidado_extra: formatCurrency(params.valor_convidado_extra),
    valor_hora_extra: formatCurrency(params.valor_hora_extra),
  };

  const sharedEventPreview = {
    autoriza_uso_imagem: "Conforme escolha do contratante",
    celular_locatario: CONTRACT_PREVIEW_PLACEHOLDER,
    contract_number: "CTR-PREVISUALIZACAO",
    cpf_contratante: CONTRACT_PREVIEW_PLACEHOLDER,
    cpf_locatario: CONTRACT_PREVIEW_PLACEHOLDER,
    data_evento: CONTRACT_PREVIEW_PLACEHOLDER,
    data_limite_pagamento: CONTRACT_PREVIEW_PLACEHOLDER,
    duracao_evento: CONTRACT_PREVIEW_PLACEHOLDER,
    duracao_servicos_equipe: duracaoHoras,
    email_contratante: CONTRACT_PREVIEW_PLACEHOLDER,
    email_locatario: CONTRACT_PREVIEW_PLACEHOLDER,
    endereco_completo_contratante: CONTRACT_PREVIEW_PLACEHOLDER,
    endereco_completo_locatario: CONTRACT_PREVIEW_PLACEHOLDER,
    hora_evento: CONTRACT_PREVIEW_PLACEHOLDER,
    horario_inicio: CONTRACT_PREVIEW_PLACEHOLDER,
    horario_termino: CONTRACT_PREVIEW_PLACEHOLDER,
    nome_aniversariante_ou_evento: CONTRACT_PREVIEW_PLACEHOLDER,
    nome_contratante: CONTRACT_PREVIEW_PLACEHOLDER,
    nome_locatario: CONTRACT_PREVIEW_PLACEHOLDER,
    nome_pacote: pacoteNome,
    numero_pessoas: convidadosInclusos,
    pacote_escolhido: pacoteNome,
    quantidade_convidados: convidadosInclusos,
    quantidade_convidados_inclusa: convidadosInclusos,
    telefone_contratante: CONTRACT_PREVIEW_PLACEHOLDER,
    tema_decoracao: CONTRACT_PREVIEW_PLACEHOLDER,
    tipo_evento: CONTRACT_PREVIEW_PLACEHOLDER,
    valor_entrada: CONTRACT_PREVIEW_PLACEHOLDER,
    valor_saldo: CONTRACT_PREVIEW_PLACEHOLDER,
    valor_total: CONTRACT_PREVIEW_PLACEHOLDER,
    valor_total_contrato: CONTRACT_PREVIEW_PLACEHOLDER,
  };

  return {
    ...sharedTenant,
    ...sharedEventPreview,
    cliente_cpf: CONTRACT_PREVIEW_PLACEHOLDER,
    cliente_email: CONTRACT_PREVIEW_PLACEHOLDER,
    cliente_endereco: CONTRACT_PREVIEW_PLACEHOLDER,
    cliente_nome: CONTRACT_PREVIEW_PLACEHOLDER,
    cliente_telefone: CONTRACT_PREVIEW_PLACEHOLDER,
    pacote_nome: pacoteNome,
    politica_cancelamento:
      financialSettings?.cancellation_policy?.trim() || "Conforme política comercial do espaço.",
    politica_remarcacao:
      financialSettings?.rescheduling_policy?.trim() || "Conforme política comercial do espaço.",
  };
};

export const renderContractTemplatePreview = (
  templateHtml: string,
  input: BuildContractPreviewPlaceholdersInput,
): string => applyPlaceholders(templateHtml, buildContractPreviewPlaceholders(input));

const formatEventAddress = (evento: Evento): string => {
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

const formatTime = (value: string | null | undefined) => {
  if (!value) return EMPTY_PLACEHOLDER;
  return value.slice(0, 5);
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return EMPTY_PLACEHOLDER;
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
};

export interface BuildContractTenantPlaceholdersInput {
  companyProfile: TenantCompanyProfile | null | undefined;
  evento: Evento;
  financialSettings: FinancialSettings | null | undefined;
  packageData: PackageData | null | undefined;
  params: TenantContractTemplateParams;
}

export const buildContractTenantPlaceholders = (
  input: BuildContractTenantPlaceholdersInput,
): Record<string, string> => {
  const preview = buildContractPreviewPlaceholders({
    companyProfile: input.companyProfile,
    financialSettings: input.financialSettings,
    packageSample: input.packageData,
    params: input.params,
  });

  const { evento } = input;
  const clientAddress = formatEventAddress(evento);
  const clientName = evento.cliente_nome ?? EMPTY_PLACEHOLDER;
  const clientCpf = evento.cliente_cpf ?? EMPTY_PLACEHOLDER;

  return {
    ...preview,
    celular_locatario: evento.cliente_telefone ?? EMPTY_PLACEHOLDER,
    cpf_contratante: clientCpf,
    cpf_locatario: clientCpf,
    data_evento: formatDate(evento.data_evento),
    duracao_evento:
      evento.hora_evento && evento.hora_termino
        ? `${formatTime(evento.hora_evento)} às ${formatTime(evento.hora_termino)}`
        : EMPTY_PLACEHOLDER,
    email_contratante: evento.cliente_email ?? EMPTY_PLACEHOLDER,
    email_locatario: evento.cliente_email ?? EMPTY_PLACEHOLDER,
    endereco_completo_contratante: clientAddress,
    endereco_completo_locatario: clientAddress,
    hora_evento: formatTime(evento.hora_evento),
    horario_inicio: formatTime(evento.hora_evento),
    horario_termino: formatTime(evento.hora_termino),
    nome_aniversariante_ou_evento: evento.aniversariante_nome ?? EMPTY_PLACEHOLDER,
    nome_contratante: clientName,
    nome_locatario: clientName,
    nome_pacote: evento.pacote_nome ?? preview.nome_pacote,
    numero_pessoas:
      evento.quantidade_convidados != null
        ? String(evento.quantidade_convidados)
        : preview.numero_pessoas,
    pacote_escolhido: evento.pacote_nome ?? preview.pacote_escolhido,
    pacote_nome: evento.pacote_nome ?? preview.pacote_nome,
    quantidade_convidados:
      evento.quantidade_convidados != null
        ? String(evento.quantidade_convidados)
        : preview.quantidade_convidados,
    quantidade_convidados_inclusa:
      evento.pacote_convidados_inclusos != null
        ? String(evento.pacote_convidados_inclusos)
        : preview.quantidade_convidados_inclusa,
    telefone_contratante: evento.cliente_telefone ?? EMPTY_PLACEHOLDER,
    tema_decoracao: evento.aniversariante_tema ?? EMPTY_PLACEHOLDER,
    tipo_evento: evento.tipo_evento ?? EMPTY_PLACEHOLDER,
    valor_entrada: formatCurrency(evento.valor_entrada),
    valor_saldo: formatCurrency(evento.valor_saldo),
    valor_total: formatCurrency(evento.valor_total),
    valor_total_contrato: formatCurrency(evento.valor_total),
    cliente_cpf: clientCpf,
    cliente_email: evento.cliente_email ?? EMPTY_PLACEHOLDER,
    cliente_endereco: clientAddress,
    cliente_nome: clientName,
    cliente_telefone: evento.cliente_telefone ?? EMPTY_PLACEHOLDER,
  };
};

export const validateTenantContractTemplateParams = (
  params: TenantContractTemplateParams,
): string | null => {
  if (params.capacidade_maxima_espaco == null || params.capacidade_maxima_espaco <= 0) {
    return "Informe a capacidade máxima do espaço.";
  }

  if (!params.chave_pix.trim() && !params.banco.trim()) {
    return "Informe ao menos a chave Pix ou os dados bancários.";
  }

  if (params.valor_hora_extra == null || params.valor_hora_extra <= 0) {
    return "Informe o valor da hora extra.";
  }

  if (!params.comarca_foro.trim()) {
    return "Informe a comarca do foro.";
  }

  return null;
};
