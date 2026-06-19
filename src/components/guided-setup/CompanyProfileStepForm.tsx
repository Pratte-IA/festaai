import { FormEvent, useEffect, useState } from "react";
import { Building2, Loader2, MapPin, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCompleteGuidedSetupStep,
  useSaveTenantCompanyProfile,
  useTenantCompanyProfile,
} from "@/features/guided-setup";
import { guidedSetupQueryKeys } from "@/features/guided-setup/query-keys";
import { useCurrentTenant } from "@/features/tenants";
import { toast } from "@/hooks/use-toast";
import { fetchAddressByCep } from "@/lib/cep";
import { getErrorMessage } from "@/lib/error-message";
import { useQueryClient } from "@tanstack/react-query";
import {
  formatCepInput,
  formatCnpjInput,
  formatCpfInput,
  isValidCep,
  isValidCnpj,
  isValidCpf,
} from "@/lib/brazil-documents";

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

interface FormState {
  addressCity: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressNumber: string;
  addressState: string;
  addressStreet: string;
  addressCep: string;
  cnpj: string;
  companyName: string;
  legalRepresentativeCpf: string;
  legalRepresentativeName: string;
}

const emptyForm = (): FormState => ({
  addressCity: "",
  addressComplement: "",
  addressNeighborhood: "",
  addressNumber: "",
  addressState: "",
  addressStreet: "",
  addressCep: "",
  cnpj: "",
  companyName: "",
  legalRepresentativeCpf: "",
  legalRepresentativeName: "",
});

interface CompanyProfileStepFormProps {
  onCompleted?: () => void;
}

