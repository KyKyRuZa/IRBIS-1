import { z } from 'zod';

const emptyToUndefined = (v) => (v === '' || v === null ? undefined : v);

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const LoginSchema = z.object({
  username: z.string().min(1, 'Введите логин'),
  password: z.string().min(1, 'Введите пароль'),
});

export const ChangePasswordSchema = z.object({
  old_password: z.string().min(1, 'Введите старый пароль'),
  new_password: z.string().regex(PASSWORD_REGEX, 'Пароль должен содержать минимум 8 символов, заглавную и строчную буквы, цифру и спецсимвол'),
});

export const EmployeeSchema = z.object({
  full_name: z.string().min(1, 'Введите ФИО'),
  position: z.string().min(1, 'Введите должность'),
  site_id: z.preprocess(emptyToUndefined, z.union([z.string(), z.number()]).nullable().optional()),
  gender: z.preprocess(emptyToUndefined, z.enum(['male', 'female', 'other'], { error: (issue) => (issue.input === undefined || issue.input === '' ? 'Выберите пол' : 'Выберите пол из списка') }).nullable().optional()),
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
  employee_id: z.preprocess(toNum, z.number().int().positive('Некорректный сотрудник')),
  item_type_id: z.preprocess(toNum, z.number().int().positive('Некорректная позиция')),
  quantity: z.preprocess(toNum, z.number().int().positive('Количество должно быть целым и больше 0')).optional(),
  issue_date: z.string().optional().nullable(),
  certificate_id: z.preprocess(toNum, z.number().int().positive('Некорректный сертификат')).optional().nullable(),
  wear_time_override: z.preprocess(toNum, z.number().positive('Срок носки должен быть больше 0')).optional().nullable(),
  signature_path: z.string().optional().nullable(),
  signature_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z.preprocess(emptyToUndefined, z.enum(['personal', 'dosator'], { error: (issue) => (issue.input === undefined || issue.input === '' ? 'Выберите способ выдачи' : 'Выберите способ выдачи из списка') }).nullable().optional()),
});

export const IssueBatchSchema = z.object({
  site_id: z.preprocess(toNum, z.number().int().positive('Некорректный объект')),
  item_type_id: z.preprocess(toNum, z.number().int().positive('Некорректная позиция')),
  quantity: z.preprocess(toNum, z.number().int().positive('Количество должно быть целым и больше 0')).optional(),
  issue_date: z.string().optional().nullable(),
  certificate_id: z.preprocess(toNum, z.number().int().positive('Некорректный сертификат')).optional().nullable(),
  wear_time_override: z.preprocess(toNum, z.number().positive('Срок носки должен быть больше 0')).optional().nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z.preprocess(emptyToUndefined, z.enum(['personal', 'dosator'], { error: (issue) => (issue.input === undefined || issue.input === '' ? 'Выберите способ выдачи' : 'Выберите способ выдачи из списка') }).nullable().optional()),
});

const IssueBatchSingleItemSchema = z.object({
  item_type_id: z.preprocess(toNum, z.number().int().positive('Некорректная позиция')),
  quantity: z.preprocess(toNum, z.number().int().positive('Количество должно быть целым и больше 0')).optional(),
  certificate_id: z.preprocess(toNum, z.number().int().positive('Некорректный сертификат')).optional().nullable(),
  wear_time_override: z.preprocess(toNum, z.number().positive('Срок носки должен быть больше 0')).optional().nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z.preprocess(emptyToUndefined, z.enum(['personal', 'dosator'], { error: (issue) => (issue.input === undefined || issue.input === '' ? 'Выберите способ выдачи' : 'Выберите способ выдачи из списка') }).nullable().optional()),
});

export const IssueBatchSingleSchema = z.object({
  employee_id: z.preprocess(toNum, z.number().int().positive('Некорректный сотрудник')),
  issue_date: z.string().optional().nullable(),
  items: z.array(IssueBatchSingleItemSchema).min(1, 'Добавьте хотя бы одну позицию'),
});

