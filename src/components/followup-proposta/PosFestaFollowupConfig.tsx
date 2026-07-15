import { ArrowLeft, Loader2, MessageCircle, MessageSquareHeart, Star } from "lucide-react";
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
import { SatisfactionSurveyMessagesSection } from "@/components/pesquisa-avaliacao/SatisfactionSurveyMessagesSection";
import {
  buildPublicSatisfactionSurveyUrl,
  buildSatisfactionSurveyFollowupPreviewMessage,
  buildSatisfactionSurveyNpsBaixaPreviewMessage,
  SATISFACTION_SURVEY_FOLLOWUP_DELAY_HOURS,
  SATISFACTION_SURVEY_FOLLOWUP_MESSAGE_TEMPLATE_KEY,
  SATISFACTION_SURVEY_FOLLOWUP_PREVIEW,
  SATISFACTION_SURVEY_NPS_BAIXA_MAX_SCORE,
  SATISFACTION_SURVEY_NPS_BAIXA_MESSAGE_TEMPLATE_KEY,
  SATISFACTION_SURVEY_NPS_BAIXA_PREVIEW,
} from "@/features/public-satisfaction-survey";
import { useTenantCompanyProfile } from "@/features/guided-setup";
import { useCurrentTenant } from "@/features/tenants";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

const PESQUISA_FOLLOWUP_TEMPLATE_VARIABLES = [
  "{{primeiro_nome}}",
  "{{nome_aniversariante}}",
  "{{nome_empresa}}",
  "{{link_pesquisa}}",
];

const NPS_BAIXA_TEMPLATE_VARIABLES = ["{{primeiro_nome}}", "{{nome_aniversariante}}"];

interface PosFestaFollowupConfigProps {
  showSettingsHeader?: boolean;
}

