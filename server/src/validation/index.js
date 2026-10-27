import { z } from 'zod'

z.setErrorMap((issue) => {
  if (issue.code === 'invalid_type') {
    if (issue.expected === 'number') return 'Введите число'
    if (issue.expected === 'string') return 'Введите значение'
    if (issue.expected === 'boolean') return 'Выберите значение'
    if (issue.expected === 'array') return 'Добавьте хотя бы одну позицию'
    return 'Неверный тип данных'
  }
  if (issue.code === 'too_small') {
    if (issue.minimum === 0 && !issue.inclusive) return 'Значение должно быть больше 0'
    if (issue.minimum === 1 && issue.inclusive) return 'Поле обязательно для заполнения'
    if (issue.inclusive) return `Минимум: ${issue.minimum}`
    return `Минимальное значение: ${issue.minimum}`
  }
  if (issue.code === 'too_big') {
    return 'Превышено максимальное значение'
  }
  if (issue.code === 'invalid_enum_value') {
    return 'Выберите значение из списка'
  }
  if (issue.code === 'invalid_literal') {
    return 'Неверное значение'
  }
  if (issue.code === 'custom') {
    return issue.message || 'Неверные данные'
  }
  return 'Неверные данные'
})

const emptyToUndefined = (v) => (v === '' || v === null ? undefined : v)

const toNum = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v))
const toNumNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={};:'"\\|,.<>?]).{8,128}$/

export const LoginSchema = z.object({
  username: z.string().min(1, 'Введите логин'),
  password: z.string().min(1, 'Введите пароль'),
})

export const ChangePasswordSchema = z.object({
  old_password: z.string().min(1, 'Введите старый пароль'),
  new_password: z
    .string()
    .regex(
      PASSWORD_REGEX,
      'Пароль должен содержать минимум 8 символов, максимум 128 символов, заглавную и строчную буквы, цифру и спецсимвол'
    ),
})

export const EmployeeSchema = z.object({
  full_name: z.string().min(1, 'Введите ФИО'),
  position: z.string().min(1, 'Введите должность'),
  site_id: z.preprocess(
    toNumNull,
    z.union([z.number().int('Некорректный объект').positive('Некорректный объект'), z.null()])
  ).optional(),
  gender: z.preprocess(
    emptyToUndefined,
    z
      .enum(['male', 'female', 'other'], {
        error: (issue) =>
          issue.input === undefined || issue.input === ''
            ? 'Выберите пол'
            : 'Выберите пол из списка',
      })
      .nullable()
      .optional()
  ),
  hire_date: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  clothing_size: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  shoe_size: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  height: z.preprocess(
    toNumNull,
    z.union([z.number().int('Рост должен быть целым числом').positive('Рост должен быть положительным'), z.null()])
  ).optional(),
  personnel_number: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  hat_size: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  respirator_size: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  gloves_size: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  position_change_date: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  template_id: z
    .preprocess(toNumNull, z.union([z.number().int('Некорректный шаблон').positive('Некорректный шаблон'), z.null()]))
    .optional(),
})


const toBool = (v) => (v === undefined ? undefined : v === true || v === 'true' || v === '1')

export const IssueRecordSchema = z.object({
  employee_id: z.preprocess(toNum, z.number().int().positive('Некорректный сотрудник')),
  item_type_id: z.preprocess(toNum, z.number().int().positive('Некорректная позиция')),
  quantity: z
    .preprocess(toNum, z.number().int().positive('Количество должно быть целым и больше 0'))
    .optional(),
  issue_date: z.string().optional().nullable(),
  certificate_id: z
    .preprocess(toNumNull, z.number().int().positive('Некорректный сертификат').nullable())
    .optional(),
  wear_time_override: z
    .preprocess(toNum, z.number().int('Срок носки должен быть целым числом').positive('Срок носки должен быть больше 0'))
    .optional()
    .nullable(),
  signature_path: z.string().optional().nullable(),
  signature_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z.preprocess(
    emptyToUndefined,
    z
      .enum(['personal', 'dosator'], {
        error: (issue) =>
          issue.input === undefined || issue.input === ''
            ? 'Выберите способ выдачи'
            : 'Выберите способ выдачи из списка',
      })
      .nullable()
      .optional(),
  ),
  write_off_act: z.string().optional().nullable(),
})

export const IssueBatchSchema = z.object({
  site_id: z.preprocess(toNum, z.number().int().positive('Некорректный объект')),
  position: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  item_type_id: z.preprocess(toNum, z.number().int().positive('Некорректная позиция')),
  quantity: z
    .preprocess(toNum, z.number().int().positive('Количество должно быть целым и больше 0'))
    .optional(),
  issue_date: z.string().optional().nullable(),
  certificate_id: z
    .preprocess(toNumNull, z.number().int().positive('Некорректный сертификат').nullable())
    .optional(),
  wear_time_override: z
    .preprocess(toNum, z.number().int('Срок носки должен быть целым числом').positive('Срок носки должен быть больше 0'))
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z.preprocess(
    emptyToUndefined,
    z
      .enum(['personal', 'dosator'], {
        error: (issue) =>
          issue.input === undefined || issue.input === ''
            ? 'Выберите способ выдачи'
            : 'Выберите способ выдачи из списка',
      })
      .nullable()
      .optional()
  ),
})

