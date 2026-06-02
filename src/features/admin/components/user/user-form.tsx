import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { userSchema, type UserFormData } from '@/schema/user-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserRole, type Group } from '@/types'
import { getRoleTranslationKey } from '@/lib/utils'

export interface UserFormProps {
  defaultValues?: Partial<UserFormData>
  groups: Group[]
  onSubmit: (data: UserFormData) => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function UserForm({
  defaultValues,
  groups,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Create',
}: UserFormProps) {
  const { t } = useTranslation('common')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: defaultValues?.username ?? '',
      email: defaultValues?.email ?? '',
      role: (defaultValues?.role as any) || 'none',
      group_id: defaultValues?.group_id || 'none',
    },
  })

  const selectedRole = watch('role')
  const selectedGroup = watch('group_id')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        <Label htmlFor="username">{t('form.username')}</Label>
        <Input
          id="username"
          placeholder={t('form.enterUsername')}
          {...register('username')}
          disabled={isSubmitting}
        />
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label htmlFor="email">{t('form.email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('form.enterEmail')}
          {...register('email')}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label htmlFor="role">{t('form.role')}</Label>
        <Select
          value={selectedRole || 'none'}
          onValueChange={(value) => setValue('role', value as UserRole)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="role">
            <SelectValue placeholder={t('form.selectRole')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-</SelectItem>
            {Object.values(UserRole).map((role) => (
              <SelectItem key={role} value={role}>
                {t(`roles.${getRoleTranslationKey(role)}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label htmlFor="group">{t('form.group')}</Label>
        <Select
          value={selectedGroup || 'none'}
          onValueChange={(value) => setValue('group_id', value)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="group">
            <SelectValue placeholder={t('form.selectGroup')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.group_id && (
          <p className="text-sm text-destructive">{errors.group_id.message}</p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

