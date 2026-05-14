import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout, MainLayout } from '@/components/layout'
import { ProtectedRoute } from './protected-route'
import { UserRole } from '@/types'

// Lazy loaded pages
const LoginPage = lazy(() => import('@/pages/auth/login-page').then(m => ({ default: m.LoginPage })))
const CallbackPage = lazy(() => import('@/pages/auth/callback-page').then(m => ({ default: m.CallbackPage })))
const PendingApprovalPage = lazy(() => import('@/pages/auth/pending-approval-page').then(m => ({ default: m.PendingApprovalPage })))
const DashboardPage = lazy(() => import('@/pages/dashboard/dashboard-page').then(m => ({ default: m.DashboardPage })))
const AdminUsersPage = lazy(() => import('@/pages/admin/admin-users-page').then(m => ({ default: m.AdminUsersPage })))
const AdminGroupsPage = lazy(() => import('@/pages/admin/admin-groups-page').then(m => ({ default: m.AdminGroupsPage })))
const AdminBatchesPage = lazy(() => import('@/pages/admin/admin-batches-page').then(m => ({ default: m.AdminBatchesPage })))
const AdminUserContributionsPage = lazy(() =>
  import('@/pages/admin/admin-user-contributions-page').then(m => ({ default: m.AdminUserContributionsPage }))
)
const AdminBatchTasksPage = lazy(() => import('@/pages/admin/admin-batch-tasks-page').then(m => ({ default: m.AdminBatchTasksPage })))
const WorkspacePage = lazy(() => import('@/pages/workspace/workspace-page').then(m => ({ default: m.WorkspacePage })))
const NotFoundPage = lazy(() => import('@/pages/not-found').then(m => ({ default: m.NotFoundPage })))

import { ErrorBoundary } from '@/components/error-boundary'

const fallback = <></>

export const router = createBrowserRouter([
  {
    errorElement: <ErrorBoundary />,
    children: [
      // Auth routes (public)
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <Suspense fallback={fallback}><LoginPage /></Suspense>,
          },
          {
            path: '/callback',
            element: <Suspense fallback={fallback}><CallbackPage /></Suspense>,
          },
          {
            path: '/pending-approval',
            element: <Suspense fallback={fallback}><PendingApprovalPage /></Suspense>,
          },
        ],
      },
      // Protected routes
      {
        element: (
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: '/',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/dashboard',
            element: <Suspense fallback={fallback}><DashboardPage /></Suspense>,
          },
          {
            path: '/admin/users',
            element: (
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <Suspense fallback={fallback}><AdminUsersPage /></Suspense>
              </ProtectedRoute>
            )
          },
          {
            path: '/admin/groups',
            element: (
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <Suspense fallback={fallback}><AdminGroupsPage /></Suspense>
              </ProtectedRoute>
            ),
          },
          {
            path: '/admin/batches',
            element: (
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <Suspense fallback={fallback}><AdminBatchesPage /></Suspense>
              </ProtectedRoute>
            ),
          },
          {
            path: '/admin/batches/user-contributions',
            element: <Navigate to="/admin/user-contributions" replace />,
          },
          {
            path: '/admin/user-contributions',
            element: (
              <ProtectedRoute
                allowedRoles={[
                  UserRole.Admin,
                  UserRole.Annotator,
                  UserRole.Reviewer,
                  UserRole.FinalReviewer,
                ]}
              >
                <Suspense fallback={fallback}><AdminUserContributionsPage /></Suspense>
              </ProtectedRoute>
            ),
          },
          {
            path: '/admin/batch/:batchId',
            element: (
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <Suspense fallback={fallback}><AdminBatchTasksPage /></Suspense>
              </ProtectedRoute>
            ),
          },
          {
            path: '/settings',
            element: (
              <div className="flex items-center justify-center h-[50vh]">
                <p className="text-muted-foreground">Settings page coming soon...</p>
              </div>
            ),
          },
        ],
      },

      // Workspace route (has its own layout)
      {
        path: '/workspace',
        element: (
          <ProtectedRoute allowedRoles={[UserRole.Annotator, UserRole.Reviewer, UserRole.FinalReviewer]}>
            <Suspense fallback={fallback}><WorkspacePage /></Suspense>
          </ProtectedRoute>
        ),
      },

      // 404
      {
        path: '*',
        element: <Suspense fallback={fallback}><NotFoundPage /></Suspense>,
      },
    ],
  },
])
