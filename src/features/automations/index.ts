export { AUTOMATION_TEMPLATE_CATALOG, getAutomationTemplate, isAutomationTemplateKey } from "./automation-catalog";
export type {
  AutomationTemplateBindingRow,
  AutomationTemplateDefinition,
  AutomationTemplateDirection,
  AutomationTemplateKey,
  N8nProvisionStatus,
  TenantAutomationSettingsView,
} from "./types";
export {
  useTenantAutomationSettings,
  useUpdateAutomationTemplateBindings,
} from "./use-tenant-automation-settings";
