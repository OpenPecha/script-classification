import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ThemeProvider } from '@/components/common'
import { router } from '@/routes'
import { AuthProvider, useAuth, WrongAppDialog, NoGroupDialog } from '@/features/auth'
import { useLanguageSync } from '@/hooks'
import { scriptTypeKeys } from '@/features/workspace/api/script-type/script-type-keys'
import { apiClient } from '@/lib/axios'
import type { ScriptStyle } from '@/types'

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
  const { currentUser, wrongAppUrl, hasNoGroup } = useAuth()

  if (wrongAppUrl !== null) {
    return <WrongAppDialog url={wrongAppUrl} />
  }

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
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard />
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
