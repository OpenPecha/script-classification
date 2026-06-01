// User roles in the system
export enum UserRole {
  Admin = 'admin',
  Annotator = 'annotator',
  Reviewer = 'reviewer',
  FinalReviewer = 'final reviewer',
}

// User interface
export interface User {
  id?: string
  username?: string
  email: string
  role?: UserRole
  group_name?: string
  group_id?: string
  picture?: string
  application?: string
  createdAt?: Date
}

// Request payload for creating users
export interface CreateUserDTO {
  username?: string
  email: string
  role?: UserRole
  group_id?: string
  picture?: string
}

// Request payload for updating users
export interface UpdateUserDTO {
  new_username?: string
  new_email?: string
  new_role?: UserRole
  new_group_id?: string
}

// Paginated response wrapper
export interface UserListResponse {
  items: User[]
  total: number
  limit: number
  offset: number
}

// User query filters
export interface UserFilters {
  search?: string
  role?: UserRole
  group_id?: string
  offset?: number
  limit?: number
}

// Role display configuration
export const ROLE_CONFIG: Record<UserRole, { label: string; description: string }> = {
  [UserRole.Admin]: { label: 'Admin', description: 'System administrator with full access' },
  [UserRole.Annotator]: { label: 'Annotator', description: 'Annotates and transcribes content' },
  [UserRole.Reviewer]: { label: 'Reviewer', description: 'Reviews and validates corrections' },
  [UserRole.FinalReviewer]: { label: 'Final Reviewer', description: 'Performs final quality check' },
}

// User contribution from report endpoint
export interface UserContribution {
  task_id: string
  name: string
  batch_name: string
  updated_time: string
  role: 'annotator' | 'reviewer' | 'final reviewer'
  script_type: string | null
  approved: boolean | null
  reviewed: boolean | null
  rejection_count: number
}

// Wrapped response from /tasks/scriptclassification/{userId}/contributions
export interface UserContributionResponse {
  total_count: number
  approved_count: number
  reviewed_count: number
  rejection_count: number
  items: UserContribution[]
}

// User contribution filters
export interface UserContributionFilters {
  start_date: string
  end_date: string
}

