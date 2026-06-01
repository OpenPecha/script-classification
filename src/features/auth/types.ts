import type { User } from '@/types'

export interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  currentUser: User | null
  login: () => void
  logout: () => void
  getToken: () => Promise<string | null>
  error: string | null
  isPendingApproval: boolean
}
