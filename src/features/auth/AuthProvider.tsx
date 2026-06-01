import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { setAuthTokenGetter } from '@/lib/auth'
import { AuthContext } from './auth-context'
import { UserRole } from '@/types'
import type { User } from '@/types'
import { apiClient } from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'

interface AuthProviderProps {
  children: ReactNode
}

// API call to fetch user
async function getUserDetails(email: string): Promise<User> {
  const date = new Date().toISOString()
  return await apiClient.get(`/user/by-identifier/${email}?date=${date}`)
}

// Inner provider that uses Auth0 hooks
const AuthContextProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    isAuthenticated,
    isLoading: auth0Loading,
    user: auth0User,
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout,
    error,
  } = useAuth0()

  // Set up API token getter when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setAuthTokenGetter(getAccessTokenSilently)
    }
  }, [isAuthenticated, getAccessTokenSilently])

  // React Query to fetch and manage user details
  const {
    data: userDetails,
    isLoading: isQueryLoading,
    error: queryError,
  } = useQuery<User, Error>({
    queryKey: ['user-details', auth0User?.email],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      localStorage.setItem('auth_token', token)
      return await getUserDetails(auth0User!.email!)
    },
    enabled: isAuthenticated && !!auth0User?.email && !auth0Loading,
    retry: false,
  })

  // Compute currentUser with fallback if query fails
  const currentUser = useMemo(() => {
    if (userDetails) return userDetails
    if (isAuthenticated && auth0User?.email && !isQueryLoading && queryError) {
      return { email: auth0User.email }
    }
    return null
  }, [userDetails, isAuthenticated, auth0User, isQueryLoading, queryError])

  // Compute isPendingApproval from 404 API status code
  const isPendingApproval = useMemo(() => {
    return !!(queryError && (queryError as any).response?.status === 404)
  }, [queryError])

  // Combined loading state
  const isLoading = auth0Loading || (isAuthenticated && isQueryLoading && !currentUser)

  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getAccessTokenSilently()
      if (token) {
        localStorage.setItem('auth_token', token)
      }
      return token
    } catch (err) {
      console.error('Error getting Auth0 token:', err)
      return null
    }
  }, [getAccessTokenSilently])

  const login = useCallback(() => {
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: `${window.location.origin}/callback`,
      },
    })
  }, [loginWithRedirect])

  const logout = useCallback(() => {
    // Clear stored tokens
    localStorage.removeItem('auth_token')
    auth0Logout({
      logoutParams: {
        returnTo: `${window.location.origin}/login`,
      },
    })
  }, [auth0Logout])

  const contextValue = useMemo(() => ({
    isAuthenticated,
    isLoading,
    currentUser,
    login,
    logout,
    getToken,
    error: error?.message || null,
    isPendingApproval,
  }), [isAuthenticated, isLoading, currentUser, login, logout, getToken, error, isPendingApproval])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Dev mode mock provider for testing without Auth0
const DevAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored dev user
    const storedUser = localStorage.getItem('dev_user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setTimeout(() => {
        setCurrentUser(user)
        setIsLoading(false)
      }, 0)
    }
  }, [])

  const login = useCallback(() => {
    // Mock login with an annotator user for dev testing
    const devUser: User = {
      id: 'u2',
      username: 'Pema Lhamo',
      email: 'pema@example.com',
      role: UserRole.Annotator,
      group_id: 'g1',
    }
    localStorage.setItem('dev_user', JSON.stringify(devUser))
    setCurrentUser(devUser)
    window.location.href = '/workspace'
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('dev_user')
    setCurrentUser(null)
    window.location.href = '/login'
  }, [])

  const getToken = useCallback(async () => 'dev-token', [])

  const contextValue = useMemo(() => ({
    isAuthenticated: !!currentUser,
    isLoading,
    currentUser,
    login,
    logout,
    getToken,
    error: null,
    isPendingApproval: false,
  }), [currentUser, isLoading, login, logout, getToken])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Main provider that wraps everything with Auth0
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE
  const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || `${window.location.origin}/callback`
  const useDevAuth = import.meta.env.VITE_DEV_AUTH === 'true'
  
  // Check if we should use dev auth (explicitly enabled, dev mode flag in URL, or Auth0 not configured)
  const urlParams = new URLSearchParams(window.location.search)
  const devModeFromUrl = urlParams.get('dev') === 'true'
  const storedDevMode = localStorage.getItem('dev_auth_mode') === 'true'

  // Persist dev mode if set via URL
  if (devModeFromUrl && !storedDevMode) {
    localStorage.setItem('dev_auth_mode', 'true')
  }

  const shouldUseDevAuth = useDevAuth || devModeFromUrl || storedDevMode || !domain || !clientId

  // Use dev provider if enabled
  if (shouldUseDevAuth) {
    console.warn('Using dev auth provider.')
    return <DevAuthProvider>{children}</DevAuthProvider>
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        audience: audience,
      }}
      useRefreshTokens={true}
      useRefreshTokensFallback={true}
      cacheLocation="localstorage"
    >
      <AuthContextProvider>{children}</AuthContextProvider>
    </Auth0Provider>
  )
}

export default AuthProvider