const IssueBatchSingleItemSchema = z.object({
  item_type_id: z.preprocess(toNum, z.number().int().positive('Некорректная позиция')),
  quantity: z
    .preprocess(toNum, z.number().int().positive('Количество должно быть целым и больше 0'))
    .optional(),
  certificate_id: z
    .preprocess(toNumNull, z.number().int().positive('Некорректный сертификат').nullable())
    .optional(),
  wear_time_override: z
    .preprocess(toNum, z.number().int('Срок носки должен быть целым числом').positive('Срок носки должен быть больше 0'))
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z.preprocess(
    emptyToUndefined,
    z
      .enum(['personal', 'dosator'], {
        error: (issue) =>
          issue.input === undefined || issue.input === ''
            ? 'Выберите способ выдачи'
            : 'Выберите способ выдачи из списка',
      })
      .nullable()
      .optional()
  ),
})

export const IssueBatchSingleSchema = z.object({
  employee_id: z.preprocess(toNum, z.number().int().positive('Некорректный сотрудник')),
  issue_date: z.string().optional().nullable(),
  items: z.array(IssueBatchSingleItemSchema).min(1, 'Добавьте хотя бы одну позицию'),
})

export const CertificateSchema = z.object({
  product_name: z.string().min(1, 'Введите наименование продукции'),
  certificate_number: z.string().optional().nullable(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  file_path: z.string().optional().nullable(),
  item_type_id: z
    .preprocess(toNum, z.number().int().positive('Некорректная позиция'))
    .optional()
    .nullable(),
  status: z
    .preprocess(emptyToUndefined, z.string())
    .optional()
    .nullable(),
})

export const SiteSchema = z.object({
  name: z.string().min(1, 'Введите название объекта'),
  responsible_person: z.string().optional().nullable(),
})

export const ItemTypeSchema = z.object({
  name: z.string().min(1, 'Введите наименование'),
  category: z.string().min(1, 'Выберите категорию'),
  unit: z.string().optional().nullable(),
  default_wear_time: z
    .preprocess(toNum, z.number().int('Срок годности должен быть целым числом').positive('Срок годности должен быть больше 0'))
    .optional()
    .nullable(),
  seasonality: z.string().optional().nullable(),
  requires_certificate: z.preprocess(toBool, z.boolean()).optional(),
})

export const FormSchema = z.object({
  name: z.string().min(1, 'Введите название формы'),
  description: z.string().optional().nullable(),
})

export const FormUpdateSchema = z.object({
  name: z.string().min(1, 'Введите название формы').optional(),
  description: z.string().optional().nullable(),
})

export const FormTakeSchema = z.object({
  employee_id: z.preprocess(toNum, z.number().int().positive('Некорректный сотрудник')),
  form_id: z.preprocess(toNum, z.number().int().positive('Некорректная форма')),
})

export const IssueNormSchema = z.object({
  item_type_id: z.preprocess(toNum, z.number().int().positive('Некорректная позиция')),
  period_months: z.preprocess(toNum, z.number().int('Периодичность должна быть целым числом').positive('Периодичность должна быть больше 0')),
  quantity: z
    .preprocess(toNum, z.number().int().positive('Количество должно быть целым и больше 0'))
    .optional(),
  gender: z.preprocess(
    emptyToUndefined,
    z
      .enum(['male', 'female', 'other'], {
        error: (issue) =>
          issue.input === undefined || issue.input === ''
            ? 'Выберите пол'
            : 'Выберите пол из списка',
      })
      .nullable()
      .optional()
  ),
  position: z.string().optional().nullable(),
  site_id: z
    .preprocess(toNum, z.number().int().positive('Некорректный объект'))
    .optional()
    .nullable(),
  seasonality: z.string().optional().nullable(),
  etn_point: z.string().optional().nullable(),
  period_text: z.string().optional().nullable(),
})

export const EmployeeUpdateSchema = EmployeeSchema.partial().extend({
  site_id: z.preprocess(
    toNumNull,
    z.union([z.number().int('Некорректный объект').positive('Некорректный объект'), z.null()])
  ).optional(),
  status: z.preprocess(emptyToUndefined, z.string().nullable().optional()),
  template_id: z
    .preprocess(toNumNull, z.union([z.number().int('Некорректный шаблон').positive('Некорректный шаблон'), z.null()]))
    .optional(),
})

export const SiteUpdateSchema = SiteSchema.partial()

export const ItemTypeUpdateSchema = z.object({
  name: z.string().min(1, 'Введите наименование').optional(),
  category: z.string().min(1, 'Выберите категорию').optional(),
  unit: z.string().optional().nullable(),
  default_wear_time: z
    .preprocess(toNum, z.number().int('Срок годности должен быть целым числом').positive('Срок годности должен быть больше 0'))
    .optional()
    .nullable(),
  seasonality: z.string().optional().nullable(),
  requires_certificate: z.preprocess(toBool, z.boolean()).optional(),
})

export const IssueNormUpdateSchema = IssueNormSchema.partial()

export const IssueRecordUpdateSchema = z.object({
  employee_id: z.preprocess(toNum, z.number().int().positive('Некорректный сотрудник')).optional(),
  item_type_id: z.preprocess(toNum, z.number().int().positive('Некорректная позиция')).optional(),
  quantity: z
    .preprocess(toNum, z.number().int().positive('Количество должно быть целым и больше 0'))
    .optional(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  certificate_id: z
    .preprocess(toNumNull, z.number().int().positive('Некорректный сертификат').nullable())
    .optional(),
  wear_time_override: z
    .preprocess(toNum, z.number().int('Срок носки должен быть целым числом').positive('Срок носки должен быть больше 0'))
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z.preprocess(
    emptyToUndefined,
    z
      .enum(['personal', 'dosator'], {
        error: (issue) =>
          issue.input === undefined || issue.input === ''
            ? 'Выберите способ выдачи'
            : 'Выберите способ выдачи из списка',
      })
      .nullable()
      .optional(),
  ),
  write_off_act: z.string().optional().nullable(),
})

export const CertificateUpdateSchema = CertificateSchema.partial().omit({ status: true })

export const IssueReturnSchema = z.object({
  return_date: z.string().optional().nullable(),
    return_quantity: z
    .preprocess(
      toNum,
      z.number().int().positive('Количество возврата должно быть целым и больше 0')
    )
    .optional(),
})

export const CertificateUploadSchema = z.object({
  product_name: z.string().min(1, 'Введите наименование продукции'),
  certificate_number: z.string().optional().nullable(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  item_type_id: z
    .preprocess(toNum, z.number().int().positive('Некорректная позиция'))
    .optional()
    .nullable(),
  certificate_id: z
    .preprocess(toNumNull, z.number().int().positive('Некорректный сертификат').nullable())
    .optional(),
})

export const SignatureUploadSchema = z.object({
  issue_record_id: z.preprocess(toNum, z.number().int().positive('Некорректная запись выдачи')),
})

export const PushSubscribeSchema = z.object({
  endpoint: z.string().min(1, 'endpoint обязателен'),
  keys: z.object({
    p256dh: z.string().min(1, 'keys.p256dh обязателен'),
    auth: z.string().min(1, 'keys.auth обязателен'),
  }),
  employee_id: z
    .preprocess(toNum, z.number().int().positive('Некорректный сотрудник'))
    .optional()
    .nullable(),
})

export const PushUnsubscribeSchema = z.object({
  endpoint: z.string().min(1, 'endpoint обязателен'),
})

export const PushSendSchema = z.object({
  employeeId: z
    .preprocess(toNum, z.number().int().positive('Некорректный сотрудник'))
    .optional()
    .nullable(),
  notificationId: z.string().min(1, 'notificationId обязателен'),
})

export const ClientLogSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error'], { error: 'Некорректный уровень лога' }),
  message: z.string().min(1, 'Сообщение обязательно').max(2000, 'Сообщение слишком длинное'),
  module: z.string().max(100, 'Название модуля слишком длинное').optional().nullable(),
  context: z.record(z.any()).optional().nullable(),
})

export const IssueListQuerySchema = z.object({
  employee_id: z.coerce.number().int().positive().optional(),
  site_id: z.coerce.number().int().positive().optional(),
  item_type_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['issued', 'returned', 'disposed', 'due_for_disposal']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  issue_method: z.enum(['personal', 'dosator']).optional(),
  page: z.coerce.number().int().catch(() => 1).optional(),
  limit: z.coerce.number().int().catch(() => 50).optional(),
})

export const ExpiringQuerySchema = z.object({
  months: z.coerce.number().int().min(0).optional(),
})

export const EmployeeListQuerySchema = z.object({
  search: z.string().min(1).optional(),
  status: z.enum(['active', 'terminated']).optional(),
  site_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().catch(() => 1).optional(),
  limit: z.coerce.number().int().catch(() => 50).optional(),
})

export const NormTemplateSchema = z.object({
  name: z.string().min(1, 'Введите название шаблона'),
  position: z.string().min(1, 'Введите должность'),
  site_id: z
    .preprocess(
      toNumNull,
      z.union([z.number().int('Некорректный объект').positive('Некорректный объект'), z.null()])
    )
    .optional(),
})

export const NormTemplateUpdateSchema = NormTemplateSchema.partial()

export const NormTemplateItemSchema = z.object({
  item_type_id: z.preprocess(toNum, z.number().int().positive('Некорректная позиция')),
  period_months: z.preprocess(
    toNum,
    z
      .number()
      .int('Периодичность должна быть целым числом')
      .positive('Периодичность должна быть больше 0')
      .optional()
      .nullable(),
  ),
  quantity: z
    .preprocess(toNum, z.number().int('Количество должно быть целым числом').positive('Количество должно быть больше 0'))
    .optional()
    .nullable(),
  etn_point: z.string().optional().nullable(),
  period_text: z.string().optional().nullable(),
  seasonality: z.string().optional().nullable(),
})