export const CompanyProfileStepForm = ({ onCompleted }: CompanyProfileStepFormProps) => {
  const { currentTenant } = useCurrentTenant();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useTenantCompanyProfile();
  const saveProfile = useSaveTenantCompanyProfile();
  const completeStep = useCompleteGuidedSetupStep();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        addressCity: profile.addressCity ?? "",
        addressComplement: profile.addressComplement ?? "",
        addressNeighborhood: profile.addressNeighborhood ?? "",
        addressNumber: profile.addressNumber ?? "",
        addressState: profile.addressState ?? "",
        addressStreet: profile.addressStreet ?? "",
        addressCep: profile.addressCep ? formatCepInput(profile.addressCep) : "",
        cnpj: profile.cnpj ? formatCnpjInput(profile.cnpj) : "",
        companyName: profile.companyName ?? "",
        legalRepresentativeCpf: profile.legalRepresentativeCpf
          ? formatCpfInput(profile.legalRepresentativeCpf)
          : "",
        legalRepresentativeName: profile.legalRepresentativeName ?? "",
      });
      return;
    }

    if (currentTenant) {
      setForm((current) => ({
        ...current,
        companyName: current.companyName || currentTenant.name,
        cnpj: current.cnpj || (currentTenant.document ? formatCnpjInput(currentTenant.document) : ""),
      }));
    }
  }, [currentTenant, profile]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCepLookup = async (cep: string) => {
    if (!isValidCep(cep)) return;

    setIsFetchingCep(true);
    try {
      const address = await fetchAddressByCep(cep);
      if (!address) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setForm((current) => ({
        ...current,
        addressCity: address.cidade,
        addressNeighborhood: address.bairro,
        addressState: address.estado,
        addressStreet: address.rua,
        addressCep: formatCepInput(address.cep),
      }));
    } catch {
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível consultar o endereço. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingCep(false);
    }
  };

  const validate = () => {
    if (!form.companyName.trim()) return "Informe o nome da empresa.";
    if (!isValidCnpj(form.cnpj)) return "Informe um CNPJ válido.";
    if (!isValidCep(form.addressCep)) return "Informe um CEP válido.";
    if (!form.addressStreet.trim()) return "Informe a rua.";
    if (!form.addressNumber.trim()) return "Informe o número.";
    if (!form.addressNeighborhood.trim()) return "Informe o bairro.";
    if (!form.addressCity.trim()) return "Informe a cidade.";
    if (!form.addressState.trim()) return "Informe o estado.";
    if (!form.legalRepresentativeName.trim()) {
      return "Informe o representante legal (sócio administrador).";
    }
    if (!isValidCpf(form.legalRepresentativeCpf)) return "Informe um CPF válido.";
    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      toast({ title: validationError, variant: "destructive" });
      return;
    }

    try {
      await saveProfile.mutateAsync(form);
      await completeStep.mutateAsync({ stepKey: "company_profile" });
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: guidedSetupQueryKeys.progress(currentTenant?.id ?? null),
        }),
        queryClient.refetchQueries({
          queryKey: guidedSetupQueryKeys.derived(currentTenant?.id ?? null),
        }),
      ]);
      toast({
        title: "Dados do espaço salvos",
        description: "Etapa concluída com sucesso.",
      });
      onCompleted?.();
    } catch (error) {
      toast({
        title: "Não foi possível salvar",
        description: getErrorMessage(
          error,
          "Revise os dados e tente novamente. Se o erro mencionar tabela inexistente, aplique as migrations do Supabase.",
        ),
        variant: "destructive",
      });
    }
  };

  const isSaving = saveProfile.isPending || completeStep.isPending;

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando dados da empresa...
      </div>
    );
  }

  return (
    <form data-guided-setup-allowed onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Building2 className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <CardTitle>Identificação da empresa</CardTitle>
              <CardDescription>Dados cadastrais do espaço de festa</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-name">Nome da empresa</Label>
            <Input
              id="company-name"
              value={form.companyName}
              onChange={(event) => updateField("companyName", event.target.value)}
              placeholder="Ex.: Festa Kids Espaço de Eventos"
              autoComplete="organization"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-cnpj">CNPJ</Label>
            <Input
              id="company-cnpj"
              value={form.cnpj}
              onChange={(event) => updateField("cnpj", formatCnpjInput(event.target.value))}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <MapPin className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Localização do espaço de festa</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="address-cep">CEP</Label>
            <div className="relative">
              <Input
                id="address-cep"
                value={form.addressCep}
                onChange={(event) => {
                  const formatted = formatCepInput(event.target.value);
                  updateField("addressCep", formatted);
                }}
                onBlur={() => void handleCepLookup(form.addressCep)}
                placeholder="00000-000"
                inputMode="numeric"
              />
              {isFetchingCep ? (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              ) : null}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address-street">Rua</Label>
            <Input
              id="address-street"
              value={form.addressStreet}
              onChange={(event) => updateField("addressStreet", event.target.value)}
              placeholder="Nome da rua"
              autoComplete="street-address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address-number">Número</Label>
            <Input
              id="address-number"
              value={form.addressNumber}
              onChange={(event) => updateField("addressNumber", event.target.value)}
              placeholder="123"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address-complement">Complemento (opcional)</Label>
            <Input
              id="address-complement"
              value={form.addressComplement}
              onChange={(event) => updateField("addressComplement", event.target.value)}
              placeholder="Sala, bloco, referência..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address-neighborhood">Bairro</Label>
            <Input
              id="address-neighborhood"
              value={form.addressNeighborhood}
              onChange={(event) => updateField("addressNeighborhood", event.target.value)}
              placeholder="Bairro"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address-city">Cidade</Label>
            <Input
              id="address-city"
              value={form.addressCity}
              onChange={(event) => updateField("addressCity", event.target.value)}
              placeholder="Cidade"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address-state">Estado</Label>
            <Select
              value={form.addressState || undefined}
              onValueChange={(value) => updateField("addressState", value)}
            >
              <SelectTrigger id="address-state">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {BRAZILIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <UserRound className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <CardTitle>Representante legal</CardTitle>
              <CardDescription>Sócio administrador responsável</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="legal-representative-name">Representante legal — Sócio administrador</Label>
            <Input
              id="legal-representative-name"
              value={form.legalRepresentativeName}
              onChange={(event) => updateField("legalRepresentativeName", event.target.value)}
              placeholder="Nome completo"
              autoComplete="name"
            />
          </div>
          <div className="space-y-2 sm:col-span-2 sm:max-w-sm">
            <Label htmlFor="legal-representative-cpf">CPF</Label>
            <Input
              id="legal-representative-cpf"
              value={form.legalRepresentativeCpf}
              onChange={(event) =>
                updateField("legalRepresentativeCpf", formatCpfInput(event.target.value))
              }
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving} className="min-w-40">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar e continuar"
          )}
        </Button>
      </div>
    </form>
  );
};
