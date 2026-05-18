/** Query params for GET /contributions/{group_id}/summary */
export interface ContributionSummaryQueryParams {
  start_date: string
  end_date: string
}

export interface AnnotatorContributionRow {
  user_id: string
  username: string
  total_annotated: number
  reviewed_count: number
  approved_count: number
}

export interface ReviewerContributionRow {
  user_id: string
  username: string
  total_reviewed: number
  verified_count: number
  /** Distinct tasks rejected in the filtered or all-time window. */
  rejected_tasks: number
  /** Total rejection events (may exceed rejected_tasks). */
  total_rejection: number
}

export interface GroupContributionSummaryResponse {
  group_id: string
  group_name: string
  annotator: AnnotatorContributionRow[]
  reviewer: ReviewerContributionRow[]
}
