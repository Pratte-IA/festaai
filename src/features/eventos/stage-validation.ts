import { stageMap } from "./constants";
import { FunnelType, Stage } from "./types";

export const getDefaultStageForFunnel = (funnel: FunnelType): Stage => stageMap[funnel][0].key;

export const isStageValidForFunnel = (funnel: FunnelType, stage: Stage): boolean =>
  stageMap[funnel].some((stageDefinition) => stageDefinition.key === stage);
