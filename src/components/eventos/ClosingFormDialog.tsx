import { FormEvent, useEffect, useMemo, useState } from "react";
import { FileCheck2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ClosingFormField,
  ClosingFormSection,
  closingFormSectionLabels,
  useTenantClosingForm,
} from "@/features/configuracoes";
import {
  Evento,
  useEventoClosingResponses,
  useSubmitClosingForm,
} from "@/features/eventos";
import { EventoClosingFieldKey } from "@/features/configuracoes/closing-form-types";

interface ClosingFormDialogProps {
  evento: Evento;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  open: boolean;
}

const SECTIONS: ClosingFormSection[] = [
  "cliente",
  "aniversariante",
  "festa",
  "financeiro",
  "contrato",
];

const getEventoFieldValue = (evento: Evento, fieldKey: EventoClosingFieldKey): string => {
  const value = evento[fieldKey];

  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value.toString();
  if (fieldKey === "hora_evento") return value.slice(0, 5);

  return String(value);
};

const buildInitialValues = (
  fields: ClosingFormField[],
  evento: Evento,
  savedResponses: Record<string, string>,
): Record<string, string> => {
  const values: Record<string, string> = {};

  fields.forEach((field) => {
    if (field.fieldKey && field.fieldKey in evento) {
      values[field.id] = getEventoFieldValue(evento, field.fieldKey as EventoClosingFieldKey);
      return;
    }

    values[field.id] = savedResponses[field.id] ?? "";
  });

  return values;
};

export const ClosingFormDialog = ({
  evento,
  onOpenChange,
  onSuccess,
  open,
}: ClosingFormDialogProps) => {
  const { data: fields = [], isLoading: isFieldsLoading } = useTenantClosingForm();
  const { data: savedResponses = {} } = useEventoClosingResponses(open ? evento.id : null);
  const submitClosingForm = useSubmitClosingForm();

  const activeFields = useMemo(
    () => fields.filter((field) => field.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [fields],
  );

  const fieldsBySection = useMemo(() => {
    const grouped = new Map<ClosingFormSection, ClosingFormField[]>();
    SECTIONS.forEach((section) => grouped.set(section, []));

    activeFields.forEach((field) => {
      const sectionFields = grouped.get(field.section) ?? [];
      sectionFields.push(field);
      grouped.set(field.section, sectionFields);
    });

    return grouped;
  }, [activeFields]);

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || isFieldsLoading) return;

    setFieldValues(buildInitialValues(activeFields, evento, savedResponses));
    setErrors({});
  }, [activeFields, evento, isFieldsLoading, open, savedResponses]);

  const updateFieldValue = (fieldId: string, value: string) => {
    setFieldValues((previous) => {
      const next = { ...previous, [fieldId]: value };

      const pacoteField = activeFields.find((field) => field.fieldKey === "valor_pacote");
      const adicionaisField = activeFields.find((field) => field.fieldKey === "valor_adicionais");
      const totalField = activeFields.find((field) => field.fieldKey === "valor_total");

      if (totalField && pacoteField && adicionaisField) {
        const pacote =
          fieldId === pacoteField.id ? value : (next[pacoteField.id] ?? "0");
        const adicionais =
          fieldId === adicionaisField.id ? value : (next[adicionaisField.id] ?? "0");
        next[totalField.id] = String(Number(pacote || 0) + Number(adicionais || 0));
      }

      return next;
    });

    setErrors((previous) => {
      if (!previous[fieldId]) return previous;
      const next = { ...previous };
      delete next[fieldId];
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    activeFields.forEach((field) => {
      if (!field.required) return;

      const value = fieldValues[field.id]?.trim() ?? "";
      if (field.fieldType === "checkbox") {
        if (value !== "true") nextErrors[field.id] = "Confirme este item para continuar.";
        return;
      }

      if (!value) nextErrors[field.id] = "Este campo é obrigatório.";
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await submitClosingForm.mutateAsync({
        eventoId: evento.id,
        fieldValues,
        fields: activeFields.map((field) => ({
          fieldKey: field.fieldKey,
          fieldType: field.fieldType,
          id: field.id,
          required: field.required,
        })),
      });

      onOpenChange(false);
      onSuccess?.();
    } catch {
      setErrors({ form: "Nao foi possivel confirmar o fechamento. Tente novamente." });
    }
  };

  const renderFieldInput = (field: ClosingFormField) => {
    const value = fieldValues[field.id] ?? "";
    const error = errors[field.id];
    const isReadOnlyTotal = field.fieldKey === "valor_total";

    if (field.fieldType === "textarea") {
      return (
        <Textarea
          id={`closing-field-${field.id}`}
          value={value}
          onChange={(event) => updateFieldValue(field.id, event.target.value)}
          className="text-sm"
        />
      );
    }

    if (field.fieldType === "checkbox") {
      return (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={value === "true"}
            onCheckedChange={(checked) => updateFieldValue(field.id, checked === true ? "true" : "")}
          />
          Confirmo as informações acima
        </label>
      );
    }

    return (
      <Input
        id={`closing-field-${field.id}`}
        type={
          field.fieldType === "currency" || field.fieldType === "number"
            ? "number"
            : field.fieldType === "date"
              ? "date"
              : field.fieldType === "time"
                ? "time"
                : field.fieldType === "email"
                  ? "email"
                  : "text"
        }
        value={value}
        readOnly={isReadOnlyTotal}
        min={field.fieldType === "number" || field.fieldType === "currency" ? "0" : undefined}
        step={field.fieldType === "currency" ? "0.01" : undefined}
        onChange={(event) => updateFieldValue(field.id, event.target.value)}
        className="text-sm"
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            Confirmar fechamento da festa
          </DialogTitle>
          <DialogDescription>
            Revise e confirme os dados com o cliente. Ao salvar, a festa avança para o funil Festa
            e os dados do contrato são atualizados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
          {isFieldsLoading && (
            <p className="text-sm text-muted-foreground">Carregando formulário...</p>
          )}

          {!isFieldsLoading && activeFields.length === 0 && (
            <p className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              Nenhum campo ativo. Configure o formulário em Configurações → Formulário de
              Fechamento.
            </p>
          )}

          {SECTIONS.map((section) => {
            const sectionFields = fieldsBySection.get(section) ?? [];
            if (sectionFields.length === 0) return null;

            return (
              <div key={section} className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {closingFormSectionLabels[section]}
                </h3>
                <div className="space-y-3 rounded-xl border border-border/40 bg-muted/10 p-4">
                  {sectionFields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      {field.fieldType !== "checkbox" && (
                        <Label htmlFor={`closing-field-${field.id}`} className="text-xs">
                          {field.label}
                          {field.required ? " *" : ""}
                        </Label>
                      )}
                      {renderFieldInput(field)}
                      {errors[field.id] && (
                        <p className="text-xs text-destructive">{errors[field.id]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitClosingForm.isPending || activeFields.length === 0}>
              {submitClosingForm.isPending ? "Confirmando..." : "Confirmar fechamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
