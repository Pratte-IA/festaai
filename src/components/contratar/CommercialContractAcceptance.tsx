import { Link } from "react-router-dom";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ACCEPTANCE_DECLARATION,
  buildCommercialContractBody,
  COMMERCIAL_CONTRACT_VERSION,
} from "@/features/comercial/legal";

import { LegalDocumentPanel } from "./LegalDocumentPanel";

interface CommercialContractAcceptanceProps {
  accepted: boolean;
  className?: string;
  onAcceptedChange: (accepted: boolean) => void;
}

export const CommercialContractAcceptance = ({
  accepted,
  className,
  onAcceptedChange,
}: CommercialContractAcceptanceProps) => {
  const contractBody = buildCommercialContractBody(`${window.location.origin}/privacidade`);

  return (
    <div className={className}>
      <LegalDocumentPanel
        body={contractBody}
        title={`Contrato comercial (versão ${COMMERCIAL_CONTRACT_VERSION})`}
      />

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/[0.1] bg-white/[0.03] p-4">
        <Checkbox
          checked={accepted}
          id="contract-accepted"
          onCheckedChange={(value) => onAcceptedChange(value === true)}
          className="mt-0.5 border-white/30 data-[state=checked]:border-[#5158e7] data-[state=checked]:bg-[#5158e7]"
        />
        <div className="space-y-1">
          <Label htmlFor="contract-accepted" className="cursor-pointer text-sm leading-relaxed text-zinc-200">
            {ACCEPTANCE_DECLARATION}
          </Label>
          <p className="text-xs text-zinc-500">
            Ao continuar, registraremos data, hora, IP e versão do contrato aceito. Leia também a{" "}
            <Link className="text-[#8b9dff] underline-offset-2 hover:underline" to="/privacidade" target="_blank">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};
