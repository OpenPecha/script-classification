import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserForm } from './user-form'
import { useCreateUser, useUpdateUser } from '../../api/user'
import { useGetGroups } from '../../api/group'
import { UserRole, type CreateUserDTO, type User } from '@/types'
import type { UserFormData } from '@/schema/user-schema'

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const { t } = useTranslation('admin')
  const { t: tCommon } = useTranslation('common')
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const { data: groups = [] } = useGetGroups()

  const isEditing = !!user
  const isSubmitting = createUser.isPending || updateUser.isPending

  const handleSubmit = async (data: UserFormData) => {
    try {
      if (isEditing && user) {
        const mappedRole = data.role === 'none' ? null : (data.role as UserRole)
        const mappedGroupId = data.group_id === 'none' ? null : data.group_id

        await updateUser.mutateAsync({
          id: user.id!,
          data: {
            new_username: data.username,
            new_email: data.email,
            new_role: mappedRole,
            new_group_id: mappedGroupId,
          },
        })
      } else {
        // Only include properties in the request if they exist in data
        // Always include email (required), optionally other fields
        const payload: CreateUserDTO = {
          email: data.email,
        }
        if (data.username) payload.username = data.username
        if (data.role && data.role !== 'none') payload.role = data.role as UserRole
        if (data.group_id && data.group_id !== 'none') payload.group_id = data.group_id
        await createUser.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save user:', error)
    }
  }

  const defaultValues: Partial<UserFormData> | undefined = user
    ? {
        username: user.username,
        email: user.email,
        role: user.role || ('none' as any),
        group_id: user.group_id || 'none',
      }
    : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('users.editUser') : t('users.addUser').replace('+ ', '')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('users.updateUserDetails') : t('users.addUserDetails')}
          </DialogDescription>
        </DialogHeader>

        <UserForm
          key={user?.username ?? ""}
          defaultValues={defaultValues}
          groups={groups}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel={isEditing ? tCommon('actions.update') : `+ ${tCommon('actions.create')}`}
        />
      </DialogContent>
    </Dialog>
  )
}

