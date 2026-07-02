export { AUTOMATION_TEMPLATE_CATALOG, getAutomationTemplate, isAutomationTemplateKey } from "./automation-catalog";
export {
  createDefaultAutomationBindings,
  isAutomationBindingConfigured,
  areAllAutomationBindingsConfigured,
} from "./parse-automation-bindings";
export type {
  AutomationBindingMode,
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
