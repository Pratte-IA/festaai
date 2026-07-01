import type { Json } from "@/lib/supabase/database.types";

import {
  mergeAutomationTemplateBindings,
  parseAutomationTemplateBindings,
} from "./parse-automation-bindings";
import type { N8nProvisionStatus, TenantAutomationSettingsView, TenantAutomationWorkflow } from "./types";

const ORCHESTRATOR_NAME_HINTS = ["orquestrador", "orchestrator"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseProvisionStatus = (value: unknown): N8nProvisionStatus | null => {
  if (value === "active" || value === "error" || value === "draft") return value;
  return null;
};

const isOrchestratorName = (name: string) =>
  ORCHESTRATOR_NAME_HINTS.some((hint) => name.toLowerCase().includes(hint));

export const parseTenantAutomationWorkflows = (
  raw: Json | null | undefined,
  orchestratorWorkflowId: string | null,
): TenantAutomationWorkflow[] => {
  if (!Array.isArray(raw)) return [];

  const workflows: TenantAutomationWorkflow[] = [];

  for (const entry of raw) {
    if (!isRecord(entry)) continue;

    const workflowId = typeof entry.workflowId === "string" ? entry.workflowId.trim() : "";
    if (!workflowId) continue;

    const name = typeof entry.name === "string" ? entry.name.trim() : "Template sem nome";
    const templateId = typeof entry.templateId === "string" ? entry.templateId.trim() : "";
    const connectionId =
      typeof entry.connectionId === "number" && Number.isFinite(entry.connectionId)
        ? entry.connectionId
        : null;

    workflows.push({
      connectionId,
      isOrchestrator: orchestratorWorkflowId === workflowId || isOrchestratorName(name),
      name,
      templateId,
      workflowId,
    });
  }

  return workflows.sort((a, b) => {
    if (a.isOrchestrator !== b.isOrchestrator) return a.isOrchestrator ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });
};

export const serializeTenantAutomationWorkflows = (
  workflows: TenantAutomationWorkflow[],
): Json => {
  return workflows.map((workflow) => ({
    connectionId: workflow.connectionId,
    name: workflow.name,
    templateId: workflow.templateId,
    workflowId: workflow.workflowId,
  }));
};

export const parseTenantAutomationSettingsRow = (
  row: Record<string, unknown> | null,
): TenantAutomationSettingsView => {
  const orchestratorWorkflowId =
    typeof row?.n8n_workflow_id === "string" ? row.n8n_workflow_id : null;
  const storedBindings = parseAutomationTemplateBindings(
    row?.automation_template_bindings as Json | null | undefined,
  );

  return {
    automationBindings: mergeAutomationTemplateBindings(storedBindings),
    inboundAutomationEnabled: row?.inbound_automation_enabled === true,
    n8nEditorUrl: typeof row?.n8n_editor_url === "string" ? row.n8n_editor_url : null,
    n8nProvisionStatus: parseProvisionStatus(row?.n8n_provision_status),
    orchestratorWorkflowId,
    workflows: parseTenantAutomationWorkflows(
      row?.n8n_workflows as Json | null | undefined,
      orchestratorWorkflowId,
    ),
  };
};

export const buildDefaultAutomationSettingsView = (): TenantAutomationSettingsView => ({
  automationBindings: mergeAutomationTemplateBindings([]),
  inboundAutomationEnabled: false,
  n8nEditorUrl: null,
  n8nProvisionStatus: null,
  orchestratorWorkflowId: null,
  workflows: [],
});
