import { AlertTriangle, ArrowRight } from 'lucide-react'
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

interface WrongAppDialogProps {
  url: string
}

export function WrongAppDialog({ url }: WrongAppDialogProps) {
  const { logout } = useAuth()

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="[&>button]:hidden max-w-md border-destructive/20"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Incorrect Application
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            You cannot log in here. Your account is assigned to a different application.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 rounded-lg bg-muted text-center">
          <p className="text-sm font-medium">Please go to the correct tool:</p>
          <a
            href={url}
            className="mt-2 text-primary hover:underline font-medium break-all flex items-center justify-center"
          >
            {url}
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={() => {
              logout()
              window.location.href = url
            }}
            className="w-full sm:w-auto"
          >
            Go to Correct Tool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
