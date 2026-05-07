import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useUIStore } from '@/store/use-ui-store'
import { useAuth } from '@/features/auth'
import { useGetBatchTasks, useRestoreTask, useRejectTask, useVerifyTask, useUnverifyTask, useGetBatchReport, useGetBatchUsers } from '../../../api/batch'
import { useBatchCsvDownload } from '../../../hooks/use-batch-csv-download'
import { TaskListSidebar } from './task-list-sidebar'
import { TaskPreview } from './task-preview'
import { BATCH_STATS_CONFIG, type BatchTask, type BatchTaskState } from '@/types'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Filter, User } from 'lucide-react'

const STATE_OPTION_KEYS: Array<{ value: BatchTaskState | 'all'; key: string }> = [
  { value: 'all', key: 'batches.states.all' },
  { value: 'pending', key: 'batches.states.pending' },
  { value: 'half_annotated', key: 'batches.states.half_annotated' },
  { value: 'annotated', key: 'batches.states.annotated' },
  { value: 'accepted', key: 'batches.states.accepted' },
  { value: 'trashed', key: 'batches.states.trashed' },
]

const VERIFICATION_OPTION_KEYS: Array<{ value: 'all' | 'verified' | 'unverified'; key: string }> = [
  { value: 'all', key: 'batches.verificationStates.all' },
  { value: 'verified', key: 'batches.verificationStates.verified' },
  { value: 'unverified', key: 'batches.verificationStates.unverified' },
]

