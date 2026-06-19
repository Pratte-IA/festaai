import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  closingFormSectionLabels,
  isEventoMappedField,
  useTenantAcceptanceTerms,
  useTenantClosingForm,
} from "@/features/configuracoes";
import {
  CLIENT_FORM_SECTIONS,
  formatClosingFormResponseValue,
  getEventoFieldValueAsString,
  isClientFacingClosingFormField,
  isCustomClosingFormField,
  useEvento,
  useEventoAcceptanceResponses,
  useEventoClosingResponses,
} from "@/features/eventos";

interface ClientFormSubmissionViewProps {
  eventoId: number;
}

export const ClientFormSubmissionView = ({ eventoId }: ClientFormSubmissionViewProps) => {
  const { data: evento, error: eventoError, isLoading: isEventoLoading } = useEvento(eventoId);
  const { data: fields = [], isLoading: isFieldsLoading } = useTenantClosingForm();
  const { data: responses = {}, isLoading: isResponsesLoading } =
    useEventoClosingResponses(eventoId);
  const { data: acceptanceResponses = {}, isLoading: isAcceptanceLoading } =
    useEventoAcceptanceResponses(eventoId);
  const { data: acceptanceTerms = [], isLoading: isTermsLoading } = useTenantAcceptanceTerms();

  const groupedFields = useMemo(() => {
    if (!evento) return new Map<string, Array<{ label: string; value: string }>>();

    const groups = new Map<string, Array<{ label: string; value: string }>>();

    fields
      .filter(
        (field) =>
          field.active &&
          isClientFacingClosingFormField(field) &&
          CLIENT_FORM_SECTIONS.includes(field.section),
      )
      .sort((left, right) => {
        const sectionOrder =
          CLIENT_FORM_SECTIONS.indexOf(left.section) - CLIENT_FORM_SECTIONS.indexOf(right.section);
        if (sectionOrder !== 0) return sectionOrder;
        return left.sortOrder - right.sortOrder || Number(left.id) - Number(right.id);
      })
      .forEach((field) => {
        let rawValue = "";

        if (field.fieldType === "acceptance" && field.fieldKey) {
          const termId = field.config?.termId;
          if (typeof termId === "number" || typeof termId === "string") {
            rawValue = acceptanceResponses[String(termId)] ? "true" : "false";
          }
        } else if (field.fieldKey && isEventoMappedField(field.fieldKey)) {
          rawValue = getEventoFieldValueAsString(evento, field.fieldKey);
        } else if (isCustomClosingFormField(field)) {
          rawValue = responses[field.id] ?? "";
        }

        const value = formatClosingFormResponseValue(field.fieldType, rawValue);
        const sectionLabel = closingFormSectionLabels[field.section];
        const items = groups.get(sectionLabel) ?? [];
        items.push({ label: field.label, value });
        groups.set(sectionLabel, items);
      });

    const formTerms = acceptanceTerms
      .filter((term) => term.active && term.showInForm)
      .sort((left, right) => left.sortOrder - right.sortOrder || Number(left.id) - Number(right.id));

    if (formTerms.length > 0) {
      const sectionLabel = closingFormSectionLabels.aceites;
      const items = groups.get(sectionLabel) ?? [];

      formTerms.forEach((term) => {
        const accepted = acceptanceResponses[term.id] ?? false;
        items.push({
          label: term.title,
          value: accepted ? "Aceito" : "Não aceito",
        });
      });

      groups.set(sectionLabel, items);
    }

    return groups;
  }, [acceptanceResponses, acceptanceTerms, evento, fields, responses]);

  const isLoading =
    isEventoLoading || isFieldsLoading || isResponsesLoading || isAcceptanceLoading || isTermsLoading;

  if (isLoading) {
    return (
      <div className="glass-card flex h-40 items-center justify-center text-sm text-muted-foreground">
        Carregando respostas do formulário...
      </div>
    );
  }

  if (eventoError || !evento) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Não foi possível carregar as respostas deste formulário.
      </div>
    );
  }

  if (groupedFields.size === 0) {
    return (
      <div className="glass-card p-6 text-sm text-muted-foreground">
        Nenhuma resposta registrada para este formulário.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from(groupedFields.entries()).map(([sectionLabel, items]) => (
        <Card key={sectionLabel}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{sectionLabel}</CardTitle>
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
      ))}
    </div>
  );
};
