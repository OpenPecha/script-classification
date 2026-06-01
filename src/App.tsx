import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ThemeProvider } from '@/components/common'
import { router } from '@/routes'
import { AuthProvider, useAuth, WrongAppDialog, NoGroupDialog } from '@/features/auth'
import { useLanguageSync } from '@/hooks'
import { scriptTypeKeys } from '@/features/workspace/api/script-type/script-type-keys'
import { apiClient } from '@/lib/axios'
import { UserRole } from '@/types'
import type { ScriptStyle } from '@/types'
import { APPLICATION_NAME, APPLICATION_URLS } from '@/lib/constant'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

queryClient.prefetchQuery({
  queryKey: scriptTypeKeys.all,
  queryFn: (): Promise<ScriptStyle[]> => apiClient.get('/script-type/'),
  staleTime: Infinity,
})

// This code is only for TypeScript
declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__:
      import("@tanstack/query-core").QueryClient;
  }
}

if (import.meta.env.DEV) {
  window.__TANSTACK_QUERY_CLIENT__ = queryClient;
}

function AuthGuard() {
  const { currentUser } = useAuth()

  const isWrongApp = currentUser && currentUser.role !== UserRole.Admin && currentUser.application && currentUser.application !== APPLICATION_NAME
  if (isWrongApp) {
    const wrongAppUrl = currentUser.application ? (APPLICATION_URLS[currentUser.application] ?? null) : null
    return <WrongAppDialog url={wrongAppUrl} />
  }

  const hasNoGroup = currentUser && currentUser.role !== UserRole.Admin && !currentUser.group_id
  // Only show group dialog if the user has a role assigned (role error is handled by pending-approval page)
  if (currentUser?.role && hasNoGroup) {
    return <NoGroupDialog />
  }

  return null
}

function App() {
  // Sync i18n language with Zustand store
  useLanguageSync()
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthGuard />
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
