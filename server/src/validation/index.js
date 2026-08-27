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

const toNum = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));
const toBool = (v) => (v === undefined ? undefined : v === true || v === 'true' || v === '1');

export const IssueRecordSchema = z.object({
  employee_id: z.preprocess(toNum, z.number().int().positive('employee_id must be a positive integer')),
  item_type_id: z.preprocess(toNum, z.number().int().positive('item_type_id must be a positive integer')),
  quantity: z.preprocess(toNum, z.number().int().positive()).optional(),
  issue_date: z.string().optional().nullable(),
  certificate_id: z.preprocess(toNum, z.number().int().positive()).optional().nullable(),
  wear_time_override: z.preprocess(toNum, z.number().positive()).optional().nullable(),
  signature_path: z.string().optional().nullable(),
  signature_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const IssueBatchSchema = z.object({
  site_id: z.preprocess(toNum, z.number().int().positive('site_id must be a positive integer')),
  item_type_id: z.preprocess(toNum, z.number().int().positive('item_type_id must be a positive integer')),
  quantity: z.preprocess(toNum, z.number().int().positive()).optional(),
  issue_date: z.string().optional().nullable(),
  certificate_id: z.preprocess(toNum, z.number().int().positive()).optional().nullable(),
  wear_time_override: z.preprocess(toNum, z.number().positive()).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const CertificateSchema = z.object({
  product_name: z.string().min(1, 'product_name is required'),
  certificate_number: z.string().optional().nullable(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  file_path: z.string().optional().nullable(),
  item_type_id: z.preprocess(toNum, z.number().int().positive()).optional().nullable(),
});

export const SiteSchema = z.object({
  name: z.string().min(1, 'name is required'),
  responsible_person: z.string().optional().nullable(),
});

export const ItemTypeSchema = z.object({
  name: z.string().min(1, 'name is required'),
  category: z.string().min(1, 'category is required'),
  unit: z.string().optional().nullable(),
  default_wear_time: z.preprocess(toNum, z.number().positive()).optional().nullable(),
  seasonality: z.string().optional().nullable(),
  requires_certificate: z.preprocess(toBool, z.boolean()).optional(),
});

export const FormSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional().nullable(),
});

export const FormTakeSchema = z.object({
  employee_id: z.preprocess(toNum, z.number().int().positive('employee_id must be a positive integer')),
  form_id: z.preprocess(toNum, z.number().int().positive('form_id must be a positive integer')),
});

export const IssueNormSchema = z.object({
  item_type_id: z.preprocess(toNum, z.number().int().positive('item_type_id must be a positive integer')),
  period_months: z.preprocess(toNum, z.number().positive('period_months must be positive')),
  quantity: z.preprocess(toNum, z.number().int().positive()).optional(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  position: z.string().optional().nullable(),
  site_id: z.preprocess(toNum, z.number().int().positive()).optional().nullable(),
  seasonality: z.string().optional().nullable(),
  etn_point: z.string().optional().nullable(),
  period_text: z.string().optional().nullable(),
});

export const EmployeeUpdateSchema = EmployeeSchema.partial().extend({
  status: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
});

export const SiteUpdateSchema = SiteSchema.partial();

export const ItemTypeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  unit: z.string().optional().nullable(),
  default_wear_time: z.preprocess(toNum, z.number().positive()).optional().nullable(),
  seasonality: z.string().optional().nullable(),
  requires_certificate: z.preprocess(toBool, z.boolean()).optional(),
});

export const IssueNormUpdateSchema = IssueNormSchema.partial();

export const IssueRecordUpdateSchema = z.object({
  employee_id: z.preprocess(toNum, z.number().int().positive()).optional(),
  item_type_id: z.preprocess(toNum, z.number().int().positive()).optional(),
  quantity: z.preprocess(toNum, z.number().int().positive()).optional(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  certificate_id: z.preprocess(toNum, z.number().int().positive()).optional().nullable(),
  wear_time_override: z.preprocess(toNum, z.number().positive()).optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
});

export const CertificateUpdateSchema = CertificateSchema.partial();

export const IssueReturnSchema = z.object({
  return_date: z.string().optional().nullable(),
  return_quantity: z.preprocess(toNum, z.number().int().nonnegative()).optional(),
});
