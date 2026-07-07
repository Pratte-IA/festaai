import { CheckCircle2, CircleDashed } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { AdminTenantShell } from "@/components/admin/AdminTenantShell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminTenantGuidedSetup } from "@/features/admin";
import { GUIDED_SETUP_STEPS, type GuidedSetupStepKey } from "@/features/guided-setup";

const AdminTenantConfig = () => {
  const { id } = useParams();
  const tenantId = Number(id);
  const hasValidTenantId = Number.isInteger(tenantId) && tenantId > 0;
  const { data: guidedSetup, isLoading } = useAdminTenantGuidedSetup(hasValidTenantId ? tenantId : null);

  if (!hasValidTenantId) {
    return null;
  }

  const completedSteps = new Set(guidedSetup?.completedSteps ?? []);

  return (
    <AdminTenantShell
      backHref={`/admin/tenants/${tenantId}`}
      backLabel="Voltar ao painel do cliente"
      description="Informações cadastradas pelo tenant na configuração guiada — use para montar o agente."
      tenantId={tenantId}
      title="Configuração do tenant"
    >
      <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>Etapas da configuração guiada</CardTitle>
          <CardDescription>
            {isLoading
              ? "Verificando progresso..."
              : `${completedSteps.size} de ${GUIDED_SETUP_STEPS.length} etapas concluídas pelo tenant`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {GUIDED_SETUP_STEPS.map((step) => {
              const isCompleted = completedSteps.has(step.key as GuidedSetupStepKey);

              return (
                <Link
                  className="group rounded-2xl border bg-background/80 p-4 transition hover:border-primary/30 hover:bg-primary/5"
                  key={step.key}
                  to={`/admin/tenants/${tenantId}/configuracao/${step.key}`}
                >
                  <div className="flex items-start gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground group-hover:text-primary">
                          {step.title}
                        </p>
                        <Badge variant={isCompleted ? "default" : "secondary"}>
                          {isCompleted ? "Preenchido" : "Pendente"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </AdminTenantShell>
  );
};

export default AdminTenantConfig;
