import { useState } from "react";
import { Barcode, Check, Copy, CreditCard, ExternalLink, Loader2, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentCheckoutDetails, PaymentKind, usePayWithCreditCard } from "@/features/billing";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { contratarCtaGradientClass } from "@/pages/contratar-commercial-data";

type PaymentTab = "pix" | "boleto" | "card";

interface InlinePaymentPanelProps {
  className?: string;
  details?: PaymentCheckoutDetails | null;
  externalReference: string;
  holderCpfCnpj?: string;
  isLoading?: boolean;
  paymentKind: PaymentKind;
  title: string;
}

const tabs = [
  { icon: QrCode, id: "pix" as const, label: "Pix" },
  { icon: Barcode, id: "boleto" as const, label: "Boleto" },
  { icon: CreditCard, id: "card" as const, label: "Cartão" },
];

const copyToClipboard = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast({ title: `${label} copiado`, description: "Cole no app do seu banco para pagar." });
  } catch {
    toast({
      title: "Não foi possível copiar",
      description: "Selecione e copie manualmente o código.",
      variant: "destructive",
    });
  }
};

const isSandbox = import.meta.env.VITE_APP_ENV === "development";

export const InlinePaymentPanel = ({
  className,
  details,
  externalReference,
  holderCpfCnpj = "",
  isLoading = false,
  paymentKind,
  title,
}: InlinePaymentPanelProps) => {
  const payWithCreditCard = usePayWithCreditCard();
  const [activeTab, setActiveTab] = useState<PaymentTab>("pix");
  const [cardForm, setCardForm] = useState({
    ccv: "",
    cpfCnpj: holderCpfCnpj,
    expiry: "",
    holderName: "",
    number: "",
  });

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Carregando opções de pagamento...
      </div>
    );
  }

  if (!details) {
    return (
      <div
        className={cn(
          "rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400",
          className,
        )}
      >
        Gere a cobrança para exibir as formas de pagamento.
      </div>
    );
  }

  const pixPayload = details.pixQrCode?.payload;
  const pixImage = details.pixQrCode?.encodedImage;
  const boletoLine = details.boleto?.identificationField ?? details.boleto?.barCode;
  const isPaid = details.paymentStatus === "RECEIVED" || details.paymentStatus === "CONFIRMED";

  const submitCardPayment = async () => {
    const [expiryMonth, expiryYearRaw] = cardForm.expiry.split("/");
    const expiryYear = expiryYearRaw?.length === 2 ? expiryYearRaw : expiryYearRaw?.slice(-2);

    if (!cardForm.holderName || !cardForm.number || !expiryMonth || !expiryYear || !cardForm.ccv) {
      toast({
        title: "Preencha os dados do cartão",
        description: "Informe titular, número, validade e CVV.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await payWithCreditCard.mutateAsync({
        creditCard: {
          ccv: cardForm.ccv,
          expiryMonth,
          expiryYear,
          holderName: cardForm.holderName,
          number: cardForm.number,
        },
        externalReference,
        holderCpfCnpj: cardForm.cpfCnpj || holderCpfCnpj,
        paymentKind,
      });

      if (result.paymentStatus === "CONFIRMED" || result.paymentStatus === "RECEIVED") {
        toast({
          title: "Pagamento aprovado!",
          description: "Estamos atualizando sua contratação.",
        });
      }
    } catch (error) {
      toast({
        title: "Pagamento não aprovado",
        description: error instanceof Error ? error.message : "Verifique os dados do cartão.",
        variant: "destructive",
      });
    }
  };

  const fillSandboxTestCard = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear() + 1).slice(-2);
    setCardForm((current) => ({
      ...current,
      ccv: "123",
      expiry: `${month}/${year}`,
      holderName: current.holderName || "Teste Sandbox",
      number: "4444444444444444",
    }));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs text-zinc-400">
          Pix, boleto e cartão ficam aqui no FestaAI — sem sair da plataforma.
        </p>
      </div>

      {isPaid ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          Pagamento confirmado! Atualizando...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-colors sm:text-sm",
                  activeTab === tab.id
                    ? "border-[#5158e7]/50 bg-[#5158e7]/15 text-white"
                    : "border-white/10 bg-[#07070c]/60 text-zinc-400 hover:border-white/20 hover:text-zinc-200",
                )}
              >
                <tab.icon className="h-4 w-4" aria-hidden />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "pix" ? (
            <div className="rounded-xl border border-white/10 bg-[#07070c]/60 p-5 space-y-4">
              {pixImage ? (
                <div className="mx-auto flex max-w-[220px] justify-center rounded-xl bg-white p-3">
                  <img
                    src={`data:image/png;base64,${pixImage}`}
                    alt="QR Code Pix para pagamento"
                    className="h-auto w-full"
                  />
                </div>
              ) : (
                <p className="text-sm text-zinc-400">QR Code Pix indisponível para esta cobrança.</p>
              )}
              {pixPayload ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Pix copia e cola</p>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <p className="break-all text-xs leading-relaxed text-zinc-300">{pixPayload}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/15 bg-transparent text-zinc-200 hover:bg-white/5"
                    onClick={() => void copyToClipboard(pixPayload, "Código Pix")}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar código Pix
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "boleto" ? (
            <div className="rounded-xl border border-white/10 bg-[#07070c]/60 p-5 space-y-4">
              {boletoLine ? (
                <>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Linha digitável</p>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <p className="break-all text-sm font-mono text-zinc-200">{boletoLine}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/15 bg-transparent text-zinc-200 hover:bg-white/5"
                    onClick={() => void copyToClipboard(boletoLine, "Linha digitável")}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar linha digitável
                  </Button>
                  {details.invoiceUrl ? (
                    <Button
                      asChild
                      type="button"
                      variant="outline"
                      className="w-full border-white/15 bg-transparent text-zinc-200 hover:bg-white/5"
                    >
                      <a href={details.invoiceUrl} target="_blank" rel="noreferrer">
                        Abrir boleto em PDF
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-zinc-400">Boleto indisponível para esta cobrança.</p>
              )}
            </div>
          ) : null}

          {activeTab === "card" ? (
            <div className="rounded-xl border border-white/10 bg-[#07070c]/60 p-5 space-y-4">
              {isSandbox ? (
                <p className="rounded-lg border border-[#5158e7]/30 bg-[#5158e7]/10 px-3 py-2 text-xs text-[#8b9dff]">
                  Sandbox: use o cartão <strong>4444 4444 4444 4444</strong>, validade futura e CVV{" "}
                  <strong>123</strong>.
                </p>
              ) : null}

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`${paymentKind}-holder`} className="text-zinc-200">
                    Nome no cartão
                  </Label>
                  <Input
                    id={`${paymentKind}-holder`}
                    value={cardForm.holderName}
                    onChange={(e) => setCardForm({ ...cardForm, holderName: e.target.value })}
                    placeholder="Como impresso no cartão"
                    className="border-white/15 bg-[#07070c] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${paymentKind}-number`} className="text-zinc-200">
                    Número do cartão
                  </Label>
                  <Input
                    id={`${paymentKind}-number`}
                    inputMode="numeric"
                    value={cardForm.number}
                    onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                    placeholder="0000 0000 0000 0000"
                    className="border-white/15 bg-[#07070c] text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`${paymentKind}-expiry`} className="text-zinc-200">
                      Validade
                    </Label>
                    <Input
                      id={`${paymentKind}-expiry`}
                      value={cardForm.expiry}
                      onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                      placeholder="MM/AA"
                      className="border-white/15 bg-[#07070c] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${paymentKind}-ccv`} className="text-zinc-200">
                      CVV
                    </Label>
                    <Input
                      id={`${paymentKind}-ccv`}
                      inputMode="numeric"
                      value={cardForm.ccv}
                      onChange={(e) => setCardForm({ ...cardForm, ccv: e.target.value })}
                      placeholder="123"
                      className="border-white/15 bg-[#07070c] text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${paymentKind}-cpf`} className="text-zinc-200">
                    CPF/CNPJ do titular
                  </Label>
                  <Input
                    id={`${paymentKind}-cpf`}
                    value={cardForm.cpfCnpj}
                    onChange={(e) => setCardForm({ ...cardForm, cpfCnpj: e.target.value })}
                    placeholder="000.000.000-00"
                    className="border-white/15 bg-[#07070c] text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {isSandbox ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/15 bg-transparent text-zinc-200 hover:bg-white/5"
                    onClick={fillSandboxTestCard}
                  >
                    Preencher cartão teste
                  </Button>
                ) : null}
                <Button
                  type="button"
                  disabled={payWithCreditCard.isPending}
                  onClick={() => void submitCardPayment()}
                  className={cn("flex-1 border-0", contratarCtaGradientClass)}
                >
                  {payWithCreditCard.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Pagar com cartão"
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
