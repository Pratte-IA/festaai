import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminTenantConfigSection } from "@/features/admin";
import { GUIDED_SETUP_STEPS, type GuidedSetupStepKey } from "@/features/guided-setup";
import { formatDurationMinutes } from "@/lib/duration";
import { formatIsoDateBR } from "@/lib/date";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
    {message}
  </div>
);

const FieldGrid = ({ fields }: { fields: Array<{ label: string; value: string | null | undefined }> }) => (
  <div className="grid gap-4 md:grid-cols-2">
    {fields.map((field) => (
      <div key={field.label}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</p>
        <p className="mt-1 text-sm font-medium">{field.value?.trim() || "—"}</p>
      </div>
    ))}
  </div>
);

const SectionBody = ({
  section,
  tenantId,
}: {
  section: GuidedSetupStepKey;
  tenantId: number;
}) => {
  const { data, error, isLoading } = useAdminTenantConfigSection(tenantId, section);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Carregando informações...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Não foi possível carregar esta seção.
      </div>
    );
  }

  if (section === "company_profile") {
    const profile = data as Record<string, string | null> | null;
    if (!profile) return <EmptyState message="Perfil da empresa ainda não preenchido." />;

    return (
      <FieldGrid
        fields={[
          { label: "Razão social", value: profile.company_name },
          { label: "CNPJ", value: profile.cnpj },
          { label: "CEP", value: profile.address_cep },
          { label: "Logradouro", value: profile.address_street },
          { label: "Número", value: profile.address_number },
          { label: "Complemento", value: profile.address_complement },
          { label: "Bairro", value: profile.address_neighborhood },
          { label: "Cidade", value: profile.address_city },
          { label: "Estado", value: profile.address_state },
          { label: "Representante legal", value: profile.legal_representative_name },
          { label: "CPF do representante", value: profile.legal_representative_cpf },
        ]}
      />
    );
  }

  if (section === "packages") {
    const packages = (data ?? []) as Array<Record<string, unknown>>;
    if (packages.length === 0) return <EmptyState message="Nenhum pacote cadastrado." />;

    return (
      <div className="space-y-4">
        {packages.map((pkg) => {
          const tiers = (pkg.pricingTiers ?? []) as Array<{ id: string; label: string; maxGuests: number; price: number }>;
          const includedItems = (pkg.includedItems ?? []) as string[];
          const excludedItems = (pkg.excludedItems ?? []) as string[];

          return (
            <Card className="rounded-2xl" key={String(pkg.id)}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{String(pkg.name)}</CardTitle>
                  <Badge variant={pkg.active === false ? "secondary" : "default"}>
                    {pkg.active === false ? "Inativo" : "Ativo"}
                  </Badge>
                </div>
                <CardDescription>
                  Automação: {String(pkg.name_automacao || "—")}
                  {pkg.duration_minutes ? ` · ${formatDurationMinutes(Number(pkg.duration_minutes))}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {pkg.description ? <p className="text-muted-foreground">{String(pkg.description)}</p> : null}
                {tiers.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Faixas de preço
                    </p>
                    <div className="divide-y rounded-xl border">
                      {tiers.map((tier) => (
                        <div className="flex items-center justify-between px-4 py-2" key={tier.id}>
                          <span>
                            {tier.label} · até {tier.maxGuests} convidados
                          </span>
                          <span className="font-medium">{formatCurrency(tier.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {includedItems.length > 0 ? (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Incluso
                    </p>
                    <p>{includedItems.join(", ")}</p>
                  </div>
                ) : null}
                {excludedItems.length > 0 ? (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Não incluso
                    </p>
                    <p>{excludedItems.join(", ")}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  if (section === "adicionais") {
    const additionals = (data ?? []) as Array<Record<string, unknown>>;
    if (additionals.length === 0) return <EmptyState message="Nenhum adicional cadastrado." />;

    return (
      <div className="overflow-hidden rounded-2xl border">
        <div className="hidden grid-cols-[1.2fr_0.8fr_0.6fr_0.6fr_0.6fr] gap-4 bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
          <span>Nome</span>
          <span>Categoria</span>
          <span>Tipo</span>
          <span>Preço</span>
          <span>Status</span>
        </div>
        <div className="divide-y">
          {additionals.map((item) => (
            <article
              className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[1.2fr_0.8fr_0.6fr_0.6fr_0.6fr] md:items-center"
              key={String(item.id)}
            >
              <div>
                <p className="font-medium">{String(item.name)}</p>
                {item.description ? (
                  <p className="text-xs text-muted-foreground">{String(item.description)}</p>
                ) : null}
              </div>
              <p className="text-muted-foreground">{String(item.category)}</p>
              <p className="text-muted-foreground">{String(item.type)}</p>
              <p className="font-medium">{formatCurrency(Number(item.price))}</p>
              <p className="text-muted-foreground">{item.active === false ? "Inativo" : "Ativo"}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (section === "estrutura") {
    const estrutura = data as { brinquedos?: string[] } | null;
    const brinquedos = estrutura?.brinquedos ?? [];
    if (brinquedos.length === 0) return <EmptyState message="Estrutura padrão ainda não configurada." />;

    return (
      <ul className="grid gap-2 md:grid-cols-2">
        {brinquedos.map((item) => (
          <li className="rounded-xl border px-4 py-2 text-sm" key={item}>
            {item}
          </li>
        ))}
      </ul>
    );
  }

  if (section === "financeiro") {
    const settings = data as Record<string, unknown> | null;
    if (!settings) return <EmptyState message="Configurações financeiras ainda não definidas." />;

    return (
      <FieldGrid
        fields={[
          { label: "Modo de entrada", value: String(settings.down_payment_mode ?? "—") },
          { label: "Método de entrada", value: String(settings.down_payment_method ?? "—") },
          { label: "Entrada (%)", value: settings.default_down_payment_percentage?.toString() ?? null },
          { label: "Entrada fixa", value: settings.default_down_payment_fixed_value?.toString() ?? null },
          { label: "Máx. parcelas", value: settings.max_installments?.toString() ?? null },
          { label: "Parcelas PIX", value: settings.remaining_pix_installments?.toString() ?? null },
          { label: "Parcelas cartão", value: settings.remaining_card_installments?.toString() ?? null },
          { label: "Política de cancelamento", value: settings.cancellation_policy as string | null },
          { label: "Política de remarcação", value: settings.rescheduling_policy as string | null },
        ]}
      />
    );
  }

  if (section === "checklist") {
    const checklist = data as {
      categories: Array<{ id: number; name: string }>;
      items: Array<{ id: number; category_id: number; label: string; package_id: number | null }>;
    };
    if (checklist.categories.length === 0) {
      return <EmptyState message="Checklist ainda não configurado." />;
    }

    return (
      <div className="space-y-4">
        {checklist.categories.map((category) => {
          const items = checklist.items.filter((item) => item.category_id === category.id);
          return (
            <Card className="rounded-2xl" key={category.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{category.name}</CardTitle>
                <CardDescription>{items.length} tarefas</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {items.map((item) => (
                    <li className="rounded-lg border px-3 py-2" key={item.id}>
                      {item.label}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  if (section === "contrato") {
    const contrato = data as {
      acceptances: Array<{ accepted_at: string; accepted_by_name: string; terms_version: string }>;
      settings: Record<string, unknown> | null;
      templates: Array<{ id: number; name: string; is_active: boolean; is_default: boolean }>;
    };

    return (
      <div className="space-y-6">
        <FieldGrid
          fields={[
            {
              label: "Modelos configurados em",
              value: contrato.settings?.models_configured_at
                ? formatIsoDateBR(String(contrato.settings.models_configured_at).slice(0, 10))
                : null,
            },
            { label: "Aceites registrados", value: String(contrato.acceptances.length) },
          ]}
        />
        {contrato.templates.length > 0 ? (
          <div className="divide-y rounded-2xl border">
            {contrato.templates.map((template) => (
              <div className="flex items-center justify-between px-4 py-3 text-sm" key={template.id}>
                <span className="font-medium">{template.name}</span>
                <div className="flex gap-2">
                  {template.is_default ? <Badge variant="secondary">Padrão</Badge> : null}
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Nenhum modelo de contrato cadastrado." />
        )}
      </div>
    );
  }

  if (section === "formulario") {
    const fields = (data ?? []) as Array<Record<string, unknown>>;
    if (fields.length === 0) return <EmptyState message="Formulário de contratação ainda não configurado." />;

    return (
      <div className="divide-y rounded-2xl border">
        {fields.map((field) => (
          <div className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[1fr_0.6fr_0.4fr_0.4fr]" key={String(field.id)}>
            <span className="font-medium">{String(field.label)}</span>
            <span className="text-muted-foreground">{String(field.field_key)}</span>
            <span className="text-muted-foreground">{String(field.field_type)}</span>
            <span className="text-muted-foreground">
              {field.required ? "Obrigatório" : "Opcional"} · {field.active === false ? "Inativo" : "Ativo"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (section === "followup_proposta") {
    const templates = (data ?? []) as Array<{ key: string; title: string; body: string }>;
    if (templates.length === 0) return <EmptyState message="Follow-ups de proposta ainda não configurados." />;

    return (
      <div className="space-y-4">
        {templates.map((template) => (
          <Card className="rounded-2xl" key={template.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{template.title}</CardTitle>
              <CardDescription>{template.key}</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm">{template.body}</pre>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (section === "pesquisa_avaliacao") {
    const questions = (data ?? []) as Array<Record<string, unknown>>;
    if (questions.length === 0) return <EmptyState message="Pesquisa de avaliação ainda não configurada." />;

    return (
      <div className="divide-y rounded-2xl border">
        {questions.map((question) => (
          <div className="flex items-center justify-between px-4 py-3 text-sm" key={String(question.id)}>
            <div>
              <p className="font-medium">{String(question.label)}</p>
              <p className="text-xs text-muted-foreground">{String(question.question_key)}</p>
            </div>
            <Badge variant={question.active === false ? "secondary" : "default"}>
              {String(question.question_type)}
            </Badge>
          </div>
        ))}
      </div>
    );
  }

  if (section === "whatsapp") {
    const connections = (data ?? []) as Array<Record<string, unknown>>;
    if (connections.length === 0) return <EmptyState message="Nenhuma conexão WhatsApp cadastrada." />;

    return (
      <div className="divide-y rounded-2xl border">
        {connections.map((connection) => (
          <div className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[1fr_1fr_0.6fr]" key={String(connection.id)}>
            <div>
              <p className="font-medium">{String(connection.name)}</p>
              <p className="text-xs text-muted-foreground">{String(connection.instance_name)}</p>
            </div>
            <p className="text-muted-foreground">{String(connection.phone || "—")}</p>
            <Badge variant={connection.status === "connected" ? "default" : "secondary"}>
              {String(connection.status)}
            </Badge>
          </div>
        ))}
      </div>
    );
  }

  if (section === "automacoes") {
    const automacoes = data as {
      bindings: Array<{ key: string; title: string; connectionId: number | null; forwardPhone: string | null }>;
      connections: Array<{ id: number; name: string; phone: string | null }>;
      inboundWebhookUrl: string | null;
      outboundWebhookUrls: Record<string, string>;
      inboundAutomationEnabled: boolean;
    };

    const connectionName = (id: number | null) =>
      automacoes.connections.find((connection) => connection.id === id)?.name ?? "—";

    const webhookEntries = [
      { key: "atendimento", label: "Atendimento (inbound)", url: automacoes.inboundWebhookUrl },
      { key: "boas-vindas", label: "Boas Vindas", url: automacoes.outboundWebhookUrls["boas-vindas"] ?? null },
      {
        key: "sete-dias-antes",
        label: "7 dias Antes",
        url: automacoes.outboundWebhookUrls["sete-dias-antes"] ?? null,
      },
    ];

    return (
      <div className="space-y-6">
        <FieldGrid
          fields={[
            {
              label: "Encaminhar inbound",
              value: automacoes.inboundAutomationEnabled ? "Ativo" : "Inativo",
            },
          ]}
        />
        <div>
          <p className="mb-3 text-sm font-semibold">Webhooks N8N</p>
          <div className="divide-y rounded-2xl border">
            {webhookEntries.map((entry) => (
              <div className="px-4 py-3 text-sm" key={entry.key}>
                <p className="font-medium">{entry.label}</p>
                <p className="mt-1 break-all text-muted-foreground">{entry.url?.trim() || "—"}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Vínculos WhatsApp (tenant)</p>
          <div className="divide-y rounded-2xl border">
            {automacoes.bindings.map((binding) => (
              <div className="flex items-center justify-between px-4 py-3 text-sm" key={binding.key}>
                <div>
                  <p className="font-medium">{binding.title}</p>
                  <p className="text-xs text-muted-foreground">{binding.key}</p>
                </div>
                <p className="text-muted-foreground">
                  {binding.forwardPhone ?? connectionName(binding.connectionId)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

interface AdminTenantConfigSectionContentProps {
  section: GuidedSetupStepKey;
  tenantId: number;
}

export const AdminTenantConfigSectionContent = ({
  section,
  tenantId,
}: AdminTenantConfigSectionContentProps) => {
  const stepMeta = GUIDED_SETUP_STEPS.find((step) => step.key === section);

  return (
    <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
      <CardHeader>
        <CardTitle>{stepMeta?.title ?? section}</CardTitle>
        <CardDescription>{stepMeta?.description ?? "Configuração do tenant"}</CardDescription>
      </CardHeader>
      <CardContent>
        <SectionBody section={section} tenantId={tenantId} />
      </CardContent>
    </Card>
  );
};
