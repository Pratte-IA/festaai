export interface N8nWorkflowNode {
  credentials?: Record<string, { id?: string; name?: string }>;
  id?: string;
  name?: string;
  parameters?: Record<string, unknown>;
  type?: string;
  webhookId?: string;
}

export interface N8nWorkflowResponse {
  active?: boolean;
  connections?: Record<string, unknown>;
  id?: string;
  name?: string;
  nodes?: N8nWorkflowNode[];
  settings?: Record<string, unknown>;
}
