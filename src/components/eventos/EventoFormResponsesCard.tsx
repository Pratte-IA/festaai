import { useMemo } from "react";
import { ClipboardList } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  closingFormSectionLabels,
  useTenantClosingForm,
} from "@/features/configuracoes";
import {
  CLOSING_FORM_SECTIONS,
  formatClosingFormResponseValue,
  isCustomClosingFormField,
  useEventoClosingResponses,
} from "@/features/eventos";

interface EventoFormResponsesCardProps {
  eventoId: number;
  hasFormSubmission?: boolean;
}

export const EventoFormResponsesCard = ({
  eventoId,
  hasFormSubmission = false,
}: EventoFormResponsesCardProps) => {
  const { data: fields = [], isLoading: isFieldsLoading } = useTenantClosingForm();
  const { data: responses = {}, isLoading: isResponsesLoading } = useEventoClosingResponses(eventoId);

  const groupedResponses = useMemo(() => {
    const customFields = fields
      .filter((field) => field.active && isCustomClosingFormField(field))
      .sort((a, b) => {
        const sectionOrder =
          CLOSING_FORM_SECTIONS.indexOf(a.section) - CLOSING_FORM_SECTIONS.indexOf(b.section);
        if (sectionOrder !== 0) return sectionOrder;
        return a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id);
      });

    const groups = new Map<string, Array<{ label: string; value: string }>>();

    customFields.forEach((field) => {
      const rawValue = responses[field.id] ?? "";
      const shouldShow = rawValue.trim() !== "" || hasFormSubmission;
      if (!shouldShow) return;

      const sectionLabel = closingFormSectionLabels[field.section];
      const items = groups.get(sectionLabel) ?? [];
      items.push({
        label: field.label,
        value: formatClosingFormResponseValue(field.fieldType, rawValue),
      });
      groups.set(sectionLabel, items);
    });

    return groups;
  }, [fields, hasFormSubmission, responses]);

  const isLoading = isFieldsLoading || isResponsesLoading;
  const hasResponses = groupedResponses.size > 0;

  if (!isLoading && !hasResponses) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-festa-blue" />
          Respostas do formulário
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Perguntas personalizadas que o cliente preencheu no formulário de contratação.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading && (
          <p className="text-sm text-muted-foreground italic">Carregando respostas...</p>
        )}

        {!isLoading &&
          Array.from(groupedResponses.entries()).map(([sectionLabel, items]) => (
            <div key={sectionLabel} className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {sectionLabel}
              </p>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5"
                  >
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground whitespace-pre-wrap">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
};
