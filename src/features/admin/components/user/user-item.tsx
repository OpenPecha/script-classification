import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Trash2, Mail, BarChart3, UserCheck, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { UserRole, ROLE_CONFIG, type User, type Group } from '@/types'
import { useUpdateUser, useReactivateUser } from '../../api/user'
import { useUIStore } from '@/store/use-ui-store'
import { UserDialog } from './user-dialog'
import { DeleteUserDialog } from './delete-user-dialog'
import { UserReportDialog } from './user-report-dialog'
import { getInitials } from '@/lib/utils'

interface UserItemProps {
  user: User
  groups: Group[]
}

export function UserItem({ user, groups }: UserItemProps) {
  const { t } = useTranslation('admin')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const updateUser = useUpdateUser()
  const reactivateUser = useReactivateUser()
  const { addToast } = useUIStore()

  const handleRoleChange = async (newRole: string) => {
    if (newRole === user.role) return
    try {
      await updateUser.mutateAsync({
        id: user.id!,
        data: { new_role: newRole as UserRole },
      })
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  const handleGroupChange = async (new_group_id: string) => {
    if (new_group_id === user.group_id) return
    try {
      await updateUser.mutateAsync({
        id: user.id!,
        data: { new_group_id: new_group_id },
      })
    } catch (error) {
      console.error('Failed to update group:', error)
    }
  }

  const handleReactivate = async () => {
    if (!user.email) return

    try {
      await reactivateUser.mutateAsync({
        username: user.username,
        email: user.email,
        role: user.role,
        group_id: user.group_id,
      })
      addToast({
        title: 'User Reactivated',
        description: `Successfully reactivated ${user.username || user.email}`,
        variant: 'success',
      })
    } catch (error: any) {
      const serverMessage = error?.response?.data?.detail || 
                            error?.response?.data?.error || 
                            error?.response?.data?.message
      const message = serverMessage || error?.message || 'Unknown error'
      addToast({
        title: 'Reactivation Failed',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const isActionPending = updateUser.isPending || reactivateUser.isPending

  return (
    <>
      <div className={`grid grid-cols-[1fr_150px_150px_120px] gap-4 items-center p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0 ${user.active === false ? 'opacity-70 bg-muted/20' : ''}`}>
        {/* Name & Email */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user.picture} alt={user.username} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(user.username ?? 'No Name')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{user.username}</p>
              {user.active === false && (
                <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px] py-0 px-1.5 font-normal">
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
        </div>

        {/* Role Select */}
        <Select
          value={user.role}
          onValueChange={handleRoleChange}
          disabled={isActionPending || user.active === false}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(UserRole).map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_CONFIG[role].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Group Select */}
        <Select
          value={user.group_id || ''}
          onValueChange={handleGroupChange}
          disabled={isActionPending || user.active === false}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="-" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setReportDialogOpen(true)}
            title={t('users.viewReport')}
            disabled={isActionPending}
          >
            <BarChart3 className="h-4 w-4 text-amber-600" />
            <span className="sr-only">{t('users.viewReport')}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditDialogOpen(true)}
            disabled={isActionPending || user.active === false}
          >
            <Edit className="h-4 w-4 text-primary" />
            <span className="sr-only">Edit user</span>
          </Button>
          {user.active !== false ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isActionPending}
              title="Delete user"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete user</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50"
              onClick={handleReactivate}
              disabled={isActionPending}
              title="Reactivate user"
            >
              {reactivateUser.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
              <span className="sr-only">Reactivate user</span>
            </Button>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <UserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={user}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={user}
      />

      {/* Report Dialog */}
      <UserReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        user={user}
      />
    </>
  )
}

export function UserItemSkeleton() {
  return (
    <div className="grid grid-cols-[1fr,150px,150px,120px] gap-4 items-center p-4 border-b border-border">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-md" />
      <Skeleton className="h-8 w-full rounded-md" />
      <div className="flex justify-end gap-1">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  )
}

