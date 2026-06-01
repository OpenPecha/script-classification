import { Users, LogOut } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from './use-auth'

export function NoGroupDialog() {
  const { logout } = useAuth()

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="[&>button]:hidden max-w-md border-warning/20"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 mb-3">
            <Users className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Group Not Assigned
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Group is not assigned so you won't be able to receive tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-center">
          <p className="text-sm text-muted-foreground">
            Please notify your administrator to add you to a group.
          </p>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={logout}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
