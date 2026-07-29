import { Link, useParams } from "react-router-dom";

import { AdminTenantConfigSectionContent } from "@/components/admin/tenant-config/AdminTenantConfigSectionContent";
import { AdminTenantShell } from "@/components/admin/AdminTenantShell";
import { Button } from "@/components/ui/button";
import { GUIDED_SETUP_STEPS, isGuidedSetupStepKey } from "@/features/guided-setup";

const AdminTenantConfigSection = () => {
  const { id, section } = useParams();
  const tenantId = Number(id);
  const hasValidTenantId = Number.isInteger(tenantId) && tenantId > 0;
  const isValidSection = Boolean(section && isGuidedSetupStepKey(section));
  const stepMeta = GUIDED_SETUP_STEPS.find((step) => step.key === section);

  if (!hasValidTenantId || !isValidSection || !section) {
    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <Button asChild variant="outline">
            <Link to="/admin/clientes">Voltar para Admin</Link>
          </Button>
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Seção de configuração inválida.
          </div>
        </div>
      </main>
    );
  }

  return (
    <AdminTenantShell
      backHref={`/admin/tenants/${tenantId}/configuracao`}
      backLabel="Voltar às configurações"
      description={stepMeta?.description}
      tenantId={tenantId}
      title={stepMeta?.title ?? "Configuração"}
    >
      <AdminTenantConfigSectionContent section={section} tenantId={tenantId} />
    </AdminTenantShell>
  );
};

export default AdminTenantConfigSection;
