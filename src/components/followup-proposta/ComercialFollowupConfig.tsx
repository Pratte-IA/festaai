import { ArrowLeft, FileSignature, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import {
  SettingsPageHeader,
  SettingsStatChip,
} from "@/components/configuracoes/SettingsPageHeader";
import { FollowupTemplateEditor } from "@/components/followup-proposta/FollowupTemplateEditor";
import {
  FollowupRuleCard,
  FollowupRuleList,
  FollowupSection,
} from "@/components/followup-proposta/FollowupRuleCard";
import { useFollowupTemplateEditor } from "@/components/followup-proposta/use-followup-template-editor";
import {
  buildContractSignatureFollowupInicialPreviewMessage,
  buildContractSignatureFollowupLembretePreviewMessage,
  buildPublicContractFormUrl,
  CONTRACT_SIGNATURE_FOLLOWUP_BUSINESS_HOUR_END,
  CONTRACT_SIGNATURE_FOLLOWUP_BUSINESS_HOUR_START,
  CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_DELAY_HOURS,
  CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_TEMPLATE,
  CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS,
  CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_TEMPLATE,
  CONTRACT_SIGNATURE_FOLLOWUP_PREVIEW,
} from "@/features/eventos/contract-signature-followup";
import {
  buildPropostaFollowup0PreviewMessage,
  buildPropostaFollowup0bPreviewMessage,
  buildPropostaFollowup1PreviewMessage,
  buildPropostaFollowup2PreviewMessage,
  buildPropostaFollowup3PreviewMessage,
  buildPropostaFollowup4PreviewMessage,
  PROPOSTA_FOLLOWUP_PREVIEW,
} from "@/features/eventos/build-proposta-followup-preview";
import {
  PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_END,
  PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_START,
  PROPOSTA_FOLLOWUP_0_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_0_TEMPLATE_CONTATO_INICIAL,
  PROPOSTA_FOLLOWUP_0B_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_0B_LOSS_MOTIVO,
  PROPOSTA_FOLLOWUP_0B_TEMPLATE_ENCERRAMENTO,
  PROPOSTA_FOLLOWUP_1_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL,
  PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE,
  PROPOSTA_FOLLOWUP_2_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL,
  PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE,
  PROPOSTA_FOLLOWUP_3_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_3_TEMPLATE_DATA_INDISPONIVEL,
  PROPOSTA_FOLLOWUP_3_TEMPLATE_VISITA,
  PROPOSTA_FOLLOWUP_4_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_4_TEMPLATE_DATA_INDISPONIVEL,
  PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO,
  PROPOSTA_FOLLOWUP_LOSS_MOTIVO,
} from "@/features/eventos/proposta-followup";
import { useTenantCompanyProfile } from "@/features/guided-setup";
import { useCurrentTenant } from "@/features/tenants";
import { formatCompanyDisplayName } from "@/lib/company-display-name";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

const TEMPLATE_VARIABLES = [
  "{{primeiro_nome}}",
  "{{nome_aniversariante}}",
  "{{data_festa}}",
  "{{nome_empresa}}",
];

const FU0_TEMPLATE_VARIABLES = ["{{primeiro_nome}}", "{{nome_empresa}}"];

const ASSINATURA_TEMPLATE_VARIABLES = [
  "{{primeiro_nome}}",
  "{{nome_aniversariante}}",
  "{{data_festa}}",
  "{{nome_empresa}}",
  "{{link_formulario}}",
];

interface ComercialFollowupConfigProps {
  showSettingsHeader?: boolean;
}

export const ComercialFollowupConfig = ({ showSettingsHeader }: ComercialFollowupConfigProps) => {
  const { currentTenant } = useCurrentTenant();
  const { data: companyProfile } = useTenantCompanyProfile();
  const { getTemplate, handleSave, isLoading, savingKey, setDraftBody } = useFollowupTemplateEditor();

  const companyLegalName =
    companyProfile?.companyName?.trim() || currentTenant?.name?.trim() || "Sua Casa de Festas";

  const fu0Template = getTemplate(
    PROPOSTA_FOLLOWUP_0_TEMPLATE_CONTATO_INICIAL,
    "Follow-up 0 — retomada de contato inicial",
  );
  const fu0bTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_0B_TEMPLATE_ENCERRAMENTO,
    "Follow-up 0b — 2ª tentativa / encerramento",
  );
  const dataLivreTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE,
    "Follow-up 1 — data livre",
  );
  const dataIndisponivelTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL,
    "Follow-up 1 — data indisponível",
  );
  const fu2DataLivreTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE,
    "Follow-up 2 — data livre",
  );
  const fu2DataIndisponivelTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL,
    "Follow-up 2 — data indisponível",
  );
  const fu3VisitaTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_3_TEMPLATE_VISITA,
    "Follow-up 3 — convite de visita",
  );
  const fu3DataIndisponivelTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_3_TEMPLATE_DATA_INDISPONIVEL,
    "Follow-up 3 — data indisponível",
  );
  const fu4EncerramentoTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO,
    "Follow-up 4 — encerramento",
  );
  const fu4DataIndisponivelTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_4_TEMPLATE_DATA_INDISPONIVEL,
    "Follow-up 4 — data indisponível",
  );
  const assinaturaInicialTemplate = getTemplate(
    CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_TEMPLATE,
    "Follow-up de assinatura — mensagem inicial",
  );
  const assinaturaLembreteTemplate = getTemplate(
    CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_TEMPLATE,
    "Follow-up de assinatura — lembrete",
  );

  const previewLinkFormulario = currentTenant
    ? buildPublicContractFormUrl(currentTenant.slug, CONTRACT_SIGNATURE_FOLLOWUP_PREVIEW.eventoId)
    : "https://festaai.com.br/formulario/sua-casa?evento=123";

  const previewFu0 = useMemo(
    () =>
      buildPropostaFollowup0PreviewMessage({
        clienteNome: PROPOSTA_FOLLOWUP_PREVIEW.clienteNome,
        companyLegalName,
        templateBody: fu0Template.body,
      }),
    [companyLegalName, fu0Template.body],
  );

  const previewFu0b = useMemo(
    () =>
      buildPropostaFollowup0bPreviewMessage({
        clienteNome: PROPOSTA_FOLLOWUP_PREVIEW.clienteNome,
        companyLegalName,
        templateBody: fu0bTemplate.body,
      }),
    [companyLegalName, fu0bTemplate.body],
  );

  const previewDataLivre = useMemo(
    () =>
      buildPropostaFollowup1PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: dataLivreTemplate.body,
        variante: "data_livre",
      }),
    [companyLegalName, dataLivreTemplate.body],
  );

  const previewDataIndisponivel = useMemo(
    () =>
      buildPropostaFollowup1PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: dataIndisponivelTemplate.body,
        variante: "data_indisponivel",
      }),
    [companyLegalName, dataIndisponivelTemplate.body],
  );

  const previewFu2DataLivre = useMemo(
    () =>
      buildPropostaFollowup2PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: fu2DataLivreTemplate.body,
        variante: "data_livre",
      }),
    [companyLegalName, fu2DataLivreTemplate.body],
  );

  const previewFu2DataIndisponivel = useMemo(
    () =>
      buildPropostaFollowup2PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: fu2DataIndisponivelTemplate.body,
        variante: "data_indisponivel",
      }),
    [companyLegalName, fu2DataIndisponivelTemplate.body],
  );

  const previewFu3Visita = useMemo(
    () =>
      buildPropostaFollowup3PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: fu3VisitaTemplate.body,
        variante: "data_livre",
      }),
    [companyLegalName, fu3VisitaTemplate.body],
  );

  const previewFu3DataIndisponivel = useMemo(
    () =>
      buildPropostaFollowup3PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: fu3DataIndisponivelTemplate.body,
        variante: "data_indisponivel",
      }),
    [companyLegalName, fu3DataIndisponivelTemplate.body],
  );

  const previewFu4Encerramento = useMemo(
    () =>
      buildPropostaFollowup4PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: fu4EncerramentoTemplate.body,
        variante: "data_livre",
      }),
    [companyLegalName, fu4EncerramentoTemplate.body],
  );

  const previewFu4DataIndisponivel = useMemo(
    () =>
      buildPropostaFollowup4PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: fu4DataIndisponivelTemplate.body,
        variante: "data_indisponivel",
      }),
    [companyLegalName, fu4DataIndisponivelTemplate.body],
  );

  const previewAssinaturaInicial = useMemo(
    () =>
      buildContractSignatureFollowupInicialPreviewMessage({
        ...CONTRACT_SIGNATURE_FOLLOWUP_PREVIEW,
        companyLegalName: formatCompanyDisplayName(companyLegalName),
        linkFormulario: previewLinkFormulario,
        templateBody: assinaturaInicialTemplate.body,
      }),
    [assinaturaInicialTemplate.body, companyLegalName, previewLinkFormulario],
  );

  const previewAssinaturaLembrete = useMemo(
    () =>
      buildContractSignatureFollowupLembretePreviewMessage({
        ...CONTRACT_SIGNATURE_FOLLOWUP_PREVIEW,
        companyLegalName: formatCompanyDisplayName(companyLegalName),
        linkFormulario: previewLinkFormulario,
        templateBody: assinaturaLembreteTemplate.body,
      }),
    [assinaturaLembreteTemplate.body, companyLegalName, previewLinkFormulario],
  );

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando follow-ups...
      </div>
    );
  }

  const meta = SETTINGS_PAGE_META["followups/comercial"];

  return (
    <div className="space-y-6">
      {showSettingsHeader ? (
        <>
          <Link
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
            to="/configuracoes/followups"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar para Follow-ups
          </Link>
          <SettingsPageHeader
            title={meta.title}
            description={meta.description}
            stats={
              <>
                <SettingsStatChip>FU0 + FU0b + FU1–FU4</SettingsStatChip>
                <SettingsStatChip>
                  Assinatura: inicial {CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_DELAY_HOURS}h · lembretes{" "}
                  {CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS}h
                </SettingsStatChip>
                <SettingsStatChip>
                  FU0 {PROPOSTA_FOLLOWUP_0_DELAY_HOURS}h · FU1 {PROPOSTA_FOLLOWUP_1_DELAY_HOURS}h ·
                  FU2/FU3 {PROPOSTA_FOLLOWUP_2_DELAY_HOURS}h · FU4 {PROPOSTA_FOLLOWUP_4_DELAY_HOURS}h
                </SettingsStatChip>
              </>
            }
          />
        </>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">Follow-ups de proposta</h2>
        <p className="text-sm text-muted-foreground">
          Sequência para leads em Contato Inicial e Proposta Enviada sem retorno no WhatsApp.
        </p>
      </div>

      <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            O disparo usa o número vinculado em{" "}
            <Link
              className="font-medium text-foreground underline-offset-4 hover:underline"
              to="/configuracoes/automacoes"
            >
              Automações → Follow-up de Proposta
            </Link>
            . No envio real, substituímos os nomes e a data pelos dados de cada evento e usamos o nome
            comercial{" "}
            <span className="font-medium text-foreground">{formatCompanyDisplayName(companyLegalName)}</span>.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <FollowupSection>
          <FollowupRuleCard title="Regra de disparo — Follow-up 0 (contato inicial)">
            <FollowupRuleList>
              <li>
                <span className="text-foreground">{PROPOSTA_FOLLOWUP_0_DELAY_HOURS} horas</span> após a{" "}
                <strong>nossa última mensagem</strong> ao lead em Contato Inicial
              </li>
              <li>
                Enviado apenas dentro do horário comercial (
                <span className="text-foreground">
                  {PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_START}h às {PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_END}h
                </span>
                , fuso de Brasília)
              </li>
              <li>Lead ainda em Contato Inicial e sem retorno após a nossa mensagem</li>
              <li>Se o cliente responder, o timer é zerado automaticamente e o FU0 não é enviado</li>
              <li>
                Após o FU0, se ainda sem retorno em{" "}
                <span className="text-foreground">{PROPOSTA_FOLLOWUP_0B_DELAY_HOURS}h</span>, o sistema envia
                a 2ª tentativa (FU0b) e move o lead para Perdido
              </li>
              <li>É uma mensagem única — não substitui a sequência FU1–FU4 da proposta</li>
            </FollowupRuleList>
          </FollowupRuleCard>
          <FollowupTemplateEditor
            description="Retomada leve do atendimento para leads em Contato Inicial sem retorno."
            isSaving={savingKey === PROPOSTA_FOLLOWUP_0_TEMPLATE_CONTATO_INICIAL}
            onChange={(body) => setDraftBody(PROPOSTA_FOLLOWUP_0_TEMPLATE_CONTATO_INICIAL, body)}
            onSave={() => void handleSave(fu0Template)}
            previewMessage={previewFu0}
            template={fu0Template}
            title="Follow-up 0 — retomada de contato inicial"
            variables={FU0_TEMPLATE_VARIABLES}
          />
        </FollowupSection>

        <FollowupSection>
          <FollowupRuleCard title="Regra de disparo — Follow-up 0b (2ª tentativa)" variant="destructive">
            <FollowupRuleList>
              <li>
                <span className="text-foreground">{PROPOSTA_FOLLOWUP_0B_DELAY_HOURS} horas</span> após o envio
                do Follow-up 0
              </li>
              <li>Lead ainda em Contato Inicial e sem retorno no WhatsApp</li>
              <li>
                Enviado apenas dentro do horário comercial (
                <span className="text-foreground">
                  {PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_START}h às {PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_END}h
                </span>
                )
              </li>
              <li>
                Após o envio, o lead vai para <strong>Perdido</strong> (
                {PROPOSTA_FOLLOWUP_0B_LOSS_MOTIVO.toLowerCase()})
              </li>
              <li>
                Se o cliente responder depois, o lead volta automaticamente para <strong>Contato Inicial</strong>
              </li>
            </FollowupRuleList>
          </FollowupRuleCard>
          <FollowupTemplateEditor
            description="2ª tentativa curta. Após o envio, o lead vai para Perdido."
            isSaving={savingKey === PROPOSTA_FOLLOWUP_0B_TEMPLATE_ENCERRAMENTO}
            onChange={(body) => setDraftBody(PROPOSTA_FOLLOWUP_0B_TEMPLATE_ENCERRAMENTO, body)}
            onSave={() => void handleSave(fu0bTemplate)}
            previewMessage={previewFu0b}
            template={fu0bTemplate}
            title="Follow-up 0b — 2ª tentativa / encerramento"
            variables={FU0_TEMPLATE_VARIABLES}
          />
        </FollowupSection>

        <FollowupSection>
          <div className="grid gap-3 md:grid-cols-2">
            <FollowupRuleCard title="Regra de disparo — Follow-up 1">
              <FollowupRuleList>
                <li>
                  <span className="text-foreground">{PROPOSTA_FOLLOWUP_1_DELAY_HOURS} horas</span> após o lead
                  entrar em <strong>Proposta Enviada</strong>
                </li>
                <li>Lead ainda na etapa Proposta Enviada, sem retorno no WhatsApp</li>
                <li>Data da festa cadastrada (obrigatória para enviar proposta)</li>
                <li>Antes do envio, o sistema verifica se a data ainda está livre na agenda</li>
              </FollowupRuleList>
            </FollowupRuleCard>
            <FollowupRuleCard icon={ShieldCheck} title="Validação da data" variant="neutral">
              <FollowupRuleList>
                <li>
                  <strong>Data livre</strong> → mensagem informando que a data ainda está disponível
                </li>
                <li>
                  <strong>Data ocupada</strong> → mensagem informando que outra família reservou e oferecendo
                  ajuda com novas datas
                </li>
                <li>Se o cliente responder, a sequência pausa automaticamente</li>
              </FollowupRuleList>
            </FollowupRuleCard>
          </div>
          <FollowupTemplateEditor
            description="Enviada quando a data da festa ainda está livre na agenda."
            isSaving={savingKey === PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE}
            onChange={(body) => setDraftBody(PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE, body)}
            onSave={() => void handleSave(dataLivreTemplate)}
            previewMessage={previewDataLivre}
            template={dataLivreTemplate}
            title="Follow-up 1 — data livre"
            variables={TEMPLATE_VARIABLES}
          />
          <FollowupTemplateEditor
            description="Enviada quando a data já foi reservada ou está bloqueada na agenda."
            isSaving={savingKey === PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL}
            onChange={(body) => setDraftBody(PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL, body)}
            onSave={() => void handleSave(dataIndisponivelTemplate)}
            previewMessage={previewDataIndisponivel}
            template={dataIndisponivelTemplate}
            title="Follow-up 1 — data indisponível"
            variables={TEMPLATE_VARIABLES}
          />
        </FollowupSection>

        <FollowupSection>
          <FollowupRuleCard title="Regra de disparo — Follow-up 2">
            <FollowupRuleList>
              <li>
                <span className="text-foreground">{PROPOSTA_FOLLOWUP_2_DELAY_HOURS} horas</span> após o envio
                do Follow-up 1
              </li>
              <li>Lead ainda em Proposta Enviada, sem retorno no WhatsApp após o FU1</li>
              <li>Mesma validação de data livre/ocupada antes do envio</li>
              <li>Qualquer resposta do cliente (texto ou áudio) pausa a sequência</li>
            </FollowupRuleList>
          </FollowupRuleCard>
          <FollowupTemplateEditor
            description="72h após o FU1, quando a data da festa ainda está livre."
            isSaving={savingKey === PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE}
            onChange={(body) => setDraftBody(PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE, body)}
            onSave={() => void handleSave(fu2DataLivreTemplate)}
            previewMessage={previewFu2DataLivre}
            template={fu2DataLivreTemplate}
            title="Follow-up 2 — data livre"
            variables={TEMPLATE_VARIABLES}
          />
          <FollowupTemplateEditor
            description="72h após o FU1, quando a data já foi reservada ou bloqueada."
            isSaving={savingKey === PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL}
            onChange={(body) => setDraftBody(PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL, body)}
            onSave={() => void handleSave(fu2DataIndisponivelTemplate)}
            previewMessage={previewFu2DataIndisponivel}
            template={fu2DataIndisponivelTemplate}
            title="Follow-up 2 — data indisponível"
            variables={TEMPLATE_VARIABLES}
          />
        </FollowupSection>

        <FollowupSection>
          <FollowupRuleCard title="Regra de disparo — Follow-up 3">
            <FollowupRuleList>
              <li>
                <span className="text-foreground">{PROPOSTA_FOLLOWUP_3_DELAY_HOURS} horas</span> após o envio
                do Follow-up 2
              </li>
              <li>Lead ainda em Proposta Enviada, sem retorno no WhatsApp após o FU2</li>
              <li>Revalida data livre/ocupada na agenda antes do envio</li>
              <li>Se a data estiver livre: convite para visita presencial</li>
              <li>Se a data já estiver ocupada: informa a reserva e mantém o convite de visita</li>
            </FollowupRuleList>
          </FollowupRuleCard>
          <FollowupTemplateEditor
            description="72h após o FU2, quando a data da festa ainda está livre — convite de visita."
            isSaving={savingKey === PROPOSTA_FOLLOWUP_3_TEMPLATE_VISITA}
            onChange={(body) => setDraftBody(PROPOSTA_FOLLOWUP_3_TEMPLATE_VISITA, body)}
            onSave={() => void handleSave(fu3VisitaTemplate)}
            previewMessage={previewFu3Visita}
            template={fu3VisitaTemplate}
            title="Follow-up 3 — convite de visita (data livre)"
            variables={TEMPLATE_VARIABLES}
          />
          <FollowupTemplateEditor
            description="72h após o FU2, quando a data já foi reservada ou bloqueada."
            isSaving={savingKey === PROPOSTA_FOLLOWUP_3_TEMPLATE_DATA_INDISPONIVEL}
            onChange={(body) => setDraftBody(PROPOSTA_FOLLOWUP_3_TEMPLATE_DATA_INDISPONIVEL, body)}
            onSave={() => void handleSave(fu3DataIndisponivelTemplate)}
            previewMessage={previewFu3DataIndisponivel}
            template={fu3DataIndisponivelTemplate}
            title="Follow-up 3 — data indisponível"
            variables={TEMPLATE_VARIABLES}
          />
        </FollowupSection>

        <FollowupSection>
          <FollowupRuleCard title="Regra de disparo — Follow-up 4" variant="destructive">
            <FollowupRuleList>
              <li>
                <span className="text-foreground">{PROPOSTA_FOLLOWUP_4_DELAY_HOURS} horas</span> após o envio
                do Follow-up 3
              </li>
              <li>Mensagem de encerramento amigável, sem pressão</li>
              <li>Revalida data livre/ocupada na agenda antes do envio</li>
              <li>
                Após o envio, o lead é movido automaticamente para <strong>Perdido</strong> (
                {PROPOSTA_FOLLOWUP_LOSS_MOTIVO.toLowerCase()})
              </li>
              <li>A sequência de follow-up é marcada como concluída</li>
              <li>
                Se o cliente retomar depois com mensagem relevante, o lead volta para <strong>Negociação</strong>.
                Respostas curtas permanecem em Perdido
              </li>
            </FollowupRuleList>
          </FollowupRuleCard>
          <FollowupTemplateEditor
            description="Encerramento quando a data ainda está livre. O lead vai para Perdido após o envio."
            isSaving={savingKey === PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO}
            onChange={(body) => setDraftBody(PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO, body)}
            onSave={() => void handleSave(fu4EncerramentoTemplate)}
            previewMessage={previewFu4Encerramento}
            template={fu4EncerramentoTemplate}
            title="Follow-up 4 — encerramento (data livre)"
            variables={TEMPLATE_VARIABLES}
          />
          <FollowupTemplateEditor
            description="Encerramento quando a data já foi reservada. O lead vai para Perdido após o envio."
            isSaving={savingKey === PROPOSTA_FOLLOWUP_4_TEMPLATE_DATA_INDISPONIVEL}
            onChange={(body) => setDraftBody(PROPOSTA_FOLLOWUP_4_TEMPLATE_DATA_INDISPONIVEL, body)}
            onSave={() => void handleSave(fu4DataIndisponivelTemplate)}
            previewMessage={previewFu4DataIndisponivel}
            template={fu4DataIndisponivelTemplate}
            title="Follow-up 4 — encerramento (data indisponível)"
            variables={TEMPLATE_VARIABLES}
          />
        </FollowupSection>
      </div>

      <div className="border-t border-border/60 pt-8 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Follow-up de assinatura de contrato</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Para clientes que preencheram o formulário de contratação mas ainda não assinaram o contrato
            eletrônico.
          </p>
        </div>

        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              O disparo usa o número vinculado em{" "}
              <Link
                className="font-medium text-foreground underline-offset-4 hover:underline"
                to="/configuracoes/automacoes"
              >
                Automações → Follow-up de Assinatura
              </Link>
              . No envio real, o link do formulário é gerado automaticamente para cada evento.
            </p>
          </div>
        </div>

        <FollowupSection>
          <FollowupRuleCard title={`Regra de disparo — Mensagem inicial (${CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_DELAY_HOURS}h)`}>
            <FollowupRuleList>
              <li>
                <span className="text-foreground">{CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_DELAY_HOURS} horas</span>{" "}
                após o envio do formulário — primeira mensagem com link para assinar
              </li>
              <li>
                Apenas em horário comercial (
                <span className="text-foreground">
                  {CONTRACT_SIGNATURE_FOLLOWUP_BUSINESS_HOUR_START}h às{" "}
                  {CONTRACT_SIGNATURE_FOLLOWUP_BUSINESS_HOUR_END}h
                </span>
                , fuso de Brasília)
              </li>
              <li>Para automaticamente quando o contrato for assinado</li>
            </FollowupRuleList>
          </FollowupRuleCard>
          <FollowupTemplateEditor
            description="Explica que o contrato está pronto e envia o link para assinar."
            isSaving={savingKey === CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_TEMPLATE}
            onChange={(body) => setDraftBody(CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_TEMPLATE, body)}
            onSave={() => void handleSave(assinaturaInicialTemplate)}
            previewMessage={previewAssinaturaInicial}
            template={assinaturaInicialTemplate}
            title={`Mensagem inicial (${CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_DELAY_HOURS}h)`}
            variables={ASSINATURA_TEMPLATE_VARIABLES}
          />
        </FollowupSection>

        <FollowupSection>
          <FollowupRuleCard
            title={`Regra de disparo — Lembretes (a cada ${CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS}h)`}
          >
            <FollowupRuleList>
              <li>
                Lembrete simples a cada{" "}
                <span className="text-foreground">{CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS} horas</span>{" "}
                até a assinatura ser concluída
              </li>
              <li>
                Apenas em horário comercial (
                <span className="text-foreground">
                  {CONTRACT_SIGNATURE_FOLLOWUP_BUSINESS_HOUR_START}h às{" "}
                  {CONTRACT_SIGNATURE_FOLLOWUP_BUSINESS_HOUR_END}h
                </span>
                )
              </li>
              <li>Não pausa se o cliente responder — continua até assinar</li>
            </FollowupRuleList>
          </FollowupRuleCard>
          <FollowupTemplateEditor
            description="Lembretes curtos enviados em horário comercial até a assinatura."
            isSaving={savingKey === CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_TEMPLATE}
            onChange={(body) => setDraftBody(CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_TEMPLATE, body)}
            onSave={() => void handleSave(assinaturaLembreteTemplate)}
            previewMessage={previewAssinaturaLembrete}
            template={assinaturaLembreteTemplate}
            title={`Lembretes (a cada ${CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS}h)`}
            variables={ASSINATURA_TEMPLATE_VARIABLES}
          />
        </FollowupSection>
      </div>
    </div>
  );
};
