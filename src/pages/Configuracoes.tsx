import AppLayout from "@/components/AppLayout";
import { Plus } from "lucide-react";
import ChecklistConfig from "@/components/ChecklistConfig";
import PackagesConfig from "@/components/PackagesConfig";
import AdditionalsConfig from "@/components/AdditionalsConfig";
import PlansConfig from "@/components/PlansConfig";

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
          description="Modelos de comunicação automática com clientes"
        >
          <div className="space-y-3">
            {["Boas Vindas", "Proposta", "Confirmação", "Pós-festa"].map((msg) => (
              <div key={msg} className="rounded-xl border border-border/60 bg-card/40 p-5">
                <label className="text-sm font-medium text-foreground block mb-2">{msg}</label>
                <textarea
                  className="w-full bg-background/50 border border-border/60 rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  placeholder={`Mensagem de ${msg.toLowerCase()}...`}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Financeiro */}
        <Section
          title="Financeiro"
          description="Regras padrão para pagamentos e parcelamentos"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 bg-card/40 p-5">
              <label className="text-sm font-medium text-foreground block mb-2">
                Valor de entrada padrão (%)
              </label>
              <input
                type="number"
                defaultValue={30}
                className="w-full bg-background/50 border border-border/60 rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="rounded-xl border border-border/60 bg-card/40 p-5">
              <label className="text-sm font-medium text-foreground block mb-2">
                Parcelas máximas
              </label>
              <input
                type="number"
                defaultValue={3}
                className="w-full bg-background/50 border border-border/60 rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </Section>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