export function BatchTaskView() {
  const { t } = useTranslation('admin')
  const { batchId } = useParams<{ batchId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const { currentUser } = useAuth()

  // Get state filter from URL, default to 'all'
  const stateFilter = (searchParams.get('state') as BatchTaskState | 'all') || 'all'
  const verificationFilter = (searchParams.get('verification') as 'all' | 'verified' | 'unverified') || 'all'
  const userIdFilter = searchParams.get('user_id') || undefined
  const roleFilter = (searchParams.get('role') as 'annotator' | 'reviewer') || undefined
  const taskIdFromUrl = searchParams.get('task_id')


  // API hooks
  const { data: report, isLoading: isLoadingReport } = useGetBatchReport(batchId!, true)
  const { data: overview, isLoading: isLoadingTasks } = useGetBatchTasks(
    batchId!, 
    stateFilter,
    userIdFilter,
    roleFilter,
    verificationFilter === 'all' ? undefined : (verificationFilter === 'verified')
  )
  const { data: rawBatchUsers = [] } = useGetBatchUsers(batchId!)
  
  const tasks = useMemo(() => {
    const rawTasks = overview?.tasks || []
    const seen = new Set()
    return rawTasks.filter(task => {
      if (seen.has(task.task_id)) return false
      seen.add(task.task_id)
      return true
    })
  }, [overview?.tasks])

  const batchUsers = useMemo(() => {
    const seen = new Set()
    return rawBatchUsers.filter(user => {
      if (seen.has(user.id)) return false
      seen.add(user.id)
      return true
    })
  }, [rawBatchUsers])
  const filterStats = overview?.filter_stats

  const restoreTask = useRestoreTask()
  const rejectTask = useRejectTask()
  const verifyTask = useVerifyTask()
  const unverifyTask = useUnverifyTask()

  // CSV download hook
  const { download: downloadCsv, isDownloading } = useBatchCsvDownload({
    batchId: batchId!,
    onError: (error) => {
      addToast({
        title: t('batches.downloadFailed'),
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Set selected task from URL or first task
  const selectedTask = useMemo(() => {
    if (tasks.length === 0) return null;

    if (taskIdFromUrl) {
      const taskFromUrl = tasks.find((t) => t.task_id === taskIdFromUrl);
      if (taskFromUrl) return taskFromUrl;
    }

    return tasks[0];
  }, [tasks, taskIdFromUrl]);

  // Update URL when task is selected
  const handleSelectTask = useCallback(
    (task: BatchTask) => {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.set('task_id', task.task_id)
      setSearchParams(newSearchParams)
    },
    [searchParams, setSearchParams]
  )

  // Handle filter changes
  const handleStateChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        prev.set('state', value)
        prev.delete('task_id') // Reset task selection when filter changes
        if (value !== 'accepted') {
          prev.delete('verification')
        }
        return prev
      })
    },
    [setSearchParams]
  )

  const handleVerificationChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        prev.set('verification', value)
        prev.delete('task_id')
        return prev
      })
    },
    [setSearchParams]
  )

  const handleUserFilterChange = useCallback(
    (userId: string | null, role?: 'annotator' | 'reviewer') => {
      setSearchParams((prev) => {
        if (userId) {
          prev.set('user_id', userId)
          if (role) prev.set('role', role)
          // Reset other filters when switching users to show their full overview
          prev.set('state', 'all')
          prev.delete('verification')
        } else {
          prev.delete('user_id')
          prev.delete('role')
        }
        prev.delete('task_id')
        return prev
      })
    },
    [setSearchParams]
  )

  // Helper to format error messages
  const formatErrorMessage = useCallback((error: any, task: BatchTask | null) => {
    // Try to extract the detailed message from the API response
    const serverMessage = error?.response?.data?.error || error?.response?.data?.message;
    const message = serverMessage || error?.message || 'Unknown error';

    if (!task) return message;
    // Replace task ID with task name if present in message
    return message.replace(task.task_id, task.task_name);
  }, []);

  // Handle restore
  const handleRestore = useCallback(() => {
    if (!selectedTask || !batchId) return

    restoreTask.mutate(
      { taskId: selectedTask.task_id, batchId },
      {
        onSuccess: () => {
          addToast({
            title: t('batches.taskRestored'),
            description: t('batches.taskRestoredDescription', { name: selectedTask.task_name }),
            variant: 'success',
          })
        },
        onError: (error: Error) => {
          addToast({
            title: t('batches.restoreFailed'),
            description: formatErrorMessage(error, selectedTask),
            variant: 'destructive',
          })
        },
      }
    )
  }, [selectedTask, batchId, restoreTask, addToast, t, formatErrorMessage])

  const handleReject = useCallback(() => {
    if (!selectedTask || !batchId || !currentUser?.id) return

    rejectTask.mutate(
      { taskId: selectedTask.task_id, batchId, userId: currentUser.id },
      {
        onSuccess: () => {
          addToast({
            title: t('batches.taskRejected'),
            description: t('batches.taskRejectedDescription', { name: selectedTask.task_name }),
            variant: 'success',
          })
        },
        onError: (error: Error) => {
          addToast({
            title: t('batches.rejectFailed'),
            description: formatErrorMessage(error, selectedTask),
            variant: 'destructive',
          })
        },
      }
    )
  }, [selectedTask, batchId, currentUser, rejectTask, addToast, t, formatErrorMessage])

  const handleVerify = useCallback(() => {
    if (!selectedTask || !batchId || !currentUser?.id) return

    verifyTask.mutate(
      { taskId: selectedTask.task_id, batchId, userId: currentUser.id },
      {
        onSuccess: () => {
          addToast({
            title: t('batches.taskVerified'),
            description: t('batches.taskVerifiedDescription', { name: selectedTask.task_name }),
            variant: 'success',
          })
        },
        onError: (error: Error) => {
          addToast({
            title: t('batches.verifyFailed'),
            description: formatErrorMessage(error, selectedTask),
            variant: 'destructive',
          })
        },
      }
    )
  }, [selectedTask, batchId, currentUser, verifyTask, addToast, t, formatErrorMessage])

  const handleUnverify = useCallback(() => {
    if (!selectedTask || !batchId || !currentUser?.id) return

    unverifyTask.mutate(
      { taskId: selectedTask.task_id, batchId, userId: currentUser.id },
      {
        onSuccess: () => {
          addToast({
            title: t('batches.taskUnverified'),
            description: t('batches.taskUnverifiedDescription', { name: selectedTask.task_name }),
            variant: 'success',
          })
        },
        onError: (error: Error) => {
          addToast({
            title: t('batches.unverifyFailed'),
            description: formatErrorMessage(error, selectedTask),
            variant: 'destructive',
          })
        },
      }
    )
  }, [selectedTask, batchId, currentUser, unverifyTask, addToast, t, formatErrorMessage])

  // Get task count for current filter
  const getTaskCount = useCallback(
    (state: BatchTaskState | 'all') => {
      // Use the live filter stats from the overview if available, but only if we have a user/role filter
      // Otherwise use the global report which is more stable (doesn't change when state filter changes)
      const stats = (userIdFilter || roleFilter) ? (filterStats || report) : (report || filterStats)
      if (!stats) return null
      
      if (state === 'all') return stats.total_tasks
      
      return stats[state]
    },
    [report, filterStats, userIdFilter, roleFilter]
  )

  const getVerificationCount = useCallback(
    (val: 'all' | 'verified' | 'unverified') => {
      // Prioritize the overview filter stats as it contains the verified count
      const stats = (userIdFilter || roleFilter) ? (filterStats || report) : (report || filterStats)
      if (!stats) return null
      
      const accepted = stats.accepted || 0
      const verified = stats.verified || 0

      if (val === 'all') return accepted
      if (val === 'verified') return verified
      return Math.max(0, accepted - verified)
    },
    [report, filterStats, userIdFilter, roleFilter]
  )

  const annotators = useMemo(() => batchUsers.filter(u => u.role === 'annotator'), [batchUsers])
  const reviewers = useMemo(() => batchUsers.filter(u => u.role === 'reviewer'), [batchUsers])

  const activeUser = useMemo(() => {
    if (!userIdFilter) return null
    return batchUsers.find(u => u.id === userIdFilter)
  }, [batchUsers, userIdFilter])

  // Filter state options based on role
  const filteredStateOptions = useMemo(() => {
    if (roleFilter === 'reviewer') {
      return STATE_OPTION_KEYS.filter(opt => opt.value === 'accepted' || opt.value === 'all')
    }
    if (roleFilter === 'annotator') {
      return STATE_OPTION_KEYS.filter(opt => 
        opt.value === 'half_annotated' || opt.value === 'annotated' || opt.value === 'all'
      )
    }
    return STATE_OPTION_KEYS
  }, [roleFilter])

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/batches')}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('batches.back')}
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            {isLoadingReport ? (
              <Skeleton className="h-7 w-48" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h1 className="text-xl font-semibold">{report?.name || t('batches.batchTasks')}</h1>
                <span className="text-sm font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  {t('batches.rejections')}: {(userIdFilter || roleFilter ? (filterStats || report) : (report || filterStats))?.total_rejection_count ?? 0}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Task count */}
          <span className="text-sm text-muted-foreground">
            {isLoadingTasks ? (
              <Skeleton className="h-5 w-20 inline-block" />
            ) : (
              t('batches.tasks', { count: tasks.length })
            )}
          </span>

          {/* State filter */}
          <Select value={stateFilter} onValueChange={handleStateChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('batches.filterByState')} />
            </SelectTrigger>
            <SelectContent>
              {filteredStateOptions.map((option) => {
                const count = getTaskCount(option.value)
                const config = option.value !== 'all'
                  ? BATCH_STATS_CONFIG[option.value]
                  : null
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span>{t(option.key)}</span>
                      {count !== null && (
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            config?.color || 'bg-muted text-muted-foreground'
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {/* Verification filter - only shown when state is 'accepted' */}
          {stateFilter === 'accepted' && (
            <Select value={verificationFilter} onValueChange={handleVerificationChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('batches.filterByVerification')} />
              </SelectTrigger>
              <SelectContent>
                {VERIFICATION_OPTION_KEYS.map((opt) => {
                  const count = getVerificationCount(opt.value)
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span>{t(opt.key)}</span>
                        {count !== null && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {count}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )}

          {/* User Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "gap-2 h-9 min-w-[140px] justify-start px-3",
                  userIdFilter && "border-primary/50 bg-primary/5"
                )}
              >
                <Filter className={cn("h-4 w-4", userIdFilter ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate max-w-[100px]">
                  {activeUser?.username || t('batches.filterByUser')}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleUserFilterChange(null)}>
                <Filter className="h-4 w-4 mr-2 opacity-50" />
                {t('batches.allUsers')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {/* Annotators Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <User className="h-4 w-4 mr-2 opacity-50" />
                  <span>{t('batches.roles.annotator')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                    {annotators.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                        No annotators
                      </div>
                    ) : (
                      annotators.map((user) => (
                        <DropdownMenuItem 
                          key={user.id}
                          onClick={() => handleUserFilterChange(user.id, 'annotator')}
                          className={cn(userIdFilter === user.id && "bg-accent")}
                        >
                          {user.username}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* Reviewers Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <User className="h-4 w-4 mr-2 opacity-50" />
                  <span>{t('batches.roles.reviewer')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                    {reviewers.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                        No reviewers
                      </div>
                    ) : (
                      reviewers.map((user) => (
                        <DropdownMenuItem 
                          key={user.id}
                          onClick={() => handleUserFilterChange(user.id, 'reviewer')}
                          className={cn(userIdFilter === user.id && "bg-accent")}
                        >
                          {user.username}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Download CSV */}
          <Button
            variant="outline"
            size="icon"
            onClick={downloadCsv}
            disabled={isDownloading || isLoadingReport}
            className="h-9 w-9"
            title={t('batches.downloadCsv')}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex border border-border rounded-lg overflow-hidden bg-background">
        {/* Task List Sidebar */}
        <div className="w-64 shrink-0">
          <TaskListSidebar
            key={`${stateFilter}-${verificationFilter}-${userIdFilter}-${roleFilter}-${batchId}`}
            tasks={tasks}
            selectedTaskId={selectedTask?.task_id || null}
            onSelectTask={handleSelectTask}
            isLoading={isLoadingTasks}
          />
        </div>

        {/* Task Preview */}
        <div className="flex-1 min-w-0">
          <TaskPreview
            task={selectedTask}
            onRestore={handleRestore}
            isRestoring={restoreTask.isPending}
            onReject={handleReject}
            isRejecting={rejectTask.isPending}
            onVerify={handleVerify}
            isVerifying={verifyTask.isPending}
            onUnverify={handleUnverify}
            isUnverifying={unverifyTask.isPending}
            isLoading={isLoadingTasks && !selectedTask}
          />
        </div>
      </div>
    </div>
  )
}

