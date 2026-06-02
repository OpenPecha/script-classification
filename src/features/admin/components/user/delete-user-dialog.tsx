import { useEffect } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDeleteUser } from '../../api/user'
import type { User } from '@/types'

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
}: DeleteUserDialogProps) {
  const deleteUser = useDeleteUser()

  const isDeleting = deleteUser.isPending
  const serverError = deleteUser.error as any
  const errorMessage = serverError?.response?.data?.detail || 
                       serverError?.response?.data?.error || 
                       serverError?.response?.data?.message || 
                       serverError?.message

  // Reset mutation state when dialog is closed
  useEffect(() => {
    if (!open) {
      deleteUser.reset()
    }
  }, [open, deleteUser])

  const handleDelete = async () => {
    if (!user || !user.id) return

    try {
      await deleteUser.mutateAsync(user.id)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete User
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{user.username || user.email}</strong>? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