export const PosFestaFollowupConfig = ({ showSettingsHeader }: PosFestaFollowupConfigProps) => {
  const { currentTenant } = useCurrentTenant();
  const { data: companyProfile } = useTenantCompanyProfile();
  const { getTemplate, handleSave, isLoading, savingKey, setDraftBody } = useFollowupTemplateEditor();

  const companyLegalName =
    companyProfile?.companyName?.trim() || currentTenant?.name?.trim() || "Sua Casa de Festas";

  const pesquisaFollowupTemplate = getTemplate(
    SATISFACTION_SURVEY_FOLLOWUP_MESSAGE_TEMPLATE_KEY,
    "Lembrete da pesquisa de satisfação",
  );

  const npsBaixaTemplate = getTemplate(
    SATISFACTION_SURVEY_NPS_BAIXA_MESSAGE_TEMPLATE_KEY,
    "Follow-up NPS baixa (0–7)",
  );

  const previewLinkPesquisa = currentTenant
    ? buildPublicSatisfactionSurveyUrl(currentTenant.slug, SATISFACTION_SURVEY_FOLLOWUP_PREVIEW.eventoId)
    : "https://festaai.com.br/pesquisa/sua-casa/123";

  const previewPesquisaFollowup = useMemo(
    () =>
      buildSatisfactionSurveyFollowupPreviewMessage({
        ...SATISFACTION_SURVEY_FOLLOWUP_PREVIEW,
        companyLegalName,
        surveyUrl: previewLinkPesquisa,
        templateBody: pesquisaFollowupTemplate.body,
      }),
    [companyLegalName, pesquisaFollowupTemplate.body, previewLinkPesquisa],
  );

  const previewNpsBaixa = useMemo(
    () =>
      buildSatisfactionSurveyNpsBaixaPreviewMessage({
        ...SATISFACTION_SURVEY_NPS_BAIXA_PREVIEW,
        templateBody: npsBaixaTemplate.body,
      }),
    [npsBaixaTemplate.body],
  );

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando follow-ups...
      </div>
    );
  }

  const meta = SETTINGS_PAGE_META["followups/pos-festa"];

  return (
    <div className="space-y-8">
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
                <SettingsStatChip>Envio inicial: dia seguinte à festa</SettingsStatChip>
                <SettingsStatChip>Lembrete: {SATISFACTION_SURVEY_FOLLOWUP_DELAY_HOURS}h</SettingsStatChip>
                <SettingsStatChip>NPS baixa: 0–{SATISFACTION_SURVEY_NPS_BAIXA_MAX_SCORE}</SettingsStatChip>
              </>
            }
          />
        </>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">Envio inicial da pesquisa</h2>
      </div>

      <SatisfactionSurveyMessagesSection showFollowupLink={false} />

      <div className="border-t border-border/60 pt-8 space-y-2">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Lembrete da pesquisa</h2>
        </div>
      </div>

      <FollowupSection>
        <FollowupRuleCard title="Regras de disparo — Lembrete">
          <FollowupRuleList>
            <li>
              <span className="text-foreground">{SATISFACTION_SURVEY_FOLLOWUP_DELAY_HOURS} horas</span> após o
              envio inicial da pesquisa, se o cliente ainda não respondeu
            </li>
            <li>Evento em Aguardando Feedback (funil Executadas)</li>
            <li>Envio único — não repete após o lembrete</li>
            <li>
              Após o lembrete, o lead é movido para <strong>Prova Social - Marketing</strong>
            </li>
            <li>Para automaticamente se o cliente responder antes das 24h</li>
          </FollowupRuleList>
        </FollowupRuleCard>

        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              O disparo usa o número vinculado em{" "}
              <Link
                className="font-medium text-foreground underline-offset-4 hover:underline"
                to="/configuracoes/automacoes"
              >
                Automações → Pesquisa de Satisfação
              </Link>
              . No envio real, o link da pesquisa é gerado automaticamente para cada evento.
            </p>
          </div>
        </div>

        <FollowupTemplateEditor
          description="Mensagem com carinho relembrando a pesquisa pós-festa."
          isSaving={savingKey === SATISFACTION_SURVEY_FOLLOWUP_MESSAGE_TEMPLATE_KEY}
          onChange={(body) => setDraftBody(SATISFACTION_SURVEY_FOLLOWUP_MESSAGE_TEMPLATE_KEY, body)}
          onSave={() => void handleSave(pesquisaFollowupTemplate)}
          previewMessage={previewPesquisaFollowup}
          template={pesquisaFollowupTemplate}
          title={`Lembrete da pesquisa (${SATISFACTION_SURVEY_FOLLOWUP_DELAY_HOURS}h)`}
          variables={PESQUISA_FOLLOWUP_TEMPLATE_VARIABLES}
        />
      </FollowupSection>

      <div className="border-t border-border/60 pt-8 space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquareHeart className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">
            Follow-up NPS baixa (0–{SATISFACTION_SURVEY_NPS_BAIXA_MAX_SCORE})
          </h2>
        </div>
      </div>

      <FollowupSection>
        <FollowupRuleCard title="Regras de disparo — NPS baixa">
          <FollowupRuleList>
            <li>
              Disparo <span className="text-foreground">imediato</span> quando o cliente responde a
              pesquisa com nota de <span className="text-foreground">0 a {SATISFACTION_SURVEY_NPS_BAIXA_MAX_SCORE}</span>
            </li>
            <li>Usa a pergunta de indicação (NPS) da pesquisa de satisfação</li>
            <li>Envio único por evento — não repete se a pesquisa for reenviada</li>
            <li>Notas 8, 9 e 10 não disparam esta mensagem</li>
          </FollowupRuleList>
        </FollowupRuleCard>

        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Também usa o número de{" "}
              <Link
                className="font-medium text-foreground underline-offset-4 hover:underline"
                to="/configuracoes/automacoes"
              >
                Automações → Pesquisa de Satisfação
              </Link>
              . A mensagem pede detalhes para a casa entender o que não saiu bem.
            </p>
          </div>
        </div>

        <FollowupTemplateEditor
          description="Mensagem enviada direto ao cliente após uma avaliação de 0 a 7."
          isSaving={savingKey === SATISFACTION_SURVEY_NPS_BAIXA_MESSAGE_TEMPLATE_KEY}
          onChange={(body) => setDraftBody(SATISFACTION_SURVEY_NPS_BAIXA_MESSAGE_TEMPLATE_KEY, body)}
          onSave={() => void handleSave(npsBaixaTemplate)}
          previewMessage={previewNpsBaixa}
          template={npsBaixaTemplate}
          title={`Follow-up NPS baixa (0–${SATISFACTION_SURVEY_NPS_BAIXA_MAX_SCORE})`}
          variables={NPS_BAIXA_TEMPLATE_VARIABLES}
        />

        <p className="text-sm text-muted-foreground">
          As perguntas da pesquisa são configuradas em{" "}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            to="/configuracoes/pesquisa-avaliacao"
          >
            Pesquisa de Avaliação
          </Link>
          .
        </p>
      </FollowupSection>
    </div>
  );
};
