import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { RadarCompanyDetailContent } from "@/components/admin/radar/RadarCompanyDetailContent";
import { RadarCompanyLeadActionsMenu } from "@/components/admin/radar/RadarCompanyLeadActionsMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRadarCompanyDetail } from "@/features/radar-crm";

const AdminCrmLead = () => {
  const { companyId: companyIdParam } = useParams();
  const companyId = Number(companyIdParam);
  const hasValidCompanyId = Number.isInteger(companyId) && companyId > 0;
  const [editRequestKey, setEditRequestKey] = useState(0);

  const { data, isLoading } = useRadarCompanyDetail(hasValidCompanyId ? companyId : null);
  const company = data?.company;
  const title = company?.trade_name ?? company?.name ?? (isLoading ? "Carregando..." : "Lead");
  const description = [
    company?.category,
    [company?.city, company?.state].filter(Boolean).join(" / "),
  ]
    .filter(Boolean)
    .join(" · ");

  if (!hasValidCompanyId) {
    return (
      <AdminPageShell backHref="/admin/crm" backLabel="Voltar ao CRM" title="Lead inválido">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          ID do lead inválido.
        </div>
        <Button asChild className="mt-4 w-fit" variant="outline">
          <Link to="/admin/crm">Voltar ao CRM</Link>
        </Button>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      actions={
        <RadarCompanyLeadActionsMenu
          companyId={companyId}
          onEditInfo={() => setEditRequestKey((key) => key + 1)}
        />
      }
      backHref="/admin/crm"
      backLabel="Voltar ao CRM"
      description={description || "Detalhes e acompanhamento comercial do lead."}
      title={title}
    >
      <Card className="rounded-2xl border-white/80 bg-white/90">
        <CardContent className="pt-6">
          <RadarCompanyDetailContent
            companyId={companyId}
            editRequestKey={editRequestKey}
            showHeader={false}
          />
        </CardContent>
      </Card>
    </AdminPageShell>
  );
};

export default AdminCrmLead;
