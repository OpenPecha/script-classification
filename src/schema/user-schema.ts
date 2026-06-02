import z from 'zod'
import { UserRole } from '@/types'

export const userSchema = z.object({
  username: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  role: z
    .union([z.nativeEnum(UserRole), z.literal('none'), z.literal(''), z.null()])
    .optional(),
  group_id: z
    .string()
    .optional(),
})

export type UserFormData = z.infer<typeof userSchema>

