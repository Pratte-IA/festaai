export const COMMERCIAL_CONTRACT_VERSION = "2025-06-30";
export const PRIVACY_POLICY_VERSION = "2025-06-30";

export const COMMERCIAL_CONTACT = {
  email: "contato@festaai.com.br",
  whatsapp: "(45) 99943-8936",
} as const;

export const CONTRACTED_PARTY = {
  cnpj: "11.568.297/0001-02",
  companyName: "Agência Roda Gigante Ltda",
  address: "Rua Presidente Kennedy, 648, Sala 02 — Centro, Cascavel/PR, CEP 85.810-040",
} as const;

export interface CommercialSnapshot {
  basePlanSlug: string;
  commercialOfferId?: number | null;
  commercialOfferToken?: string | null;
  conditionName: string;
  contractReferenceId: string;
  loyaltyMonths: number | null;
  maxSetupInstallments?: number | null;
  monthlyPrice: number;
  setupInstallments: number | null;
  setupPrice: number;
  subscriptionMaxPayments: number | null;
}

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const buildCommercialAnnex = (snapshot: CommercialSnapshot): string => {
  const maxInstallments = snapshot.maxSetupInstallments ?? snapshot.setupInstallments ?? 1;
  const setupInstallmentText =
    snapshot.setupInstallments && snapshot.setupInstallments > 1
      ? `${snapshot.setupInstallments}x de ${formatBRL(snapshot.setupPrice / snapshot.setupInstallments)}`
      : maxInstallments > 1
        ? `Em até ${maxInstallments}x no cartão (valor total ${formatBRL(snapshot.setupPrice)})`
        : "Pagamento à vista";

  const monthlyText =
    snapshot.subscriptionMaxPayments != null
      ? `${snapshot.subscriptionMaxPayments}x de ${formatBRL(snapshot.monthlyPrice)} (total ${formatBRL(snapshot.monthlyPrice * snapshot.subscriptionMaxPayments)})`
      : `${formatBRL(snapshot.monthlyPrice)}/mês (renovação mensal)`;

  const loyaltyText =
    snapshot.loyaltyMonths && snapshot.loyaltyMonths > 0
      ? `${snapshot.loyaltyMonths} meses`
      : "Não há";

  return [
    "ANEXO COMERCIAL — CONDIÇÃO CONTRATADA",
    "",
    `Identificador da contratação: ${snapshot.contractReferenceId}`,
    `Condição comercial: ${snapshot.conditionName}`,
    `Plano base: ${snapshot.basePlanSlug}`,
    snapshot.commercialOfferToken ? `Proposta exclusiva: ${snapshot.commercialOfferToken}` : null,
    "",
    `Setup: ${formatBRL(snapshot.setupPrice)}`,
    `Forma do setup: ${setupInstallmentText}`,
    `Mensalidade: ${monthlyText}`,
    `Fidelidade: ${loyaltyText}`,
    "",
    "Este Anexo integra o Contrato de Licença de Uso de Software, Implantação e Serviços Digitais — FestaAI.",
  ]
    .filter(Boolean)
    .join("\n");
};

export const ACCEPTANCE_DECLARATION =
  "Declaro que li integralmente o contrato e a política de privacidade, compreendi todas as cláusulas, aceito a condição comercial descrita no Anexo Comercial e concordo com os termos estabelecidos.";

