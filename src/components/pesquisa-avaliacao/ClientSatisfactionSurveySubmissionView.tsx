import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatSatisfactionSurveyResponseValue,
  resolveSatisfactionSurveyLabel,
  useEventoSatisfactionResponses,
  useTenantSatisfactionSurvey,
} from "@/features/configuracoes";
import { useEvento } from "@/features/eventos";
import { useTenantCompanyProfile } from "@/features/guided-setup";
import { useCurrentTenant } from "@/features/tenants";

interface ClientSatisfactionSurveySubmissionViewProps {
  eventoId: number;
}

export const ClientSatisfactionSurveySubmissionView = ({
  eventoId,
}: ClientSatisfactionSurveySubmissionViewProps) => {
  const { currentTenant } = useCurrentTenant();
  const { data: companyProfile } = useTenantCompanyProfile();
  const { data: evento, error: eventoError, isLoading: isEventoLoading } = useEvento(eventoId);
  const { data: questions = [], isLoading: isQuestionsLoading } = useTenantSatisfactionSurvey();
  const { data: responses = {}, isLoading: isResponsesLoading } =
    useEventoSatisfactionResponses(eventoId);

  const items = useMemo(() => {
    const companyName =
      companyProfile?.companyName?.trim() || currentTenant?.name?.trim() || null;

    return questions
      .filter((question) => question.active)
      .sort((left, right) => left.sortOrder - right.sortOrder || Number(left.id) - Number(right.id))
      .map((question) => ({
        label: resolveSatisfactionSurveyLabel(question.label, companyName),
        value: formatSatisfactionSurveyResponseValue(
          question.questionType,
          responses[question.id] ?? "",
          question.config,
        ),
      }));
  }, [companyProfile?.companyName, currentTenant?.name, questions, responses]);

  const isLoading = isEventoLoading || isQuestionsLoading || isResponsesLoading;

  if (isLoading) {
    return (
      <div className="glass-card flex h-40 items-center justify-center text-sm text-muted-foreground">
        Carregando respostas da pesquisa...
      </div>
    );
  }

  if (eventoError || !evento) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Não foi possível carregar as respostas desta pesquisa.
      </div>
    );
  }

  if (!evento.satisfaction_survey_preenchido_em) {
    return (
      <div className="glass-card p-6 text-sm text-muted-foreground">
        O cliente ainda não respondeu a pesquisa de avaliação.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-card p-6 text-sm text-muted-foreground">
        Nenhuma resposta registrada para esta pesquisa.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Respostas da pesquisa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5"
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm font-medium text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
