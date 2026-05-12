export const agentChangeRequestsQueryKey = (tenantId: number | null) =>
  ["agent-change-requests", tenantId] as const;

export const agentChangeRequestQueryKey = (id: number | null) =>
  ["agent-change-request", id] as const;

export const adminAgentChangeRequestsQueryKey = (filters: {
  status: string;
  tenantId: string;
  urgency: string;
}) => ["admin-agent-change-requests", filters] as const;

export const adminAgentChangeRequestQueryKey = (id: number | null) =>
  ["admin-agent-change-request", id] as const;