export const buildCommercialContractBody = (privacyPolicyUrl: string): string =>
  [
    "CONTRATO DE LICENÇA DE USO DE SOFTWARE, IMPLANTAÇÃO E SERVIÇOS DIGITAIS — FESTAAI",
    "",
    "Pelo presente instrumento eletrônico, de um lado:",
    "",
    `CONTRATADA: ${CONTRACTED_PARTY.companyName}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${CONTRACTED_PARTY.cnpj}, com sede em ${CONTRACTED_PARTY.address}, doravante denominada CONTRATADA ou FestaAI.`,
    "",
    "E, de outro lado:",
    "",
    "CONTRATANTE: pessoa física ou jurídica identificada no cadastro de contratação da plataforma, doravante denominada CONTRATANTE.",
    "",
    "As partes resolvem celebrar o presente Contrato de Licença de Uso de Software, Implantação e Serviços Digitais, mediante as cláusulas seguintes.",
    "",
    "1. Objeto",
    "1.1. Concessão de licença de uso temporária, não exclusiva, pessoal, intransferível e revogável da plataforma FestaAI para organização comercial e operacional de casas de festas.",
    "1.2. Serviço de implantação inicial, configuração básica da conta, parametrização inicial e configuração inicial do agente FestaAI.",
    "1.3. Modelo SaaS mediante pagamento de setup e mensalidade recorrente.",
    "1.4. Não implica cessão de propriedade intelectual, código-fonte, infraestrutura, banco de dados, automações, prompts, agentes ou documentação técnica.",
    "",
    "2. Plataforma padrão e configuração personalizada",
    "2.1. A plataforma possui base padrão configurável conforme informações da CONTRATANTE.",
    "2.2. A configuração inicial do agente FestaAI está inclusa no setup contratado.",
    "2.3. A CONTRATANTE é responsável pela veracidade e atualização das informações fornecidas.",
    "2.4. A CONTRATADA não se responsabiliza por falhas decorrentes de informações incorretas ou incompletas fornecidas pela CONTRATANTE.",
    "",
    "3. Condição comercial contratada",
    "3.1. A CONTRATANTE escolhe condição comercial na página de contratação ou proposta exclusiva enviada pela CONTRATADA.",
    "3.2. Prevalece a condição explicitamente exibida e selecionada no momento da contratação, conforme Anexo Comercial gerado eletronicamente no aceite.",
    "3.3. Condições padrão de referência: À Vista (setup R$ 2.200, mensalidade R$ 750, sem fidelidade); Parcelada (setup R$ 2.500 em até 6x no cartão, mensalidade R$ 750); Fidelidade (setup R$ 2.000 em até 6x, mensalidade R$ 650 em 12 parcelas fixas, fidelidade 12 meses).",
    "3.4. Propostas exclusivas prevalecem sobre condições padrão quando houver divergência.",
    "3.5. Todos os modelos incluem a mesma plataforma FestaAI e agente padrão configurável.",
    "3.6. Valores podem ser alterados para novas contratações, sem afetar contratos já firmados.",
    "3.7. Tributos, taxas bancárias e tarifas de meios de pagamento poderão ser repassados quando aplicável e informado previamente.",
    "3.8. Reajuste anual da mensalidade: a mensalidade poderá ser reajustada anualmente na data de aniversário da contratação (confirmação do pagamento da mensalidade), com base na variação acumulada do IPCA nos 12 meses anteriores ou índice substituto legalmente admitido. A CONTRATADA comunicará a CONTRATANTE com antecedência mínima de 30 dias sobre o percentual e o novo valor. O reajuste aplica-se às cobranças futuras da mensalidade. Na impossibilidade de apuração do IPCA, poderá ser utilizado índice oficial substituto ou percentual previamente informado.",
    "",
    "4. Pagamento e ativação",
    "4.1. Ativação condicionada à confirmação do pagamento do setup ou primeira cobrança devida, conforme Anexo Comercial.",
    "4.2. Inadimplência pode acarretar avisos, suspensão, bloqueio, cancelamento ou cobrança extrajudicial/judicial.",
    "4.3. Suspensão por inadimplência não isenta valores vencidos ou obrigações de fidelidade.",
    "4.4. Atraso pode incidir multa, juros e correção conforme política comercial vigente.",
    "4.5. Formas de pagamento: setup à vista (Pix, boleto ou cartão); setup parcelado (cartão até 6x); mensalidade (boleto ou cartão recorrente), conforme checkout.",
    "",
    "5. Fidelidade e cancelamento",
    "5.1. Na condição Fidelidade, permanência mínima de 12 meses (12 cobranças mensais fixas).",
    "5.2. Cancelamento antecipado na Fidelidade: multa de 30% das mensalidades vincendas, calculadas conforme Anexo Comercial.",
    "5.3. Demais condições: cancelamento com aviso prévio de 30 dias.",
    "5.4. Cancelamento por e-mail contato@festaai.com.br, WhatsApp (45) 99943-8936 ou área Minha Assinatura.",
    "5.5. Cancelamento não gera reembolso automático de setup, implantação ou mensalidades já vencidas.",
    "",
    "6. Ajustes no agente FestaAI",
    "6.1. Configuração inicial inclusa no setup.",
    "6.2. Pequenos ajustes podem ser inclusos na mensalidade; alterações estruturais serão orçadas à parte.",
    "",
    "7. Obrigações da CONTRATADA",
    "Disponibilizar a plataforma, realizar configuração inicial, manter esforços razoáveis de estabilidade, prestar suporte, corrigir falhas técnicas de sua responsabilidade e tratar dados conforme legislação aplicável.",
    "",
    "8. Obrigações da CONTRATANTE",
    "Fornecer informações corretas, pagar pontualmente, utilizar licitamente, zelar por acessos e validar informações configuradas no agente.",
    "",
    "9. Inteligência artificial e limitações do agente",
    "A CONTRATANTE reconhece que respostas automatizadas podem conter imprecisões e exigem validação humana.",
    "",
    "10. Suporte",
    `10.1. Canais: ${COMMERCIAL_CONTACT.email}, WhatsApp ${COMMERCIAL_CONTACT.whatsapp} e recursos na plataforma.`,
    "10.2. Suporte incluso: orientações, dúvidas operacionais e pequenos ajustes.",
    "10.3. Treinamentos extras, integrações personalizadas e desenvolvimento sob medida não estão inclusos.",
    "",
    "11. Propriedade intelectual",
    "Todos os direitos sobre a plataforma pertencem à CONTRATADA. Licença temporária enquanto contrato ativo e adimplente.",
    "",
    "12. Dados, privacidade e LGPD",
    "12.1. As partes observam a LGPD.",
    "12.2. CONTRATANTE é controladora dos dados de seus clientes; CONTRATADA é operadora na execução do contrato.",
    "12.3. CONTRATANTE declara possuir base legal para inserir dados na plataforma.",
    `12.10. Política de Privacidade disponível em ${privacyPolicyUrl} ou via ${COMMERCIAL_CONTACT.email}.`,
    "",
    "13. Disponibilidade e terceiros",
    "Esforços razoáveis de disponibilidade, sem garantia de funcionamento ininterrupto.",
    "",
    "14. Limitação de responsabilidade",
    "Responsabilidade total limitada ao valor pago nos últimos 3 meses, salvo vedação legal.",
    "",
    "15. Confidencialidade",
    "Obrigação de sigilo sobre informações técnicas, comerciais e operacionais.",
    "",
    "16. Vigência",
    "16.1. Vigência a partir do aceite eletrônico.",
    "16.2. Condições sem fidelidade: prazo indeterminado enquanto houver mensalidade.",
    "16.3. Fidelidade: mínimo de 12 meses; após isso, renovação por prazo indeterminado salvo manifestação contrária.",
    "",
    "17. Suspensão e encerramento",
    "A CONTRATADA pode suspender ou encerrar por inadimplência, uso indevido ou violação contratual.",
    "",
    "18. Aceite eletrônico",
    "18.1. Aceite válido ao marcar a caixa e confirmar a contratação antes do pagamento.",
    "18.2. Aceite comprova concordância com contrato e Anexo Comercial.",
    "18.3. Registro de data, hora, IP, user agent, dados cadastrais, condição comercial e versão do contrato.",
    "18.4. Pagamento confirma execução comercial, mas não substitui aceite explícito.",
    "",
    "19. Alterações contratuais",
    "Alterações relevantes serão comunicadas; continuidade de uso pode significar aceite da nova versão, salvo impacto em valores ou fidelidade já contratados.",
    "",
    "20. Foro",
    "Comarca de Cascavel/PR.",
    "",
    "21. Declaração final de aceite",
    "A CONTRATANTE declara que leu e aceita este contrato, a condição comercial do Anexo, reconhece licença (não venda), aceita configuração inicial inclusa no setup, autoriza tratamento de dados e aceita comunicações operacionais e financeiras.",
  ].join("\n");

