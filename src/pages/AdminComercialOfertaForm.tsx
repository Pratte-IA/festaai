import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Copy } from "lucide-react";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BASE_PLAN_SLUG_VALUES,
  basePlanSlugLabels,
  COMMERCIAL_BILLING_CHANNEL_VALUES,
  commercialBillingChannelLabels,
  buildDefaultOfferFromPlan,
  buildOfferPublicUrl,
  type BasePlanSlug,
  type CommercialBillingChannel,
  type CommercialOfferInput,
  useAdminCommercialOffer,
  useAdminSaveCommercialOffer,
  useAdminUpdateCommercialLeadStatus,
} from "@/features/comercial";
import { Textarea } from "@/components/ui/textarea";
import { resolveCommercialBillingRule } from "@/features/comercial/commercial-billing-rules";
import { toast } from "@/hooks/use-toast";

const toDatetimeLocal = (iso: string) => {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const AdminComercialOfertaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const offerId = id ? Number(id) : null;
  const isEditing = offerId != null && Number.isInteger(offerId) && offerId > 0;

  const { data: existingOffer, isLoading } = useAdminCommercialOffer(isEditing ? offerId : null);
  const saveOffer = useAdminSaveCommercialOffer();
  const updateLeadStatus = useAdminUpdateCommercialLeadStatus();

  const initialDraft = useMemo(() => {
    const leadId = searchParams.get("leadId");
    const company = searchParams.get("company") ?? "";
    const email = searchParams.get("email") ?? "";
    return buildDefaultOfferFromPlan("fidelidade", {
      leadId: leadId ? Number(leadId) : null,
      recipientCompany: company,
      recipientEmail: email,
      name: company ? `Proposta ${company}` : undefined,
    });
  }, [searchParams]);

  const [draft, setDraft] = useState<CommercialOfferInput>(initialDraft);

  useEffect(() => {
    if (!existingOffer) return;
    setDraft({
      basePlanSlug: existingOffer.base_plan_slug as BasePlanSlug,
      billingChannel: (existingOffer.billing_channel as CommercialBillingChannel) ?? "asaas",
      expiresAt: existingOffer.expires_at,
      leadId: existingOffer.lead_id,
      loyaltyMonths: existingOffer.loyalty_months,
      monthlyPrice: Number(existingOffer.monthly_price),
      name: existingOffer.name,
      recipientCompany: existingOffer.recipient_company ?? "",
      recipientEmail: existingOffer.recipient_email ?? "",
      setupInstallments: existingOffer.setup_installments,
      setupPaymentMethods: existingOffer.setup_payment_methods ?? "",
      setupPrice: Number(existingOffer.setup_price),
      status: existingOffer.status as CommercialOfferInput["status"],
      subscriptionPaymentMethods: existingOffer.subscription_payment_methods ?? "",
      token: existingOffer.token,
    });
  }, [existingOffer]);

  const applyBasePlan = (basePlanSlug: BasePlanSlug) => {
    setDraft((current) => {
      const defaults = buildDefaultOfferFromPlan(basePlanSlug, {
        billingChannel: current.billingChannel,
        expiresAt: current.expiresAt,
        leadId: current.leadId,
        name: current.name,
        recipientCompany: current.recipientCompany,
        recipientEmail: current.recipientEmail,
        setupPaymentMethods:
          current.billingChannel === "manual"
            ? current.setupPaymentMethods
            : undefined,
        subscriptionPaymentMethods:
          current.billingChannel === "manual"
            ? current.subscriptionPaymentMethods
            : undefined,
        token: current.token,
      });
      return { ...current, ...defaults, basePlanSlug };
    });
  };

  const applyBillingChannel = (billingChannel: CommercialBillingChannel) => {
    setDraft((current) => {
      const rule = resolveCommercialBillingRule(current.basePlanSlug);
      return {
        ...current,
        billingChannel,
        setupPaymentMethods:
          billingChannel === "manual" ? current.setupPaymentMethods : rule?.setup_payment_methods ?? "",
        subscriptionPaymentMethods:
          billingChannel === "manual"
            ? current.subscriptionPaymentMethods
            : rule?.subscription_payment_methods ?? "",
      };
    });
  };

  const handleSave = async (activate: boolean) => {
    if (draft.billingChannel === "manual") {
      if (!draft.setupPaymentMethods.trim() || !draft.subscriptionPaymentMethods.trim()) {
        toast({
          title: "Informe as formas de pagamento",
          description: "Para cobrança manual, descreva como o cliente paga o setup e a mensalidade.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const values: CommercialOfferInput = {
        ...draft,
        status: activate ? "active" : draft.status === "active" ? "active" : "draft",
      };
      const savedId = await saveOffer.mutateAsync({ id: isEditing ? offerId : null, values });
      if (activate && values.leadId) {
        await updateLeadStatus.mutateAsync({ id: values.leadId, status: "em_contato" });
      }
      toast({ title: activate ? "Oferta publicada" : "Oferta salva" });
      if (!isEditing) {
        navigate(`/admin/comercial/ofertas/${savedId}`, { replace: true });
      }
    } catch (error) {
      toast({
        title: "Não foi possível salvar a oferta",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildOfferPublicUrl(draft.token));
      toast({ title: "Link copiado" });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  if (isEditing && isLoading) {
    return (
      <AdminPageShell backHref="/admin/comercial/ofertas" backLabel="Voltar às ofertas" title="Carregando...">
        <p className="text-sm text-muted-foreground">Carregando oferta...</p>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      backHref="/admin/comercial/ofertas"
      backLabel="Voltar às ofertas"
      description="Defina os valores negociados e publique o link para o cliente."
      title={isEditing ? "Editar oferta" : "Nova oferta"}
    >
      <Card className="rounded-2xl border-white/80 bg-white/90">
        <CardHeader>
          <CardTitle>Dados da proposta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="offer-name">Nome da proposta</Label>
            <Input
              id="offer-name"
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              value={draft.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-company">Empresa destinatária</Label>
            <Input
              id="offer-company"
              onChange={(e) => setDraft({ ...draft, recipientCompany: e.target.value })}
              value={draft.recipientCompany}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-email">E-mail destinatário (opcional)</Label>
            <Input
              id="offer-email"
              onChange={(e) => setDraft({ ...draft, recipientEmail: e.target.value })}
              type="email"
              value={draft.recipientEmail}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-base">Plano base (benefícios)</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              id="offer-base"
              onChange={(e) => applyBasePlan(e.target.value as BasePlanSlug)}
              value={draft.basePlanSlug}
            >
              {BASE_PLAN_SLUG_VALUES.map((slug) => (
                <option key={slug} value={slug}>
                  {basePlanSlugLabels[slug]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-expires">Validade</Label>
            <Input
              id="offer-expires"
              onChange={(e) => setDraft({ ...draft, expiresAt: new Date(e.target.value).toISOString() })}
              type="datetime-local"
              value={toDatetimeLocal(draft.expiresAt)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="offer-billing-channel">Forma de cobrança</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              id="offer-billing-channel"
              onChange={(e) => applyBillingChannel(e.target.value as CommercialBillingChannel)}
              value={draft.billingChannel}
            >
              {COMMERCIAL_BILLING_CHANNEL_VALUES.map((channel) => (
                <option key={channel} value={channel}>
                  {commercialBillingChannelLabels[channel]}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Use &quot;Pagamento negociado&quot; quando o cliente paga fora do Asaas (ex.: PIX direto na
              conta).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-monthly">Mensalidade (R$)</Label>
            <Input
              id="offer-monthly"
              min={0}
              onChange={(e) => setDraft({ ...draft, monthlyPrice: Number(e.target.value) })}
              step="0.01"
              type="number"
              value={draft.monthlyPrice}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-setup">Setup (R$)</Label>
            <Input
              id="offer-setup"
              min={0}
              onChange={(e) => setDraft({ ...draft, setupPrice: Number(e.target.value) })}
              step="0.01"
              type="number"
              value={draft.setupPrice}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-installments">Parcelas do setup</Label>
            <Input
              id="offer-installments"
              min={1}
              onChange={(e) =>
                setDraft({ ...draft, setupInstallments: e.target.value ? Number(e.target.value) : null })
              }
              type="number"
              value={draft.setupInstallments ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-loyalty">Fidelidade (meses)</Label>
            <Input
              id="offer-loyalty"
              min={0}
              onChange={(e) =>
                setDraft({ ...draft, loyaltyMonths: e.target.value ? Number(e.target.value) : null })
              }
              placeholder="Vazio = sem fidelidade"
              type="number"
              value={draft.loyaltyMonths ?? ""}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="offer-setup-payment">Pagamento do setup</Label>
            {draft.billingChannel === "manual" ? (
              <Textarea
                id="offer-setup-payment"
                onChange={(e) => setDraft({ ...draft, setupPaymentMethods: e.target.value })}
                placeholder="Ex.: PIX direto na conta FestaAI — chave CNPJ ..."
                rows={3}
                value={draft.setupPaymentMethods}
              />
            ) : (
              <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {draft.setupPaymentMethods || "Conforme checkout Asaas do plano base"}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="offer-subscription-payment">Pagamento da mensalidade</Label>
            {draft.billingChannel === "manual" ? (
              <Textarea
                id="offer-subscription-payment"
                onChange={(e) => setDraft({ ...draft, subscriptionPaymentMethods: e.target.value })}
                placeholder="Ex.: PIX mensal enviado todo dia 5 para a mesma conta"
                rows={3}
                value={draft.subscriptionPaymentMethods}
              />
            ) : (
              <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {draft.subscriptionPaymentMethods || "Conforme checkout Asaas do plano base"}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="offer-token">Token do link (somente leitura)</Label>
            <div className="flex gap-2">
              <Input id="offer-token" readOnly value={draft.token} />
              <Button onClick={() => void copyLink()} type="button" variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{buildOfferPublicUrl(draft.token)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button disabled={saveOffer.isPending} onClick={() => void handleSave(false)} variant="outline">
          Salvar rascunho
        </Button>
        <Button disabled={saveOffer.isPending} onClick={() => void handleSave(true)}>
          Publicar oferta
        </Button>
        {draft.status === "active" && (
          <Button asChild variant="secondary">
            <Link to={`/contratar/oferta/${draft.token}`} target="_blank">
              Pré-visualizar
            </Link>
          </Button>
        )}
      </div>
    </AdminPageShell>
  );
};

export default AdminComercialOfertaForm;
