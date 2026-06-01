import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageCanvas } from '../image-canvas'
import { WorkspaceSidebar } from '../workspace-sidebar'
import { TrashConfirmationDialog } from '../trash-confirmation-dialog'
import { EmptyTasksState } from '../empty-tasks-state'
import { ScriptLabelGrid } from './script-label-grid'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth'
import { useUIStore } from '@/store/use-ui-store'
import {
  useGetClassificationTask,
  useSubmitClassification,
} from '../../api/classification'
import type { ScriptType, ReviewerChoice } from '@/types'

const GUIDE_URL = 'https://docs.google.com/document/d/1sOvikJdn4TwEfZMo67gQ7KNZsD6MSLtdbFoH1XMHV2Y/edit?tab=t.0'

export function ClassificationWorkspace() {
  const { t } = useTranslation('workspace')
  const { currentUser } = useAuth()
  const { addToast } = useUIStore()

  const [trashDialogOpen, setTrashDialogOpen] = useState(false)

  const {
    data: task,
    isLoading,
    isFetching,
    refetch,
  } = useGetClassificationTask(currentUser?.id)

  const submitMutation = useSubmitClassification(currentUser?.id)

  const isTransitioning = submitMutation.isPending || (isFetching && !isLoading)

  const handleSelect = useCallback(
    (scriptType: ScriptType) => {
      if (!task || !currentUser?.id) return

      const isReviewer = task.state === 'reviewing'

      if (isReviewer) {
        let choice: ReviewerChoice
        let selectedScriptType: ScriptType | undefined

        if (
          task.classification_a === scriptType &&
          task.classification_b === scriptType
        ) {
          choice = 'a'
        } else if (task.classification_a === scriptType) {
          choice = 'a'
        } else if (task.classification_b === scriptType) {
          choice = 'b'
        } else {
          choice = 'own'
          selectedScriptType = scriptType
        }

        submitMutation.mutate(
          {
            task_id: task.task_id,
            user_id: currentUser.id!,
            submit: true,
            choice,
            ...(selectedScriptType && { script_type: selectedScriptType }),
          },
          {
            onSuccess: () => {
              addToast({
                title: t('toast.submitted'),
                description: t('classification.toast.reviewSubmitted'),
                variant: 'success',
              })
            },
            onError: (error: Error) => {
              addToast({
                title: t('toast.submitFailed'),
                description: error.message,
                variant: 'destructive',
              })
            },
          },
        )
      } else {
        submitMutation.mutate(
          {
            task_id: task.task_id,
            user_id: currentUser.id!,
            submit: true,
            script_type: scriptType,
          },
          {
            onSuccess: () => {
              addToast({
                title: t('toast.submitted'),
                description: t('classification.toast.classificationSubmitted'),
                variant: 'success',
              })
            },
            onError: (error: Error) => {
              addToast({
                title: t('toast.submitFailed'),
                description: error.message,
                variant: 'destructive',
              })
            },
          },
        )
      }
    },
    [task, currentUser, submitMutation, addToast, t],
  )

  const handleTrash = useCallback(() => {
    if (!task || !currentUser?.id) return

    submitMutation.mutate(
      {
        task_id: task.task_id,
        user_id: currentUser.id!,
        submit: false,
      },
      {
        onSuccess: () => {
          setTrashDialogOpen(false)
          addToast({
            title: t('toast.trashed'),
            variant: 'default',
          })
        },
        onError: (error: Error) => {
          addToast({
            title: t('toast.trashFailed'),
            description: error.message,
            variant: 'destructive',
          })
        },
      },
    )
  }, [task, currentUser, submitMutation, addToast, t])

  const isAnnotator = task?.state === 'annotating' || task?.state === 'annotating_b'

  const openGuide = useCallback(
    () => window.open(GUIDE_URL, '_blank', 'noopener,noreferrer'),
    [],
  )

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <WorkspaceSidebar
          task={null}
          onRefresh={() => refetch()}
          isLoading={true}
          onOpenGuide={openGuide}
        />
        <main className="ml-60 flex flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center">
            <Skeleton className="m-4 h-full w-full rounded-lg" />
          </div>
        </main>
      </div>
    )
  }

  if (!task) {
    const noApplicationMessage = !currentUser?.application
      ? 'You have no application assigned. Please contact your administrator.'
      : undefined

    return (
      <div className="flex h-screen">
        <WorkspaceSidebar
          task={null}
          onRefresh={() => refetch()}
          isLoading={isLoading || isFetching}
          onOpenGuide={openGuide}
        />
        <main className="ml-60 flex-1">
          <EmptyTasksState
            onRefresh={() => refetch()}
            isLoading={isLoading}
            message={noApplicationMessage}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <WorkspaceSidebar
        task={null}
        classificationTask={task}
        onRefresh={() => refetch()}
        isLoading={isFetching}
        onOpenGuide={openGuide}
      />

      <main className="ml-60 flex flex-1 flex-col">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ImageCanvas imageUrl={task.task_url} />
          </div>

          <ScriptLabelGrid
            task={task}
            disabled={isTransitioning}
            onSelect={handleSelect}
            onTrash={isAnnotator ? () => setTrashDialogOpen(true) : undefined}
            onOpenGuide={openGuide}
          />
        </div>
      </main>

      <TrashConfirmationDialog
        open={trashDialogOpen}
        onOpenChange={setTrashDialogOpen}
        onConfirm={handleTrash}
        onCancel={() => setTrashDialogOpen(false)}
        isLoading={submitMutation.isPending}
        taskName={task.task_name}
      />
    </div>
  )
}
