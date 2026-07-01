import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildPrivacyPolicyBody,
  COMMERCIAL_CONTACT,
  CONTRACTED_PARTY,
  PRIVACY_POLICY_VERSION,
} from "@/features/comercial/legal";

const Privacidade = () => {
  const body = buildPrivacyPolicyBody();

  return (
    <div className="relative isolate min-h-screen min-h-dvh overflow-x-hidden bg-[#07070c] text-zinc-100 antialiased">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-[#5158e7]/20 blur-[100px]" />
        <div className="absolute -right-20 top-1/3 h-[22rem] w-[22rem] rounded-full bg-[#d95693]/18 blur-[90px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-8 gap-2 text-zinc-300 hover:bg-white/5 hover:text-white"
        >
          <Link to="/contratar">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar
          </Link>
        </Button>

        <article className="rounded-2xl border border-white/[0.1] bg-[#12121a]/95 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <header className="mb-8 border-b border-white/[0.08] pb-6">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Versão {PRIVACY_POLICY_VERSION}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">Política de Privacidade</h1>
            <p className="mt-3 text-sm text-zinc-400">
              {CONTRACTED_PARTY.companyName} · CNPJ {CONTRACTED_PARTY.cnpj}
            </p>
          </header>

          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">{body}</pre>

          <footer className="mt-8 border-t border-white/[0.08] pt-6 text-sm text-zinc-400">
            Dúvidas:{" "}
            <a className="text-[#8b9dff] hover:underline" href={`mailto:${COMMERCIAL_CONTACT.email}`}>
              {COMMERCIAL_CONTACT.email}
            </a>
          </footer>
        </article>
      </div>
    </div>
  );
};

export default Privacidade;
