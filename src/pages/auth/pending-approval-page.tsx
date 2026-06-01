import { useTranslation } from 'react-i18next'
import { RefreshCw, Clock, LogOut } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Navigate } from 'react-router-dom'

export function PendingApprovalPage() {
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation('common')
  const { currentUser, logout, isPendingApproval } = useAuth()

  const handleRefresh = () => {
    window.location.reload()
  }

  if(currentUser?.role){
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 p-4 mb-4">
            <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isPendingApproval ? t('pending.title') : 'Role Not Assigned'}
          </h1>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {isPendingApproval
              ? 'Your account is pending approval. Please wait for an administrator to create your account.'
              : "Role is not assigned so you won't be able to receive tasks."}
          </p>

          {currentUser && (
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <div className="text-sm">
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">{tCommon('form.email')}: </span>
                <span className="font-medium">{currentUser.email}</span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button onClick={handleRefresh} className="w-full" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('pending.checkAgain')}
          </Button>
          <Button 
            onClick={logout} 
            variant="outline" 
            className="w-full"
            size="lg"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {tCommon('actions.signOut')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

