import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import ChecklistConfig from "@/components/ChecklistConfig";
import PackagesConfig from "@/components/PackagesConfig";
import AdditionalsConfig from "@/components/AdditionalsConfig";
import PlansConfig from "@/components/PlansConfig";
import {
  MessageTemplate,
  useSaveTenantFinancialSettings,
  useSaveTenantMessageTemplate,
  useTenantFinancialSettings,
  useTenantMessageTemplates,
} from "@/features/configuracoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface SectionProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const Section = ({ title, description, action, children }: SectionProps) => (
  <section className="space-y-5">
    <div className="flex items-end justify-between gap-4 border-b border-border/40 pb-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
    <div>{children}</div>
  </section>
);

const MessageTemplatesConfig = () => {
  const { data: templates = [], isLoading } = useTenantMessageTemplates();
  const saveTemplate = useSaveTenantMessageTemplate();
  const [drafts, setDrafts] = useState<Record<string, MessageTemplate>>({});

  useEffect(() => {
    setDrafts(Object.fromEntries(templates.map((template) => [template.key, template])));
  }, [templates]);

  const handleSave = async (template: MessageTemplate) => {
    try {
      await saveTemplate.mutateAsync(template);
      toast({ title: "Modelo salvo" });
    } catch {
      toast({ title: "Nao foi possivel salvar o modelo", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando modelos...</p>;
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => {
        const draft = drafts[template.key] ?? template;

        return (
          <div key={template.key} className="rounded-xl border border-border/60 bg-card/40 p-5">
            <label className="text-sm font-medium text-foreground block mb-2">{template.title}</label>
            <textarea
              className="w-full bg-background/50 border border-border/60 rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={3}
              value={draft.body}
              onChange={(event) =>
                setDrafts((current) => ({
                  ...current,
                  [template.key]: { ...draft, body: event.target.value },
                }))
              }
              placeholder={`Mensagem de ${template.title.toLowerCase()}...`}
            />
            <div className="mt-3 flex justify-end">
              <Button size="sm" onClick={() => handleSave(draft)} disabled={saveTemplate.isPending}>
                Salvar modelo
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const FinancialSettingsConfig = () => {
  const { data: settings, isLoading } = useTenantFinancialSettings();
  const saveSettings = useSaveTenantFinancialSettings();
  const [downPayment, setDownPayment] = useState("30");
  const [maxInstallments, setMaxInstallments] = useState("3");

  useEffect(() => {
    if (settings) {
      setDownPayment(String(settings.default_down_payment_percentage));
      setMaxInstallments(String(settings.max_installments));
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await saveSettings.mutateAsync({
        default_down_payment_percentage: Number(downPayment),
        max_installments: Number(maxInstallments),
      });
      toast({ title: "Regras financeiras salvas" });
    } catch {
      toast({ title: "Nao foi possivel salvar as regras financeiras", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando regras financeiras...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-card/40 p-5">
          <label className="text-sm font-medium text-foreground block mb-2">
            Valor de entrada padrão (%)
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            value={downPayment}
            onChange={(event) => setDownPayment(event.target.value)}
          />
        </div>
        <div className="rounded-xl border border-border/60 bg-card/40 p-5">
          <label className="text-sm font-medium text-foreground block mb-2">
            Parcelas máximas
          </label>
          <Input
            type="number"
            min="1"
            value={maxInstallments}
            onChange={(event) => setMaxInstallments(event.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveSettings.isPending}>
          Salvar regras financeiras
        </Button>
      </div>
    </div>
  );
};

const Configuracoes = () => {
  return (
    <AppLayout>
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure seu sistema FestaAI</p>
      </div>

      <div className="space-y-16 max-w-6xl">
        {/* Pacotes */}
        <Section
          title="Pacotes"
          description="Estrutura comercial dos pacotes oferecidos aos clientes"
        >
          <PackagesConfig hideHeader />
        </Section>

        {/* Adicionais */}
        <Section
          title="Adicionais"
          description="Itens extras que podem ser incluídos em qualquer pacote"
        >
          <AdditionalsConfig hideHeader />
        </Section>

        {/* Planos */}
        <Section
          title="Planos"
          description="Condições comerciais oferecidas aos clientes contratantes"
        >
          <PlansConfig hideHeader />
        </Section>

        {/* Checklist */}
        <Section
          title="Checklist"
          description="Itens gerados automaticamente para cada festa"
        >
          <ChecklistConfig />
        </Section>

        {/* Mensagens */}
        <Section
          title="Mensagens"
          description="Modelos manuais de comunicação para uso pela equipe ou integrações externas"
        >
          <MessageTemplatesConfig />
        </Section>

        {/* Financeiro */}
        <Section
          title="Financeiro"
          description="Regras padrão para pagamentos e parcelamentos"
        >
          <FinancialSettingsConfig />
        </Section>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
