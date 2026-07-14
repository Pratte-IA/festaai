import { ArrowLeft, CalendarClock, Loader2, MessageCircle, Target } from "lucide-react";
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
  buildPerdidoFuturoFup1PreviewMessages,
  PERDIDO_FUTURO_PREVIEW,
} from "@/features/eventos/build-perdido-futuro-preview";
import {
  DEFAULT_PERDIDO_FUTURO_FUP1_DATA_INDISPONIVEL,
  DEFAULT_PERDIDO_FUTURO_FUP1_DATA_LIVRE,
  PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_INDISPONIVEL,
  PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_LIVRE,
} from "@/features/eventos/perdido-futuro-followup";
import { PERDIDO_FUTURO_FUP1_DAYS_BEFORE } from "@/features/eventos/perdido-futuro-schedule";
import {
  buildPerdidoReativacaoFop1PreviewMessage,
  buildPerdidoReativacaoFop2PreviewMessage,
  buildPerdidoReativacaoFop3PreviewMessage,
  PERDIDO_REATIVACAO_PREVIEW,
} from "@/features/eventos/build-perdido-reativacao-preview";
import {
  DEFAULT_PERDIDO_REATIVACAO_FOP1,
  DEFAULT_PERDIDO_REATIVACAO_FOP2,
  DEFAULT_PERDIDO_REATIVACAO_FOP3,
  PERDIDO_REATIVACAO_FOP1_MONTHS_BEFORE,
  PERDIDO_REATIVACAO_FOP1_TEMPLATE,
  PERDIDO_REATIVACAO_FOP2_DELAY_DAYS,
  PERDIDO_REATIVACAO_FOP2_TEMPLATE,
  PERDIDO_REATIVACAO_FOP3_DAYS_BEFORE,
  PERDIDO_REATIVACAO_FOP3_TEMPLATE,
} from "@/features/eventos/perdido-reativacao-followup";
import { useTenantCompanyProfile } from "@/features/guided-setup";
import { useCurrentTenant } from "@/features/tenants";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

const FUP_TEMPLATE_VARIABLES = [
  "{{primeiro_nome}}",
  "{{nome_aniversariante}}",
  "{{data_festa}}",
  "{{nome_empresa}}",
];

const TEMPLATE_VARIABLES = [
  "{{primeiro_nome}}",
  "{{nome_aniversariante}}",
  "{{mes_festa}}",
  "{{nome_empresa}}",
];

interface OportunidadeFollowupConfigProps {
  showSettingsHeader?: boolean;
}

