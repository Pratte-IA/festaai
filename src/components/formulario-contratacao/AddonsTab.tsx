import AdditionalsConfig from "@/components/AdditionalsConfig";

export const AddonsTab = () => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">
      Configure itens extras, categorias e tipos de cobrança. Esta etapa é apenas administrativa — o
      vínculo com eventos será tratado em fases futuras.
    </p>
    <AdditionalsConfig hideHeader adminMode />
  </div>
);
