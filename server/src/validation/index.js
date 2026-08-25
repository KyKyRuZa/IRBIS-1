import { z } from 'zod';

const emptyToUndefined = (v) => (v === '' || v === null ? undefined : v);

export const LoginSchema = z.object({
  username: z.string().min(1, 'username is required'),
  password: z.string().min(1, 'password is required'),
});

export const RegisterSchema = z.object({
  username: z.string().min(1, 'username is required'),
  password: z.string().min(1, 'password is required'),
  role: z.enum(['admin', 'user']).optional(),
});

export const ChangePasswordSchema = z.object({
  old_password: z.string().min(1, 'old_password is required'),
  new_password: z.string().min(1, 'new_password is required'),
});

export const EmployeeSchema = z.object({
  full_name: z.string().min(1, 'full_name is required'),
  position: z.string().min(1, 'position is required'),
  site_id: z.preprocess(emptyToUndefined, z.union([z.string(), z.number()]).nullable().optional()),
  gender: z.preprocess(emptyToUndefined, z.enum(['male', 'female', 'other']).nullable().optional()),
  hire_date: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  clothing_size: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  shoe_size: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  height: z.preprocess(emptyToUndefined, z.union([z.string(), z.number()]).nullable().optional()),
  personnel_number: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  hat_size: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  respirator_size: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  gloves_size: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  position_change_date: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
});
