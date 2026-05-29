import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClosingFormField,
  ClosingFormFieldType,
  ClosingFormSection,
  CUSTOM_CLOSING_FIELD_TYPES,
  STRUCTURE_FORM_SECTIONS,
  closingFormFieldTypeLabels,
  closingFormSectionLabels,
  useCreateClosingFormField,
  useDeleteClosingFormField,
  useReorderClosingFormField,
  useTenantClosingForm,
  useUpdateClosingFormField,
} from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";

import {
  FormFieldEditorDialog,
  FormFieldEditorValues,
} from "./FormFieldEditorDialog";
import { FormFieldRow } from "./FormFieldRow";

const ACEITES_EMPTY_MESSAGE =
  "Os termos de aceite são configurados na aba Aceites e Regras. Esta seção não usa campos do formulário.";

export const FormStructureTab = () => {
  const { data: fields = [], isLoading } = useTenantClosingForm();
  const createField = useCreateClosingFormField();
  const updateField = useUpdateClosingFormField();
  const deleteField = useDeleteClosingFormField();
  const reorderField = useReorderClosingFormField();

  const [editingField, setEditingField] = useState<ClosingFormField | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busyFieldId, setBusyFieldId] = useState<string | null>(null);

  const [newFieldSection, setNewFieldSection] = useState<ClosingFormSection>("contrato");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<ClosingFormFieldType>("text");

  const fieldsBySection = useMemo(() => {
    const grouped = new Map<ClosingFormSection, ClosingFormField[]>();
    STRUCTURE_FORM_SECTIONS.forEach((section) => grouped.set(section, []));

    fields.forEach((field) => {
      if (!STRUCTURE_FORM_SECTIONS.includes(field.section)) return;
      const sectionFields = grouped.get(field.section) ?? [];
      sectionFields.push(field);
      grouped.set(field.section, sectionFields);
    });

    grouped.forEach((sectionFields, section) => {
      grouped.set(
        section,
        [...sectionFields].sort((a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id)),
      );
    });

    return grouped;
  }, [fields]);

  const isMutating =
    createField.isPending ||
    updateField.isPending ||
    deleteField.isPending ||
    reorderField.isPending;

  const runFieldAction = async (fieldId: string, action: () => Promise<void>) => {
    setBusyFieldId(fieldId);
    try {
      await action();
    } catch {
      toast({ title: "Não foi possível atualizar o campo", variant: "destructive" });
    } finally {
      setBusyFieldId(null);
    }
  };

  const handleToggleActive = (field: ClosingFormField, active: boolean) => {
    if (field.isLocked && !active) return;
    void runFieldAction(field.id, () => updateField.mutateAsync({ active, fieldId: field.id }));
  };

  const handleToggleRequired = (field: ClosingFormField, required: boolean) => {
    if (field.isLocked && field.required && !required) return;
    void runFieldAction(field.id, () => updateField.mutateAsync({ fieldId: field.id, required }));
  };

  const handleMove = (field: ClosingFormField, direction: "down" | "up") => {
    void runFieldAction(field.id, () => reorderField.mutateAsync({ direction, fieldId: field.id }));
  };

  const handleDelete = (field: ClosingFormField) => {
    if (field.isSystem) return;
    void runFieldAction(field.id, async () => {
      await deleteField.mutateAsync(field.id);
      toast({ title: "Campo removido" });
    });
  };

  const handleEdit = (field: ClosingFormField) => {
    setEditingField(field);
    setEditorOpen(true);
  };

  const handleSaveEdit = async (field: ClosingFormField, updates: FormFieldEditorValues) => {
    try {
      await updateField.mutateAsync({
        active: updates.active,
        category: updates.category,
        config: updates.config,
        description: updates.description.trim() || null,
        fieldId: field.id,
        fieldType: field.isSystem ? undefined : updates.fieldType,
        label: field.isSystem ? undefined : updates.label.trim(),
        required: updates.required,
        section: field.isSystem ? undefined : updates.section,
        usage: updates.usage,
      });
      toast({ title: "Campo atualizado" });
      setEditorOpen(false);
      setEditingField(null);
    } catch {
      toast({ title: "Não foi possível salvar o campo", variant: "destructive" });
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
      toast({ title: "Não foi possível adicionar o campo", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card/30 p-4">
        <p className="text-sm text-muted-foreground">
          Configure os campos do formulário de contratação. Campos do sistema alimentam contrato,
          operação e automações. Campos personalizados permitem perguntas extras com categoria e
          destino definidos.
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Carregando estrutura do formulário...</p>
      )}

      {!isLoading &&
        STRUCTURE_FORM_SECTIONS.map((section) => {
          const sectionFields = fieldsBySection.get(section) ?? [];
          const activeCount = sectionFields.filter((field) => field.active).length;

          return (
            <div key={section} className="glass-card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {closingFormSectionLabels[section]}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {sectionFields.length === 0
                      ? "Nenhum campo"
                      : `${activeCount} ativo${activeCount === 1 ? "" : "s"} de ${sectionFields.length}`}
                  </p>
                </div>
              </div>

              <div>
                {section === "aceites" && sectionFields.length === 0 && (
                  <p className="px-4 py-6 text-sm leading-relaxed text-muted-foreground">
                    {ACEITES_EMPTY_MESSAGE}
                  </p>
                )}

                {section !== "aceites" && sectionFields.length === 0 && (
                  <p className="px-4 py-6 text-sm italic text-muted-foreground">
                    Nenhum campo nesta seção. Adicione um campo personalizado abaixo, se necessário.
                  </p>
                )}

                {sectionFields.map((field, index) => (
                  <FormFieldRow
                    key={field.id}
                    field={field}
                    canMoveUp={index > 0}
                    canMoveDown={index < sectionFields.length - 1}
                    isBusy={busyFieldId === field.id || isMutating}
                    onEdit={handleEdit}
                    onMove={handleMove}
                    onToggleActive={handleToggleActive}
                    onToggleRequired={handleToggleRequired}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          );
        })}

      <div className="glass-card space-y-4 p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Adicionar campo personalizado</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Campos extras com tipo, categoria e destinos definidos. Nada de campos soltos sem
            finalidade.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Seção</Label>
            <Select
              value={newFieldSection}
              onValueChange={(value) => setNewFieldSection(value as ClosingFormSection)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seção" />
              </SelectTrigger>
              <SelectContent>
                {STRUCTURE_FORM_SECTIONS.filter((section) => section !== "aceites").map(
                  (section) => (
                    <SelectItem key={section} value={section}>
                      {closingFormSectionLabels[section]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select
              value={newFieldType}
              onValueChange={(value) => setNewFieldType(value as ClosingFormFieldType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {CUSTOM_CLOSING_FIELD_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {closingFormFieldTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label className="text-xs">Nome do campo</Label>
            <Input
              placeholder="Ex.: Restrição alimentar"
              value={newFieldLabel}
              onChange={(event) => setNewFieldLabel(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void addCustomField();
              }}
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => void addCustomField()}
              disabled={createField.isPending || !newFieldLabel.trim()}
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      <FormFieldEditorDialog
        field={editingField}
        open={editorOpen}
        isSaving={updateField.isPending}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingField(null);
        }}
        onSave={(field, updates) => void handleSaveEdit(field, updates)}
      />
    </div>
  );
};