export const CertificateSchema = z.object({
  product_name: z.string().min(1, 'Введите наименование продукции'),
  certificate_number: z.string().optional().nullable(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  file_path: z.string().optional().nullable(),
  item_type_id: z.preprocess(toNum, z.number().int().positive('Некорректная позиция')).optional().nullable(),
});

export const SiteSchema = z.object({
  name: z.string().min(1, 'Введите название объекта'),
  responsible_person: z.string().optional().nullable(),
});

export const ItemTypeSchema = z.object({
  name: z.string().min(1, 'Введите наименование'),
  category: z.string().min(1, 'Выберите категорию'),
  unit: z.string().optional().nullable(),
  default_wear_time: z.preprocess(toNum, z.number().positive('Срок годности должен быть больше 0')).optional().nullable(),
  seasonality: z.string().optional().nullable(),
  requires_certificate: z.preprocess(toBool, z.boolean()).optional(),
});

export const FormSchema = z.object({
  name: z.string().min(1, 'Введите название формы'),
  description: z.string().optional().nullable(),
});

export const FormUpdateSchema = z.object({
  name: z.string().min(1, 'Введите название формы').optional(),
  description: z.string().optional().nullable(),
});

export const FormTakeSchema = z.object({
  employee_id: z.preprocess(toNum, z.number().int().positive('Некорректный сотрудник')),
  form_id: z.preprocess(toNum, z.number().int().positive('Некорректная форма')),
});

export const IssueNormSchema = z.object({
  item_type_id: z.preprocess(toNum, z.number().int().positive('Некорректная позиция')),
  period_months: z.preprocess(toNum, z.number().positive('Периодичность должна быть больше 0')),
  quantity: z.preprocess(toNum, z.number().int().positive('Количество должно быть целым и больше 0')).optional(),
  gender: z.preprocess(emptyToUndefined, z.enum(['male', 'female', 'other'], { error: (issue) => (issue.input === undefined || issue.input === '' ? 'Выберите пол' : 'Выберите пол из списка') }).nullable().optional()),
  position: z.string().optional().nullable(),
  site_id: z.preprocess(toNum, z.number().int().positive('Некорректный объект')).optional().nullable(),
  seasonality: z.string().optional().nullable(),
  etn_point: z.string().optional().nullable(),
  period_text: z.string().optional().nullable(),
});

export const EmployeeUpdateSchema = EmployeeSchema.partial().extend({
  status: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
});

export const SiteUpdateSchema = SiteSchema.partial();

export const ItemTypeUpdateSchema = z.object({
  name: z.string().min(1, 'Введите наименование').optional(),
  category: z.string().min(1, 'Выберите категорию').optional(),
  unit: z.string().optional().nullable(),
  default_wear_time: z.preprocess(toNum, z.number().positive('Срок годности должен быть больше 0')).optional().nullable(),
  seasonality: z.string().optional().nullable(),
  requires_certificate: z.preprocess(toBool, z.boolean()).optional(),
});

export const IssueNormUpdateSchema = IssueNormSchema.partial();

export const IssueRecordUpdateSchema = z.object({
  employee_id: z.preprocess(toNum, z.number().int().positive('Некорректный сотрудник')).optional(),
  item_type_id: z.preprocess(toNum, z.number().int().positive('Некорректная позиция')).optional(),
  quantity: z.preprocess(toNum, z.number().int().positive('Количество должно быть целым и больше 0')).optional(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  certificate_id: z.preprocess(toNum, z.number().int().positive('Некорректный сертификат')).optional().nullable(),
  wear_time_override: z.preprocess(toNum, z.number().positive('Срок носки должен быть больше 0')).optional().nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z.preprocess(emptyToUndefined, z.enum(['personal', 'dosator'], { error: (issue) => (issue.input === undefined || issue.input === '' ? 'Выберите способ выдачи' : 'Выберите способ выдачи из списка') }).nullable().optional()),
  status: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
});

export const CertificateUpdateSchema = CertificateSchema.partial();

export const IssueReturnSchema = z.object({
  return_date: z.string().optional().nullable(),
  return_quantity: z.preprocess(toNum, z.number().int().nonnegative('Количество возврата должно быть целым и не меньше 0')).optional(),
});
