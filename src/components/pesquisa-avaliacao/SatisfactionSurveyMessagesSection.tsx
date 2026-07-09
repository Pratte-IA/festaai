import { MessageCircle } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { FollowupMessagePreview } from "@/components/followup-proposta/FollowupMessagePreview";
import {
  FollowupRuleCard,
  FollowupRuleList,
  FollowupSection,
} from "@/components/followup-proposta/FollowupRuleCard";
import {
  buildSatisfactionSurveyDispatchMessage,
  buildPublicSatisfactionSurveyUrl,
  SATISFACTION_SURVEY_DISPATCH_PREVIEW,
} from "@/features/public-satisfaction-survey";
import { useTenantCompanyProfile } from "@/features/guided-setup";
import { useCurrentTenant } from "@/features/tenants";
import { formatCompanyDisplayName } from "@/lib/company-display-name";

interface SatisfactionSurveyMessagesSectionProps {
  showFollowupLink?: boolean;
}

export const SatisfactionSurveyMessagesSection = ({
  showFollowupLink = true,
}: SatisfactionSurveyMessagesSectionProps) => {
  const { currentTenant } = useCurrentTenant();
  const { data: companyProfile } = useTenantCompanyProfile();

  const companyLegalName =
    companyProfile?.companyName?.trim() || currentTenant?.name?.trim() || "Sua Casa de Festas";
  const tenantSlug = currentTenant?.slug?.trim() || "sua-casa";

  const initialPreview = useMemo(
    () =>
      buildSatisfactionSurveyDispatchMessage({
        aniversarianteNome: SATISFACTION_SURVEY_DISPATCH_PREVIEW.aniversarianteNome,
        clienteNome: SATISFACTION_SURVEY_DISPATCH_PREVIEW.clienteNome,
        companyLegalName,
        surveyUrl: buildPublicSatisfactionSurveyUrl(
          tenantSlug,
          SATISFACTION_SURVEY_DISPATCH_PREVIEW.eventoId,
        ),
      }),
    [companyLegalName, tenantSlug],
  );

  const companyDisplayName = formatCompanyDisplayName(companyLegalName);

  return (
    <FollowupSection>
      <FollowupRuleCard title="Regras de disparo — Envio inicial da pesquisa">
        <FollowupRuleList>
          <li>
            Disparada automaticamente quando a festa entra em <strong>Aguardando Feedback</strong> (funil
            Executadas)
          </li>
          <li>No dia seguinte à data da festa, via transição pós-festa</li>
          <li>Envio único por evento — não repete o envio inicial</li>
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
            . No envio real usamos os dados de cada evento e o nome comercial{" "}
            <span className="font-medium text-foreground">{companyDisplayName}</span>.
          </p>
        </div>
      </div>

      <FollowupMessagePreview
        description="Mensagem automática com link da pesquisa pós-festa."
        message={initialPreview}
        title="Mensagem inicial da pesquisa"
      />

      {showFollowupLink ? (
        <p className="text-sm text-muted-foreground">
          O lembrete automático (24h sem resposta) é configurado em{" "}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            to="/configuracoes/followups/pos-festa"
          >
            Follow-ups automáticos → Pós Festa
          </Link>
          .
        </p>
      ) : null}
    </FollowupSection>
  );
};
