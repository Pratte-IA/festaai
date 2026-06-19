import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ClosingFormPackageApplicabilityFieldProps {
  packages: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const ClosingFormPackageApplicabilityField = ({
  packages,
  selectedIds,
  onChange,
}: ClosingFormPackageApplicabilityFieldProps) => {
  const togglePackage = (packageId: string, checked: boolean) => {
    if (checked) {
      onChange(Array.from(new Set([...selectedIds, packageId])));
      return;
    }
    onChange(selectedIds.filter((id) => id !== packageId));
  };

  if (packages.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Cadastre ao menos um pacote para vincular esta pergunta a um pacote específico.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Pacotes</Label>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Selecione os pacotes em que esta pergunta aparece. Deixe vazio para exibir em todos.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {packages.map((pkg) => (
          <label
            key={pkg.id}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
          >
            <Checkbox
              checked={selectedIds.includes(pkg.id)}
              onCheckedChange={(checked) => togglePackage(pkg.id, checked === true)}
            />
            <span className="truncate">{pkg.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const formatClosingFormFieldPackageLabels = (
  packageIds: string[] | undefined,
  packages: { id: string; name: string }[],
): string => {
  const ids = packageIds ?? [];
  if (ids.length === 0) return "Todos os pacotes";

  const labels = ids
    .map((id) => packages.find((pkg) => pkg.id === id)?.name)
    .filter(Boolean);

  return labels.length > 0 ? labels.join(", ") : "Pacotes selecionados";
};
