export interface ContractPlaceholderGroup {
  label: string;
  placeholders: string[];
}

export const CONTRACT_TEMPLATE_PLACEHOLDER_GROUPS: ContractPlaceholderGroup[] = [
  {
    label: "Empresa (LOCADORA / CONTRATADA)",
    placeholders: [
      "nome_espaco",
      "cnpj_espaco",
      "endereco_completo_espaco",
      "nome_representante_espaco",
      "cpf_representante_espaco",
    ],
  },
  {
    label: "Cliente (LOCATÁRIO / CONTRATANTE)",
    placeholders: [
      "nome_locatario",
      "nome_contratante",
      "cpf_locatario",
      "cpf_contratante",
      "celular_locatario",
      "telefone_contratante",
      "email_locatario",
      "email_contratante",
      "endereco_completo_locatario",
      "endereco_completo_contratante",
    ],
  },
  {
    label: "Evento e pacote",
    placeholders: [
      "data_evento",
      "horario_inicio",
      "horario_termino",
      "hora_evento",
      "pacote_escolhido",
      "nome_pacote",
      "numero_pessoas",
      "quantidade_convidados",
      "quantidade_convidados_inclusa",
      "tipo_evento",
      "nome_aniversariante_ou_evento",
      "tema_decoracao",
      "itens_pacote_anexo",
    ],
  },
  {
    label: "Valores e pagamento",
    placeholders: [
      "valor_total",
      "valor_total_contrato",
      "valor_entrada",
      "valor_saldo",
      "valor_convidado_extra",
      "valor_hora_extra",
      "prazo_pagamento_saldo",
      "data_limite_pagamento",
      "forma_pagamento",
      "banco",
      "agencia",
      "conta",
      "chave_pix",
      "titular_conta",
    ],
  },
  {
    label: "Regras parametrizadas",
    placeholders: [
      "capacidade_maxima_espaco",
      "tolerancia_encerramento",
      "idade_cobranca_convidado_extra",
      "prazo_alteracao_convidados",
      "prazo_cancelamento_sem_multa_adicional",
      "prazo_cancelamento_com_multa",
      "percentual_multa_cancelamento",
      "prazo_maximo_remarcacao",
      "prazo_confirmacao_entrada",
      "politica_cancelamento",
      "politica_remarcacao",
      "comarca_foro",
      "cidade_contrato",
      "data_contrato",
    ],
  },
];

export const formatContractPlaceholder = (key: string) => `{{${key}}}`;
