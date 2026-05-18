export const contributionKeys = {
  all: ['contributions'] as const,

  userByIdentifier: (email: string) =>
    [...contributionKeys.all, 'user-by-identifier', email] as const,

  /** All summary caches for a group (overall + any filtered periods). */
  groupSummaryRoot: (groupId: string) =>
    [...contributionKeys.all, 'group-summary', groupId] as const,

  summaryOverall: (groupId: string) =>
    [...contributionKeys.groupSummaryRoot(groupId), 'overall'] as const,

  summaryFiltered: (groupId: string, periodStart: string, periodEnd: string) =>
    [
      ...contributionKeys.groupSummaryRoot(groupId),
      'filtered',
      periodStart,
      periodEnd,
    ] as const,

  /** Prefix match invalidates overall and every filtered period for one group */
  summaryPairsForGroup: (groupId: string) => contributionKeys.groupSummaryRoot(groupId),
}
