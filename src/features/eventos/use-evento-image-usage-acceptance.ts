import { useMemo } from "react";

import {
  IMAGE_USAGE_TERM_KEY,
  formatImageUsageContractLabel,
  useTenantAcceptanceTerms,
} from "@/features/configuracoes";

import { useEventoAcceptanceResponses } from "./use-evento-closing-form";

export type ImageUsageAcceptanceStatus = "authorized" | "declined" | "pending";

export interface EventoImageUsageAcceptanceResult {
  isLoading: boolean;
  label: string;
  status: ImageUsageAcceptanceStatus;
}

export const useEventoImageUsageAcceptance = (
  eventoId: number | null,
): EventoImageUsageAcceptanceResult => {
  const { data: terms = [], isLoading: isTermsLoading } = useTenantAcceptanceTerms();
  const { data: responses = {}, isLoading: isResponsesLoading } =
    useEventoAcceptanceResponses(eventoId);

  return useMemo(() => {
    const isLoading = isTermsLoading || isResponsesLoading;
    const imageTerm = terms.find(
      (term) => term.termKey === IMAGE_USAGE_TERM_KEY && term.active,
    );

    if (!imageTerm) {
      return { isLoading, label: "Pendente", status: "pending" };
    }

    const accepted = responses[imageTerm.id];
    if (accepted === undefined) {
      return { isLoading, label: "Pendente", status: "pending" };
    }

    return {
      isLoading,
      label: formatImageUsageContractLabel(accepted),
      status: accepted ? "authorized" : "declined",
    };
  }, [terms, responses, isTermsLoading, isResponsesLoading]);
};
