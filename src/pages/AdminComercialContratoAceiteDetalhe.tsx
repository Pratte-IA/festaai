import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminContractAcceptanceDetail } from "@/features/comercial/use-admin-contract-acceptances";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const AdminComercialContratoAceiteDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const acceptanceId = id ? Number(id) : null;
  const { data: acceptance, error, isLoading } = useAdminContractAcceptanceDetail(acceptanceId);

  return (
    <AdminPageShell
      backHref="/admin/comercial/contratos"
      backLabel="Voltar aos contratos"
      description="Snapshot imutável do aceite eletrônico registrado no checkout."
      title="Aceite contratual"
    >
      {isLoading && <p className="text-sm text-muted-foreground">Carregando aceite...</p>}
      {error && <p className="text-sm text-destructive">Não foi possível carregar o aceite.</p>}

      {acceptance && (
        <div className="space-y-6">
          <Card className="rounded-2xl border-white/80 bg-white/90">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {acceptance.accepted_by_name}
                <Badge variant="secondary">v{acceptance.contract_version}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-muted-foreground">E-mail</p>
                <p className="text-sm">{acceptance.accepted_by_email}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Empresa</p>
                <p className="text-sm">{acceptance.accepted_by_company ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">CPF/CNPJ</p>
                <p className="text-sm">{acceptance.accepted_by_cpf_cnpj ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Aceite em</p>
                <p className="text-sm">{dateFormatter.format(new Date(acceptance.accepted_at))}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">IP</p>
                <p className="font-mono text-sm">{acceptance.ip_address ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Referência</p>
                <p className="font-mono text-xs break-all">{acceptance.external_reference ?? "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs uppercase text-muted-foreground">User agent</p>
                <p className="text-xs break-all text-muted-foreground">{acceptance.user_agent ?? "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs uppercase text-muted-foreground">Declaração de aceite</p>
                <p className="text-sm">{acceptance.acceptance_declaration}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/80 bg-white/90">
            <CardHeader>
              <CardTitle>Contrato e Anexo Comercial (snapshot)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[640px] overflow-auto whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 text-xs leading-relaxed">
                {acceptance.contract_body_snapshot}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && !error && !acceptance && (
        <Button asChild variant="outline">
          <Link to="/admin/comercial/contratos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      )}
    </AdminPageShell>
  );
};

export default AdminComercialContratoAceiteDetalhe;
