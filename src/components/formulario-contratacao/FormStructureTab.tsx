import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  isClosingFormSelectFieldType,
  parseOptionsFromLines,
  useCreateClosingFormField,
  useDeleteClosingFormField,
  useReorderClosingFormField,
  useTenantClosingForm,
  useTenantPackages,
  useUpdateClosingFormField,
} from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";

import {
  ClosingFormPackageApplicabilityField,
  formatClosingFormFieldPackageLabels,
} from "./ClosingFormPackageApplicabilityField";
import {
  FormFieldEditorDialog,
  FormFieldEditorValues,
} from "./FormFieldEditorDialog";
import { FormFieldRow } from "./FormFieldRow";

const ACEITES_EMPTY_MESSAGE =
  "Os termos de aceite são configurados na aba Aceites e Regras. Esta seção não usa campos do formulário.";

const scrollToClosingFormSection = (section: ClosingFormSection) => {
  window.requestAnimationFrame(() => {
    document
      .getElementById(`closing-form-section-${section}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
};

interface FormStructureTabProps {
  onRegisterPendingSave?: (handler: () => Promise<boolean>) => void;
}

export const FormStructureTab = ({ onRegisterPendingSave }: FormStructureTabProps) => {
  const { data: fields = [], isLoading } = useTenantClosingForm();
  const { data: packages = [] } = useTenantPackages();
  const packageOptions = useMemo(
    () => packages.map((pkg) => ({ id: pkg.id, name: pkg.name })),
    [packages],
  );
  const createField = useCreateClosingFormField();
  const updateField = useUpdateClosingFormField();
  const deleteField = useDeleteClosingFormField();
  const reorderField = useReorderClosingFormField();

  const [editingField, setEditingField] = useState<ClosingFormField | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busyFieldId, setBusyFieldId] = useState<string | null>(null);

  const [newFieldSection, setNewFieldSection] = useState<ClosingFormSection>("festa");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<ClosingFormFieldType>("text");
  const [newFieldPackageIds, setNewFieldPackageIds] = useState<string[]>([]);
  const [newFieldOptionsText, setNewFieldOptionsText] = useState("");

  const showNewFieldOptions = isClosingFormSelectFieldType(newFieldType);
  const parsedNewFieldOptions = parseOptionsFromLines(newFieldOptionsText);
  const newFieldOptionsInsufficient =
    showNewFieldOptions && newFieldLabel.trim() && parsedNewFieldOptions.length < 2;

  const savePendingField = useCallback(async (): Promise<boolean> => {
    const label = newFieldLabel.trim();
    if (!label) return false;

    const options = showNewFieldOptions ? parseOptionsFromLines(newFieldOptionsText) : [];
    if (showNewFieldOptions && options.length < 2) {
      toast({
        title: "Complete as opções de resposta",
        description:
          "Para seleção única ou múltipla, liste pelo menos duas opções — uma em cada linha.",
        variant: "destructive",
      });
      throw new Error("Opções de resposta incompletas.");
    }

    const createdField = await createField.mutateAsync({
      config: showNewFieldOptions ? { options } : {},
      fieldType: newFieldType,
      label,
      packageIds: newFieldPackageIds,
      required: false,
      section: newFieldSection,
    });

    toast({
      title: "Pergunta salva",
      description: `«${label}» foi adicionada na seção ${closingFormSectionLabels[newFieldSection]}.`,
    });
    setNewFieldLabel("");
    setNewFieldPackageIds([]);
    setNewFieldOptionsText("");
    scrollToClosingFormSection(createdField.section);
    return true;
  }, [
    createField,
    newFieldLabel,
    newFieldOptionsText,
    newFieldPackageIds,
    newFieldSection,
    newFieldType,
    showNewFieldOptions,
  ]);

  useEffect(() => {
    if (!onRegisterPendingSave) return;
    onRegisterPendingSave(savePendingField);
  }, [onRegisterPendingSave, savePendingField]);

  const addCustomField = async () => {
    try {
      await savePendingField();
    } catch (error) {
      if (error instanceof Error && error.message === "Opções de resposta incompletas.") return;
      toast({
        title: "Não foi possível salvar a pergunta",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

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
        packageIds: field.isSystem ? undefined : updates.packageIds,
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
            <div
              key={section}
              id={`closing-form-section-${section}`}
              className="glass-card overflow-hidden scroll-mt-6"
            >
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
                    packageLabel={formatClosingFormFieldPackageLabels(field.packageIds, packageOptions)}
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
            finalidade. O campo aparece na seção escolhida acima — role a página para conferir após
            adicionar.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <ClosingFormPackageApplicabilityField
              packages={packageOptions}
              selectedIds={newFieldPackageIds}
              onChange={setNewFieldPackageIds}
            />
          </div>

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
              onValueChange={(value) => {
                const nextType = value as ClosingFormFieldType;
                setNewFieldType(nextType);
                if (!isClosingFormSelectFieldType(nextType)) setNewFieldOptionsText("");
              }}
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
            {newFieldType === "select" && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                O cliente escolhe <span className="font-medium text-foreground">uma</span> opção
                (ex.: Buffet ou Garçom serve nas mesas).
              </p>
            )}
            {newFieldType === "multiselect" && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                O cliente pode marcar <span className="font-medium text-foreground">várias</span>{" "}
                opções.
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Pergunta</Label>
            <Input
              placeholder="Ex.: Como quer servir seus convidados?"
              value={newFieldLabel}
              onChange={(event) => setNewFieldLabel(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !showNewFieldOptions) void addCustomField();
              }}
            />
          </div>

          {showNewFieldOptions && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Opções de resposta (uma por linha)</Label>
              <Textarea
                value={newFieldOptionsText}
                rows={4}
                placeholder={"Buffet\nGarçom serve nas mesas"}
                onChange={(event) => setNewFieldOptionsText(event.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Liste as alternativas que o cliente pode escolher — uma opção em cada linha.
              </p>
              {newFieldOptionsInsufficient && (
                <p className="text-[11px] text-destructive">
                  Adicione pelo menos duas opções de resposta para salvar esta pergunta.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Button
              className="w-full gap-2"
              onClick={() => void addCustomField()}
              disabled={
                createField.isPending ||
                !newFieldLabel.trim() ||
                (showNewFieldOptions && parsedNewFieldOptions.length < 2)
              }
            >
              <Plus className="h-4 w-4" />
              {createField.isPending ? "Salvando..." : "Salvar pergunta"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Use este botão para salvar a pergunta na seção escolhida. «Salvar e continuar» abaixo
              também salva a pergunta pendente antes de avançar.
            </p>
          </div>
        </div>
      </div>

      <FormFieldEditorDialog
        field={editingField}
        open={editorOpen}
        isSaving={updateField.isPending}
        packages={packageOptions}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingField(null);
        }}
        onSave={(field, updates) => void handleSaveEdit(field, updates)}
      />
    </div>
  );
};
