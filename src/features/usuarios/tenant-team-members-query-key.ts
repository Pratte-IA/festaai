export const tenantTeamMembersQueryKey = (tenantId: number | null) =>
  ["tenant-team-members", tenantId] as const;
