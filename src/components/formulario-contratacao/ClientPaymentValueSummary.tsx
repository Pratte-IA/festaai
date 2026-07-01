import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export interface ClientPaymentSummaryValues {
  adicionaisValue: number;
  pacoteValue: number;
  totalValue: number;
}

interface ClientPaymentValueSummaryProps {
  additionalSelectionCount: number;
  fieldIdByKey: Map<string, string>;
  values: ClientPaymentSummaryValues;
}

const SummaryRow = ({
  fieldId,
  label,
  required = true,
  value,
}: {
  fieldId?: string;
  label: string;
  required?: boolean;
  value: number;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={fieldId} className="text-xs">
      {label}
      {required ? " *" : ""}
    </Label>
    <Input
      id={fieldId}
      type="text"
      value={formatCurrency(value)}
      readOnly
      className="text-sm bg-muted/30"
    />
  </div>
);

export const ClientPaymentValueSummary = ({
  additionalSelectionCount,
  fieldIdByKey,
  values,
}: ClientPaymentValueSummaryProps) => {
  const { adicionaisValue, pacoteValue, totalValue } = values;
  const hasAdditionals = additionalSelectionCount > 0 && adicionaisValue > 0;

  const pacoteFieldId = fieldIdByKey.get("valor_pacote");
  const adicionaisFieldId = fieldIdByKey.get("valor_adicionais");
  const totalFieldId = fieldIdByKey.get("valor_total");

  if (!pacoteFieldId && !totalFieldId) return null;

  return (
    <div className="space-y-4">
      <SummaryRow
        fieldId={pacoteFieldId ? `client-field-${pacoteFieldId}` : undefined}
        label="Valor Pacote"
        value={pacoteValue}
      />
      {hasAdditionals && (
        <>
          <SummaryRow
            fieldId={adicionaisFieldId ? `client-field-${adicionaisFieldId}` : undefined}
            label="Valor adicionais"
            value={adicionaisValue}
          />
          <SummaryRow
            fieldId={totalFieldId ? `client-field-${totalFieldId}` : undefined}
            label="Valor Total"
            value={totalValue}
          />
        </>
      )}
    </div>
  );
};