export const OportunidadeFollowupConfig = ({ showSettingsHeader }: OportunidadeFollowupConfigProps) => {
  const { currentTenant } = useCurrentTenant();
  const { data: companyProfile } = useTenantCompanyProfile();
  const { getTemplate, handleSave, isLoading, savingKey, setDraftBody } = useFollowupTemplateEditor();

  const meta = SETTINGS_PAGE_META["followups/oportunidade"];

  const companyLegalName =
    companyProfile?.companyName?.trim() || currentTenant?.name?.trim() || "Sua Casa de Festas";

  const fop1Template = getTemplate(
    PERDIDO_REATIVACAO_FOP1_TEMPLATE,
    "Reativação FOP1 — 6 meses antes",
    DEFAULT_PERDIDO_REATIVACAO_FOP1,
  );
  const fop2Template = getTemplate(
    PERDIDO_REATIVACAO_FOP2_TEMPLATE,
    "Reativação FOP2 — 30 dias após FOP1",
    DEFAULT_PERDIDO_REATIVACAO_FOP2,
  );
  const fop3Template = getTemplate(
    PERDIDO_REATIVACAO_FOP3_TEMPLATE,
    "Reativação FOP3 — 90 dias antes da festa",
    DEFAULT_PERDIDO_REATIVACAO_FOP3,
  );
  const fupDataLivreTemplate = getTemplate(
    PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_LIVRE,
    "FUP1 — data livre",
    DEFAULT_PERDIDO_FUTURO_FUP1_DATA_LIVRE,
  );
  const fupDataIndisponivelTemplate = getTemplate(
    PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_INDISPONIVEL,
    "FUP1 — data indisponível",
    DEFAULT_PERDIDO_FUTURO_FUP1_DATA_INDISPONIVEL,
  );

  const previewFop1 = useMemo(
    () =>
      buildPerdidoReativacaoFop1PreviewMessage({
        aniversarianteNome: PERDIDO_REATIVACAO_PREVIEW.aniversarianteNome,
        clienteNome: PERDIDO_REATIVACAO_PREVIEW.clienteNome,
        companyLegalName,
        targetPartyDate: PERDIDO_REATIVACAO_PREVIEW.targetPartyDate,
        templateBody: fop1Template.body,
      }),
    [companyLegalName, fop1Template.body],
  );

  const previewFop2 = useMemo(
    () =>
      buildPerdidoReativacaoFop2PreviewMessage({
        aniversarianteNome: PERDIDO_REATIVACAO_PREVIEW.aniversarianteNome,
        clienteNome: PERDIDO_REATIVACAO_PREVIEW.clienteNome,
        companyLegalName,
        targetPartyDate: PERDIDO_REATIVACAO_PREVIEW.targetPartyDate,
        templateBody: fop2Template.body,
      }),
    [companyLegalName, fop2Template.body],
  );

  const previewFop3 = useMemo(
    () =>
      buildPerdidoReativacaoFop3PreviewMessage({
        aniversarianteNome: PERDIDO_REATIVACAO_PREVIEW.aniversarianteNome,
        clienteNome: PERDIDO_REATIVACAO_PREVIEW.clienteNome,
        companyLegalName,
        targetPartyDate: PERDIDO_REATIVACAO_PREVIEW.targetPartyDate,
        templateBody: fop3Template.body,
      }),
    [companyLegalName, fop3Template.body],
  );

  const previewFup = useMemo(
    () =>
      buildPerdidoFuturoFup1PreviewMessages({
        aniversarianteNome: PERDIDO_FUTURO_PREVIEW.aniversarianteNome,
        clienteNome: PERDIDO_FUTURO_PREVIEW.clienteNome,
        companyLegalName,
        dataEvento: PERDIDO_FUTURO_PREVIEW.dataEvento,
        dataIndisponivelBody: fupDataIndisponivelTemplate.body,
        dataLivreBody: fupDataLivreTemplate.body,
      }),
    [
      companyLegalName,
      fupDataIndisponivelTemplate.body,
      fupDataLivreTemplate.body,
    ],
  );

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando follow-ups...
      </div>
    );
  }

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
                <SettingsStatChip>FUP1: {PERDIDO_FUTURO_FUP1_DAYS_BEFORE} dias antes</SettingsStatChip>
                <SettingsStatChip>FOP1: 6 meses antes do mês da festa</SettingsStatChip>
                <SettingsStatChip>FOP2: +30 dias</SettingsStatChip>
                <SettingsStatChip>FOP3: 90 dias antes da festa</SettingsStatChip>
              </>
            }
          />
        </>
      ) : null}

      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground space-y-2">
        <p className="text-foreground font-medium">Follow-ups de oportunidade</p>
        <p>
          Sequências automáticas para reativar leads perdidos e recuperar oportunidades comerciais fora do
          funil ativo de proposta.
        </p>
        <p>
          Cada mensagem enviada fica registrada na memória do agente de atendimento, para que, quando o
          cliente responder, a IA saiba exatamente o que já foi dito.
        </p>
      </div>

      <div className="border-t border-border/60 pt-8 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              Festa futura — lead perdido (FUP1)
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Para leads em Perdido cuja festa ainda vai acontecer. Um único disparo{" "}
            <strong>{PERDIDO_FUTURO_FUP1_DAYS_BEFORE} dias antes</strong> da data da festa, com variante
            conforme disponibilidade na agenda.
          </p>
        </div>

        <FollowupSection>
          <FollowupRuleCard title="Regra de disparo — FUP1">
            <FollowupRuleList>
              <li>
                Lead em <strong>Perdido</strong> com festa ainda no futuro (
                <span className="text-foreground">data da festa à frente</span>)
              </li>
              <li>
                Disparo <span className="text-foreground">{PERDIDO_FUTURO_FUP1_DAYS_BEFORE} dias</span>{" "}
                antes da data da festa
              </li>
              <li>
                <strong>Data livre</strong> ou <strong>data indisponível</strong> — mesma lógica do follow-up
                comercial (FU1)
              </li>
              <li>Se responder → Proposta Enviada + reinicia FU1–FU4</li>
              <li>Sem resposta → badge <strong>FUP1 ✓</strong> no Kanban</li>
            </FollowupRuleList>
          </FollowupRuleCard>
          <FollowupTemplateEditor
            description="Quando a data da festa ainda está livre na agenda."
            isSaving={savingKey === PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_LIVRE}
            onChange={(body) => setDraftBody(PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_LIVRE, body)}
            onSave={() => void handleSave(fupDataLivreTemplate)}
            previewMessage={previewFup.dataLivre}
            template={fupDataLivreTemplate}
            title="FUP1 — data livre"
            variables={FUP_TEMPLATE_VARIABLES}
          />
          <FollowupTemplateEditor
            description="Quando a data já foi reservada por outra família."
            isSaving={savingKey === PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_INDISPONIVEL}
            onChange={(body) => setDraftBody(PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_INDISPONIVEL, body)}
            onSave={() => void handleSave(fupDataIndisponivelTemplate)}
            previewMessage={previewFup.dataIndisponivel}
            template={fupDataIndisponivelTemplate}
            title="FUP1 — data indisponível"
            variables={FUP_TEMPLATE_VARIABLES}
          />
        </FollowupSection>
      </div>

      <div className="border-t border-border/60 pt-8 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              Reativação — festa já realizada (FOP1/FOP2/FOP3)
            </h2>
          </div>
        <p className="text-sm text-muted-foreground">
          Para leads em Perdido cuja festa já aconteceu. A sequência tenta reativar a venda no aniversário
          do ano seguinte.
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
              Automações → Follow-up de Oportunidade
            </Link>
            . Se o cliente responder, o lead vai para Proposta Enviada e reinicia o fluxo comercial
            (FU1–FU4). Sem resposta, badges FOP1/FOP2/FOP3 aparecem no Kanban.
          </p>
        </div>
      </div>

      <FollowupSection>
        <FollowupRuleCard title="Regra de disparo — FOP1">
          <FollowupRuleList>
            <li>
              Lead em <strong>Perdido</strong> com festa já realizada (
              <span className="text-foreground">data da festa no passado</span>)
            </li>
            <li>
              <span className="text-foreground">{PERDIDO_REATIVACAO_FOP1_MONTHS_BEFORE} meses</span> antes
              do mês da festa no ano seguinte
            </li>
            <li>
              Sem nome do aniversariante, a mensagem usa{" "}
              <span className="text-foreground">seu filho(a)</span>
            </li>
          </FollowupRuleList>
        </FollowupRuleCard>
        <FollowupTemplateEditor
          description="Primeira tentativa de reativação para o aniversário do próximo ano."
          isSaving={savingKey === PERDIDO_REATIVACAO_FOP1_TEMPLATE}
          onChange={(body) => setDraftBody(PERDIDO_REATIVACAO_FOP1_TEMPLATE, body)}
          onSave={() => void handleSave(fop1Template)}
          previewMessage={previewFop1}
          template={fop1Template}
          title="FOP1 — 6 meses antes do mês da festa"
          variables={TEMPLATE_VARIABLES}
        />
      </FollowupSection>

      <FollowupSection>
        <FollowupRuleCard title="Regra de disparo — FOP2">
          <FollowupRuleList>
            <li>
              <span className="text-foreground">{PERDIDO_REATIVACAO_FOP2_DELAY_DAYS} dias</span> após o
              FOP1, sem resposta do cliente
            </li>
            <li>
              Badge <strong>FOP1 ✓</strong> no Kanban enquanto aguarda
            </li>
          </FollowupRuleList>
        </FollowupRuleCard>
        <FollowupTemplateEditor
          description="Segunda tentativa, 30 dias após o FOP1."
          isSaving={savingKey === PERDIDO_REATIVACAO_FOP2_TEMPLATE}
          onChange={(body) => setDraftBody(PERDIDO_REATIVACAO_FOP2_TEMPLATE, body)}
          onSave={() => void handleSave(fop2Template)}
          previewMessage={previewFop2}
          template={fop2Template}
          title="FOP2 — 30 dias após FOP1"
          variables={TEMPLATE_VARIABLES}
        />
      </FollowupSection>

      <FollowupSection>
        <FollowupRuleCard title="Regra de disparo — FOP3">
          <FollowupRuleList>
            <li>
              <span className="text-foreground">{PERDIDO_REATIVACAO_FOP3_DAYS_BEFORE} dias</span> antes da
              data da festa alvo no ano seguinte
            </li>
            <li>Última tentativa do ciclo — após FOP2 sem resposta</li>
            <li>Se não houver resposta, o ciclo reinicia no ano seguinte</li>
          </FollowupRuleList>
        </FollowupRuleCard>
        <FollowupTemplateEditor
          description="Terceira e última tentativa do ciclo (~3 meses antes da festa)."
          isSaving={savingKey === PERDIDO_REATIVACAO_FOP3_TEMPLATE}
          onChange={(body) => setDraftBody(PERDIDO_REATIVACAO_FOP3_TEMPLATE, body)}
          onSave={() => void handleSave(fop3Template)}
          previewMessage={previewFop3}
          template={fop3Template}
          title="FOP3 — 90 dias antes da festa"
          variables={TEMPLATE_VARIABLES}
        />
      </FollowupSection>
      </div>
    </div>
  );
};
