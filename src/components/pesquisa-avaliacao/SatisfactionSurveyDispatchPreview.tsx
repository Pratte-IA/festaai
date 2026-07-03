import { MessageCircle } from "lucide-react";
import { useMemo } from "react";

import {
  buildSatisfactionSurveyDispatchMessage,
  SATISFACTION_SURVEY_DISPATCH_PREVIEW,
} from "@/features/public-satisfaction-survey/dispatch-message";
import { buildPublicSatisfactionSurveyUrl } from "@/features/public-satisfaction-survey";
import { useTenantCompanyProfile } from "@/features/guided-setup";
import { useCurrentTenant } from "@/features/tenants";
import { formatCompanyDisplayName } from "@/lib/company-display-name";

export const SatisfactionSurveyDispatchPreview = () => {
  const { currentTenant } = useCurrentTenant();
  const { data: companyProfile } = useTenantCompanyProfile();

  const previewMessage = useMemo(() => {
    const companyLegalName =
      companyProfile?.companyName?.trim() || currentTenant?.name?.trim() || "Sua Casa de Festas";
    const tenantSlug = currentTenant?.slug?.trim() || "sua-casa";

    const surveyUrl = buildPublicSatisfactionSurveyUrl(
      tenantSlug,
      SATISFACTION_SURVEY_DISPATCH_PREVIEW.eventoId,
    );

    return buildSatisfactionSurveyDispatchMessage({
      aniversarianteNome: SATISFACTION_SURVEY_DISPATCH_PREVIEW.aniversarianteNome,
      clienteNome: SATISFACTION_SURVEY_DISPATCH_PREVIEW.clienteNome,
      companyLegalName,
      surveyUrl,
    });
  }, [companyProfile?.companyName, currentTenant?.name, currentTenant?.slug]);

  const companyDisplayName = formatCompanyDisplayName(
    companyProfile?.companyName?.trim() || currentTenant?.name?.trim() || "Sua Casa de Festas",
  );

  return (
    <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Prévia da mensagem no WhatsApp</p>
          <p className="text-sm text-muted-foreground">
            Enviada automaticamente no dia seguinte à festa, pelo número vinculado em Automações →
            Pesquisa de Satisfação. Os nomes abaixo são exemplos — no disparo real usamos os dados
            de cada evento e o nome comercial{" "}
            <span className="font-medium text-foreground">{companyDisplayName}</span>.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-background/80 p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{previewMessage}</p>
      </div>
    </div>
  );
};
