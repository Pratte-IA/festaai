export type N8nProvisionStatus = "draft" | "active" | "error";

export type AutomationTemplateKey =
  | "atendimento"
  | "boas-vindas"
  | "sete-dias-antes"
  | "pesquisa-satisfacao"
  | "passar-para-vendedor";

export type AutomationTemplateDirection = "inbound" | "outbound";

export type AutomationBindingMode = "whatsapp_connection" | "phone_number";

export interface AutomationTemplateDefinition {
  bindingMode: AutomationBindingMode;
  description: string;
  direction: AutomationTemplateDirection;
  key: AutomationTemplateKey;
  title: string;
}

export interface AutomationTemplateBinding {
  connectionId: number | null;
  forwardPhone: string | null;
  key: AutomationTemplateKey;
}

export interface AutomationTemplateBindingRow extends AutomationTemplateDefinition {
  connectionId: number | null;
  forwardPhone: string | null;
}

export interface TenantAutomationWorkflow {
  connectionId: number | null;
  name: string;
  templateId: string;
  workflowId: string;
  isOrchestrator: boolean;
}

export interface TenantAutomationSettingsView {
  automationBindings: AutomationTemplateBindingRow[];
  inboundAutomationEnabled: boolean;
  n8nEditorUrl: string | null;
  n8nProvisionStatus: N8nProvisionStatus | null;
  orchestratorWorkflowId: string | null;
  workflows: TenantAutomationWorkflow[];
}
