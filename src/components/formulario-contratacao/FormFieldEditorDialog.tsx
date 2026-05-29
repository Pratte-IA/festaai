import { useEffect, useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CLOSING_FORM_USAGE_LABELS,
  ClosingFormField,
  ClosingFormFieldCategory,
  ClosingFormFieldType,
  ClosingFormFieldUsage,
  ClosingFormSection,
  CUSTOM_CLOSING_FIELD_TYPES,
  STRUCTURE_FORM_SECTIONS,
  closingFormFieldCategoryLabels,
  closingFormFieldTypeLabels,
  closingFormSectionLabels,
  parseFieldConfig,
} from "@/features/configuracoes";

interface FormFieldEditorDialogProps {
  field: ClosingFormField | null;
  isSaving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (field: ClosingFormField, updates: FormFieldEditorValues) => void;
  open: boolean;
}

export interface FormFieldEditorValues {
  active: boolean;
  category: ClosingFormFieldCategory;
  config: Record<string, unknown>;
  description: string;
  fieldType: ClosingFormFieldType;
  label: string;
  required: boolean;
  section: ClosingFormSection;
  usage: ClosingFormFieldUsage;
}

const USAGE_KEYS = Object.keys(CLOSING_FORM_USAGE_LABELS) as Array<keyof ClosingFormFieldUsage>;

export const FormFieldEditorDialog = ({
  field,
  isSaving,
  onOpenChange,
  onSave,
  open,
}: FormFieldEditorDialogProps) => {
  const [values, setValues] = useState<FormFieldEditorValues | null>(null);
  const [optionsText, setOptionsText] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [patternValue, setPatternValue] = useState("");

  const isSystem = field?.isSystem ?? false;
  const isLocked = field?.isLocked ?? false;

  const editableFieldTypes = isSystem
    ? field
      ? [field.fieldType]
      : []
    : CUSTOM_CLOSING_FIELD_TYPES;

  useEffect(() => {
    if (!field || !open) return;

    const parsedConfig = parseFieldConfig(field.config);

    setValues({
      active: field.active,
      category: field.category,
      config: field.config,
      description: field.description ?? "",
      fieldType: field.fieldType,
      label: field.label,
      required: field.required,
      section: field.section,
      usage: { ...field.usage },
    });
    setOptionsText((parsedConfig.options ?? []).join("\n"));
    setMinValue(parsedConfig.min !== undefined ? String(parsedConfig.min) : "");
    setMaxValue(parsedConfig.max !== undefined ? String(parsedConfig.max) : "");
    setPatternValue(parsedConfig.pattern ?? "");
  }, [field, open]);

  const handleSave = () => {
    if (!field || !values) return;

    const config: Record<string, unknown> = { ...values.config };

    if (values.fieldType === "select" || values.fieldType === "multiselect") {
      config.options = optionsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    } else {
      delete config.options;
    }

    if (values.fieldType === "number" || values.fieldType === "currency") {
      if (minValue.trim()) config.min = Number(minValue);
      else delete config.min;
      if (maxValue.trim()) config.max = Number(maxValue);
      else delete config.max;
    } else {
      delete config.min;
      delete config.max;
    }

    if (values.fieldType === "text" && patternValue.trim()) {
      config.pattern = patternValue.trim();
    } else {
      delete config.pattern;
    }

    onSave(field, { ...values, config });
  };

  const showOptions = values?.fieldType === "select" || values?.fieldType === "multiselect";
  const showNumericValidation =
    values?.fieldType === "number" || values?.fieldType === "currency";
  const showPattern = values?.fieldType === "text";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{field ? `Editar campo` : "Campo"}</DialogTitle>
          <DialogDescription>
            {isSystem
              ? "Campo do sistema: algumas propriedades são protegidas para manter contrato e automações."
              : "Configure label, tipo, categoria e destinos de uso do campo personalizado."}
          </DialogDescription>
        </DialogHeader>

        {values && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field-label">Nome do campo</Label>
              <Input
                id="field-label"
                value={values.label}
                disabled={isSystem}
                onChange={(event) => setValues({ ...values, label: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-description">Descrição / ajuda para o cliente</Label>
              <Textarea
                id="field-description"
                value={values.description}
                rows={2}
                onChange={(event) => setValues({ ...values, description: event.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={values.fieldType}
                  disabled={isSystem}
                  onValueChange={(value) =>
                    setValues({ ...values, fieldType: value as ClosingFormFieldType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {editableFieldTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {closingFormFieldTypeLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Seção</Label>
                <Select
                  value={values.section}
                  disabled={isSystem}
                  onValueChange={(value) =>
                    setValues({ ...values, section: value as ClosingFormSection })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRUCTURE_FORM_SECTIONS.map((section) => (
                      <SelectItem key={section} value={section}>
                        {closingFormSectionLabels[section]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={values.category}
                disabled={isSystem && isLocked}
                onValueChange={(value) =>
                  setValues({ ...values, category: value as ClosingFormFieldCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(closingFormFieldCategoryLabels) as ClosingFormFieldCategory[]).map(
                    (category) => (
                      <SelectItem key={category} value={category}>
                        {closingFormFieldCategoryLabels[category]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-6 rounded-lg border border-border/50 bg-muted/20 p-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={values.required}
                  disabled={isLocked && values.required}
                  onCheckedChange={(checked) =>
                    setValues({ ...values, required: checked === true })
                  }
                />
                Obrigatório
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={values.active}
                  disabled={isLocked}
                  onCheckedChange={(checked) =>
                    setValues({ ...values, active: checked === true })
                  }
                />
                Ativo
              </label>
            </div>

            <div className="space-y-2">
              <Label>Destinos de uso</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {USAGE_KEYS.map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={values.usage[key]}
                      disabled={isSystem && isLocked}
                      onCheckedChange={(checked) =>
                        setValues({
                          ...values,
                          usage: { ...values.usage, [key]: checked === true },
                        })
                      }
                    />
                    {CLOSING_FORM_USAGE_LABELS[key]}
                  </label>
                ))}
              </div>
            </div>

            {showOptions && (
              <div className="space-y-2">
                <Label htmlFor="field-options">Opções (uma por linha)</Label>
                <Textarea
                  id="field-options"
                  value={optionsText}
                  disabled={isSystem}
                  rows={4}
                  placeholder={"Opção A\nOpção B"}
                  onChange={(event) => setOptionsText(event.target.value)}
                />
              </div>
            )}

            {showNumericValidation && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="field-min">Valor mínimo</Label>
                  <Input
                    id="field-min"
                    type="number"
                    value={minValue}
                    disabled={isSystem}
                    onChange={(event) => setMinValue(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-max">Valor máximo</Label>
                  <Input
                    id="field-max"
                    type="number"
                    value={maxValue}
                    disabled={isSystem}
                    onChange={(event) => setMaxValue(event.target.value)}
                  />
                </div>
              </div>
            )}

            {showPattern && !isSystem && (
              <div className="space-y-2">
                <Label htmlFor="field-pattern">Padrão regex (opcional)</Label>
                <Input
                  id="field-pattern"
                  value={patternValue}
                  placeholder="Ex.: ^[0-9]{11}$"
                  onChange={(event) => setPatternValue(event.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={isSaving || !values?.label.trim()} onClick={handleSave}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