export const buildPrivacyPolicyBody = (): string =>
  [
    "POLÍTICA DE PRIVACIDADE — FESTAAI",
    `Versão ${PRIVACY_POLICY_VERSION}`,
    "",
    `Controladora dos dados da operação comercial da plataforma: ${CONTRACTED_PARTY.companyName}, CNPJ ${CONTRACTED_PARTY.cnpj}, ${CONTRACTED_PARTY.address}. Contato: ${COMMERCIAL_CONTACT.email}.`,
    "",
    "1. Escopo",
    "Esta Política descreve como a FestaAI trata dados pessoais de clientes da plataforma (casas de festas), usuários autorizados, leads comerciais e titulares cujos dados são inseridos pelos clientes na operação.",
    "",
    "2. Papéis na LGPD",
    "2.1. FestaAI é controladora dos dados relacionados à contratação, cobrança, suporte e operação da plataforma.",
    "2.2. Para dados de clientes finais das casas de festas (leads, responsáveis, convidados), a casa de festas é controladora e a FestaAI atua como operadora.",
    "",
    "3. Dados que coletamos",
    "3.1. Cadastro e contratação: nome, e-mail, telefone, CPF/CNPJ, empresa, endereço IP, user agent, registros de aceite contratual.",
    "3.2. Cobrança: dados de pagamento processados por provedores (Asaas); não armazenamos número completo de cartão.",
    "3.3. Uso da plataforma: logs de acesso, ações, configurações, eventos, contratos de festas, formulários e comunicações.",
    "3.4. Suporte: mensagens, anexos e registros de atendimento.",
    "",
    "4. Finalidades",
    "Execução do contrato, cobrança, suporte, segurança, prevenção a fraudes, melhoria dos serviços, comunicações operacionais/financeiras e cumprimento legal.",
    "",
    "5. Bases legais",
    "Execução de contrato, legítimo interesse (segurança e melhoria), cumprimento de obrigação legal e consentimento quando aplicável.",
    "",
    "6. Compartilhamento",
    "Provedores de infraestrutura (Supabase), pagamentos (Asaas), e-mail transacional, automação e inteligência artificial necessários à prestação do serviço, sempre com medidas de segurança.",
    "",
    "7. Retenção",
    "Dados mantidos pelo tempo necessário à execução contratual, obrigações legais, defesa de direitos e registros de aceite/compliance.",
    "",
    "8. Segurança",
    "Medidas técnicas e administrativas razoáveis: controle de acesso, criptografia em trânsito, segregação por tenant e monitoramento.",
    "",
    "9. Direitos dos titulares",
    "Confirmação, acesso, correção, anonimização, portabilidade, eliminação e informação sobre compartilhamento, mediante solicitação a contato@festaai.com.br.",
    "",
    "10. Cookies e tecnologias similares",
    "Utilizamos cookies e storage local para autenticação, preferências e segurança da sessão.",
    "",
    "11. Transferência internacional",
    "Provedores de infraestrutura podem processar dados fora do Brasil com salvaguardas contratuais adequadas.",
    "",
    "12. Crianças e adolescentes",
    "A plataforma é destinada a empresas. Dados de menores inseridos por clientes devem observar a base legal aplicável pelo controlador (casa de festas).",
    "",
    "13. Alterações",
    "Esta Política pode ser atualizada. Alterações relevantes serão comunicadas por e-mail ou na plataforma.",
    "",
    "14. Contato",
    `Dúvidas sobre privacidade: ${COMMERCIAL_CONTACT.email}.`,
  ].join("\n");

export const buildCommercialContractPackage = (
  snapshot: CommercialSnapshot,
  privacyPolicyUrl: string,
) => {
  const contractBody = buildCommercialContractBody(privacyPolicyUrl);
  const commercialAnnex = buildCommercialAnnex(snapshot);

  return {
    acceptanceDeclaration: ACCEPTANCE_DECLARATION,
    commercialAnnex,
    commercialSnapshot: snapshot,
    contractBody: `${contractBody}\n\n---\n\n${commercialAnnex}`,
    contractVersion: COMMERCIAL_CONTRACT_VERSION,
  };
};
