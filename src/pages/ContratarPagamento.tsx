import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommercialCheckoutWizard } from "@/components/contratar/CommercialCheckoutWizard";
import { usePublicCheckoutStatus } from "@/features/billing";
import { contratarCtaGradientClass } from "./contratar-commercial-data";

const ContratarPagamento = () => {
  const [searchParams] = useSearchParams();
  const externalReference = searchParams.get("ref");
  const { data: checkout, error, isFetching, isLoading } = usePublicCheckoutStatus(externalReference);

  if (!externalReference) {
    return <Navigate to="/contratar#planos" replace />;
  }

  const isCompleted =
    checkout?.checkoutPhase === "completed" || checkout?.checkoutPhase === "manual_payment";

  return (
    <div
      id="top"
      className="relative isolate min-h-screen min-h-dvh overflow-x-hidden bg-[#07070c] text-zinc-100 antialiased"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-[#5158e7]/20 blur-[100px]" />
        <div className="absolute -right-20 top-1/3 h-[22rem] w-[22rem] rounded-full bg-[#d95693]/18 blur-[90px]" />
        <div className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-[#7c5cff]/14 blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-screen min-h-dvh flex-col">
        <header className="shrink-0 border-b border-white/[0.08] backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <Link to="/contratar#planos">
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                Voltar aos planos
              </Link>
            </Button>
            <Link to="/contratar#top" className="flex min-h-[44px] items-center gap-3">
              <img
                src="/favicon%20simbolo1.svg?v=2"
                alt=""
                className="h-9 w-9 object-contain"
                aria-hidden
              />
              <span className="text-lg font-bold tracking-tight text-white">FestaAI</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto w-full max-w-2xl">
            <div className="rounded-2xl border border-white/[0.1] bg-[#12121a]/95 p-6 shadow-2xl shadow-[#5158e7]/10 backdrop-blur-md sm:p-8">
              {!isCompleted ? (
                <>
                  <h1 className="text-2xl font-bold text-white sm:text-3xl">Concluir contratação</h1>
                  <p className="mt-2 text-sm text-zinc-400">
                    {checkout?.billingChannel === "manual"
                      ? "Contrato aceito. Veja abaixo as instruções de pagamento negociadas com nossa equipe."
                      : "Siga os passos abaixo para pagar a implementação, efetivar seu cadastro e ativar a mensalidade FestaAI."}
                  </p>
                </>
              ) : null}

              {isLoading && (
                <p className="mt-8 text-sm text-zinc-400">Carregando informações do checkout...</p>
              )}

              {error && (
                <p className="mt-8 text-sm text-red-300">
                  {error instanceof Error ? error.message : "Não foi possível carregar o checkout."}
                </p>
              )}

              {checkout && (
                <div className={isCompleted ? "" : "mt-8"}>
                  <CommercialCheckoutWizard
                    checkout={checkout}
                    externalReference={externalReference}
                    isPolling={isFetching && !isCompleted}
                  />
                  {isCompleted ? (
                    <Button asChild className={`mt-6 w-full border-0 ${contratarCtaGradientClass}`}>
                      <Link to="/login">Acessar o FestaAI</Link>
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContratarPagamento;
