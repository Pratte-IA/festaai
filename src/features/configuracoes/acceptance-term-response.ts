export const IMAGE_USAGE_TERM_KEY = "uso_imagem";

export type AcceptanceTermResponses = Record<string, boolean | undefined>;

export interface AcceptanceTermLike {
  id: string;
  isRequired: boolean;
  termKey: string | null;
}

export const isImageUsageChoiceTerm = (term: Pick<AcceptanceTermLike, "termKey">) =>
  term.termKey === IMAGE_USAGE_TERM_KEY;

export const buildDefaultTermResponses = (
  terms: AcceptanceTermLike[],
  saved?: Record<string, boolean>,
): AcceptanceTermResponses => {
  const responses: AcceptanceTermResponses = {};

  terms.forEach((term) => {
    if (saved && saved[term.id] !== undefined) {
      responses[term.id] = saved[term.id];
      return;
    }

    if (isImageUsageChoiceTerm(term)) {
      responses[term.id] = true;
    }
  });

  return responses;
};

export const validateAcceptanceTermResponses = (
  terms: AcceptanceTermLike[],
  responses: AcceptanceTermResponses,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  terms.forEach((term) => {
    const response = responses[term.id];

    if (isImageUsageChoiceTerm(term)) {
      if (response === undefined) {
        errors[`term-${term.id}`] = "Selecione uma opção para continuar.";
      }
      return;
    }

    if (term.isRequired && response !== true) {
      errors[`term-${term.id}`] = "Este aceite é obrigatório.";
    }
  });

  return errors;
};

export const buildAcceptanceResponsesPayload = (
  terms: AcceptanceTermLike[],
  responses: AcceptanceTermResponses,
) =>
  terms
    .filter((term) => {
      const response = responses[term.id];
      if (isImageUsageChoiceTerm(term)) return response !== undefined;
      return response === true;
    })
    .map((term) => ({
      accepted: responses[term.id] === true,
      termId: Number(term.id),
    }));

export const formatAceiteStatusLabel = (
  term: Pick<AcceptanceTermLike, "termKey">,
  accepted: boolean,
): string => {
  if (isImageUsageChoiceTerm(term)) {
    return accepted ? "[Autorizado]" : "[Não autorizado]";
  }

  return accepted ? "[Aceito]" : "[Pendente]";
};

export const formatImageUsageContractLabel = (accepted: boolean | undefined): string => {
  if (accepted === undefined) return "—";
  return accepted ? "Autorizo" : "Não autorizo";
};
