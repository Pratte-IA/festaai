import PackagesConfig from "@/components/PackagesConfig";

export const PackagesTab = () => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">
      Gerencie o catálogo de pacotes exibido no formulário de contratação. Pacotes usados em eventos
      são inativados em vez de excluídos definitivamente.
    </p>
    <PackagesConfig hideHeader adminMode />
  </div>
);
