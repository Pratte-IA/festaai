import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClosingFormFieldType,
  ClosingFormSection,
  closingFormFieldTypeLabels,
  closingFormSectionLabels,
  useCreateClosingFormField,
  useDeleteClosingFormField,
  useTenantClosingForm,
  useUpdateClosingFormField,
} from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";

const SECTIONS: ClosingFormSection[] = [
  "cliente",
  "aniversariante",
  "festa",
  "financeiro",
  "contrato",
];

const ClosingFormConfig = () => {
  const { data: fields = [], isLoading } = useTenantClosingForm();
  const createField = useCreateClosingFormField();
  const updateField = useUpdateClosingFormField();
  const deleteField = useDeleteClosingFormField();

  const [newFieldSection, setNewFieldSection] = useState<ClosingFormSection>("contrato");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<ClosingFormFieldType>("text");

  const fieldsBySection = useMemo(() => {
    const grouped = new Map<ClosingFormSection, typeof fields>();

    SECTIONS.forEach((section) => grouped.set(section, []));

    fields.forEach((field) => {
      const sectionFields = grouped.get(field.section) ?? [];
      sectionFields.push(field);
      grouped.set(field.section, sectionFields);
    });

    return grouped;
  }, [fields]);

  const toggleField = async (fieldId: string, active: boolean) => {
    try {
      await updateField.mutateAsync({ active, fieldId });
    } catch {
      toast({ title: "Nao foi possivel atualizar o campo", variant: "destructive" });
    }
  };

  const toggleRequired = async (fieldId: string, required: boolean) => {
    try {
      await updateField.mutateAsync({ fieldId, required });
    } catch {
      toast({ title: "Nao foi possivel atualizar o campo", variant: "destructive" });
    }
  };

  const removeField = async (fieldId: string) => {
    try {
      await deleteField.mutateAsync(fieldId);
      toast({ title: "Campo removido" });
    } catch {
      toast({ title: "Nao foi possivel remover o campo", variant: "destructive" });
    }
  };

  const addCustomField = async () => {
    const label = newFieldLabel.trim();
    if (!label) return;

    try {
      await createField.mutateAsync({
        fieldType: newFieldType,
        label,
        required: false,
        section: newFieldSection,
      });
      toast({ title: "Campo adicionado" });
      setNewFieldLabel("");
    } catch {
      toast({ title: "Nao foi possivel adicionar o campo", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Formulário de Fechamento</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Defina os campos que o cliente confirma ao fechar a festa. Campos do sistema preenchem
          automaticamente os dados do contrato e do evento.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando formulário...</p>}

      {SECTIONS.map((section) => {
        const sectionFields = fieldsBySection.get(section) ?? [];

        return (
          <div key={section} className="glass-card overflow-hidden">
            <div className="border-b border-border/30 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                {closingFormSectionLabels[section]}
              </h3>
            </div>

            <div className="divide-y divide-border/20">
              {sectionFields.length === 0 && (
                <p className="px-4 py-6 text-sm text-muted-foreground italic">
                  Nenhum campo nesta seção.
                </p>
              )}

              {sectionFields.map((field) => (
                <div key={field.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{field.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {closingFormFieldTypeLabels[field.fieldType]}
                      {field.isSystem ? " · Campo do sistema" : " · Campo personalizado"}
                      {field.fieldKey ? ` · ${field.fieldKey}` : ""}
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={() => void toggleRequired(field.id, !field.required)}
                      className="rounded border-border"
                    />
                    Obrigatório
                  </label>

                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={field.active}
                      onChange={() => void toggleField(field.id, !field.active)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-muted transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-foreground after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-4 peer-checked:after:bg-primary-foreground" />
                  </label>

                  {!field.isSystem && (
                    <button
                      type="button"
                      onClick={() => void removeField(field.id)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Adicionar campo personalizado</h3>
        <p className="text-xs text-muted-foreground">
          Use para perguntas extras do contrato, como CPF, endereço ou condições especiais.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={newFieldSection}
            onValueChange={(value) => setNewFieldSection(value as ClosingFormSection)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seção" />
            </SelectTrigger>
            <SelectContent>
              {SECTIONS.map((section) => (
                <SelectItem key={section} value={section}>
                  {closingFormSectionLabels[section]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={newFieldType}
            onValueChange={(value) => setNewFieldType(value as ClosingFormFieldType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(closingFormFieldTypeLabels) as ClosingFormFieldType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {closingFormFieldTypeLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Rótulo do campo"
            value={newFieldLabel}
            onChange={(event) => setNewFieldLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void addCustomField();
            }}
          />

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => void addCustomField()}
            disabled={createField.isPending}
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClosingFormConfig;
