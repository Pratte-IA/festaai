import { stageMap } from "./constants";
import { FunnelType, Stage } from "./types";

export const getDefaultStageForFunnel = (funnel: FunnelType): Stage => stageMap[funnel][0].key;

/** Etapas legadas migram para etapas atuais do funil Festa. */
export const resolveFunnelStageForImport = (
  funnel: FunnelType,
  stage: Stage,
): { funnel: FunnelType; stage: Stage } => {
  if (stage === ("fechado" as Stage) || stage === ("contrato" as Stage)) {
    if (funnel === "vendas") {
      return { funnel: "festa", stage: "boas_vindas" };
    }

    if (funnel === "festa" && stage === ("contrato" as Stage)) {
      return { funnel: "festa", stage: "planejamento" };
    }
  }

  return { funnel, stage };
};

/** Após formulário público: aceite imediato e migração para Festa / Boas Vindas. */
export const resolveFunnelStageAfterClientForm = (
  funnel: FunnelType,
): { etapa: Stage; funil: FunnelType; status_interno: "ativo" } | null => {
  if (funnel !== "vendas") return null;

  return {
    etapa: "boas_vindas",
    funil: "festa",
    status_interno: "ativo",
  };
};

export const isStageValidForFunnel = (funnel: FunnelType, stage: Stage): boolean =>
  stageMap[funnel].some((stageDefinition) => stageDefinition.key === stage);
