import { FormEvent, useEffect, useState } from "react";
import { FileSignature, Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/features/auth";
import {
  CONTRACT_MODULE_ACCEPTANCE_DECLARATION,
  CONTRACT_MODULE_TERMS_SECTIONS,
  CONTRACT_MODULE_TERMS_TITLE,
} from "@/features/eventos/contracts/contract-module-terms";
import { useAcceptContractModuleTerms } from "@/features/eventos/use-tenant-contract-module-acceptance";
import { useTenantAdminCapability } from "@/features/tenants/use-tenant-admin-capability";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";

const formatCpfInput = (digits: string) => {
  const value = digits.replace(/\D/g, "").slice(0, 11);
  if (value.length <= 3) return value;
  if (value.length <= 6) return `${value.slice(0, 3)}.${value.slice(3)}`;
  if (value.length <= 9) return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
  return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
};

export const ContractModuleTermsPrompt = () => {
  const { user } = useAuth();
  const { data: adminCapability, isLoading: isAdminLoading } = useTenantAdminCapability();
  const acceptTerms = useAcceptContractModuleTerms();

  const [acceptedByName, setAcceptedByName] = useState("");
  const [acceptedByCpf, setAcceptedByCpf] = useState("");
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, cpf")
        .eq("id", user.id)
        .maybeSingle();

      if (!isMounted) return;

      const fallback = user.email?.split("@")[0] ?? "";
      setAcceptedByName(data?.full_name?.trim() || fallback);
      if (data?.cpf) {
        setAcceptedByCpf(formatCpfInput(data.cpf));
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.email, user?.id]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!declarationAccepted) {
      toast({
        title: "Confirme a declaração de aceite.",
        variant: "destructive",
      });
      return;
    }

    try {
      await acceptTerms.mutateAsync({ acceptedByCpf, acceptedByName });
      toast({
        title: "Módulo de contratos habilitado",
        description: "Você já pode gerenciar contratos do espaço.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível registrar o aceite",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  if (isAdminLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Verificando permissões...
      </div>
    );
  }

  if (!adminCapability?.isTenantAdmin) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <ShieldAlert className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Aceite pendente do administrador</CardTitle>
          <CardDescription>
            Para usar o módulo de contratos, um administrador ou responsável legal do espaço precisa
            aceitar os termos de uso da FestaAI.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Solicite a um administrador da empresa que acesse esta página e conclua o aceite.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <FileSignature className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>{CONTRACT_MODULE_TERMS_TITLE}</CardTitle>
            <CardDescription className="mt-1">
              Antes de gerenciar contratos, o espaço precisa aceitar os termos abaixo. Esse aceite
              protege a FestaAI e registra a responsabilidade do estabelecimento pelo uso do módulo.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <ScrollArea className="h-72 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="space-y-4 pr-3">
              {CONTRACT_MODULE_TERMS_SECTIONS.map((section) => (
                <section key={section.title} className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
                </section>
              ))}
            </div>
          </ScrollArea>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contract-module-accepted-by-name">Nome do responsável pelo aceite</Label>
              <Input
                id="contract-module-accepted-by-name"
                value={acceptedByName}
                onChange={(event) => setAcceptedByName(event.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract-module-accepted-by-cpf">CPF do responsável pelo aceite</Label>
              <Input
                id="contract-module-accepted-by-cpf"
                value={acceptedByCpf}
                onChange={(event) => setAcceptedByCpf(formatCpfInput(event.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                required
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-border/60 p-3 cursor-pointer">
            <Checkbox
              checked={declarationAccepted}
              onCheckedChange={(checked) => setDeclarationAccepted(checked === true)}
              className="mt-0.5"
            />
            <span className="text-sm leading-relaxed text-muted-foreground">
              {CONTRACT_MODULE_ACCEPTANCE_DECLARATION}
            </span>
          </label>

          <Button type="submit" disabled={acceptTerms.isPending} className="w-full sm:w-auto">
            {acceptTerms.isPending ? "Registrando aceite..." : "Aceitar termos e habilitar Contratos"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
