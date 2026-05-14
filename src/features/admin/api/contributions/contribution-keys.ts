export const contributionKeys = {
  all: ['contributions'] as const,
  summaryPairs: () => [...contributionKeys.all, 'summary-pair'] as const,
  summaryPair: (groupId: string, periodStart: string, periodEnd: string) =>
    [...contributionKeys.summaryPairs(), groupId, periodStart, periodEnd] as const,
  /** Prefix match invalidates every cached period for one group */
  summaryPairsForGroup: (groupId: string) =>
    [...contributionKeys.summaryPairs(), groupId] as const,
  userByIdentifier: (email: string) =>
    [...contributionKeys.all, 'user-by-identifier', email] as const,
}
