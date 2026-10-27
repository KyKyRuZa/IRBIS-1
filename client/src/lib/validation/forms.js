import { z } from 'zod'

z.setErrorMap((issue) => {
  if (issue.code === 'invalid_type') {
    if (issue.expected === 'string') return 'Введите значение'
    if (issue.expected === 'number') return 'Введите число'
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

export const issueSchema = z.object({
  employee_id: z.string().min(1, 'Выберите сотрудника'),
  item_type_id: z.string().min(1, 'Выберите наименование'),
  quantity: z.coerce
    .number({
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Количество должно быть числом'
          : 'Количество должно быть числом',
    })
    .int('Количество должно быть целым')
    .positive('Количество должно быть больше 0'),
  certificate_id: z.string().optional().nullable(),
  wear_time_override: z.coerce
    .number({
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Срок носки должен быть числом'
          : 'Срок носки должен быть числом',
    })
    .int('Срок носки должен быть целым')
    .positive('Срок носки должен быть больше 0')
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z
    .enum(['personal', 'dosator'], {
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Выберите способ выдачи'
          : 'Выберите способ выдачи из списка',
    })
    .default('personal'),
  signature_path: z.string().optional().nullable(),
})

export const issueBatchSchema = z.object({
  site_id: z.string().min(1, 'Выберите объект'),
  position: z.string().optional().nullable(),
  item_type_id: z.string().min(1, 'Выберите наименование'),
  quantity: z.coerce
    .number({
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Количество должно быть числом'
          : 'Количество должно быть числом',
    })
    .int('Количество должно быть целым')
    .positive('Количество должно быть больше 0'),
  certificate_id: z.string().optional().nullable(),
  wear_time_override: z.coerce
    .number({
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Срок носки должен быть числом'
          : 'Срок носки должен быть числом',
    })
    .int('Срок носки должен быть целым')
    .positive('Срок носки должен быть больше 0')
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z
    .enum(['personal', 'dosator'], {
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Выберите способ выдачи'
          : 'Выберите способ выдачи из списка',
    })
    .default('personal'),
})

export const issueBatchSingleSchema = z.object({
  employee_id: z.string().min(1, 'Выберите сотрудника'),
  issue_date: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        item_type_id: z.string().min(1, 'Выберите наименование'),
        quantity: z.coerce
          .number({
            error: (issue) =>
              issue.input === undefined || issue.input === ''
                ? 'Количество должно быть числом'
                : 'Количество должно быть числом',
          })
          .int('Количество должно быть целым')
          .positive('Количество должно быть больше 0'),
        certificate_id: z.string().optional().nullable(),
        wear_time_override: z.coerce
          .number({
            error: (issue) =>
              issue.input === undefined || issue.input === ''
                ? 'Срок носки должен быть числом'
                : 'Срок носки должен быть числом',
          })
          .int('Срок носки должен быть целым')
          .positive('Срок носки должен быть больше 0')
          .optional()
          .nullable(),
        notes: z.string().optional().nullable(),
        issue_method: z
          .enum(['personal', 'dosator'], {
            error: (issue) =>
              issue.input === undefined || issue.input === ''
                ? 'Выберите способ выдачи'
                : 'Выберите способ выдачи из списка',
          })
          .default('personal'),
      })
    )
    .min(1, 'Добавьте хотя бы одну позицию'),
})

export const issueUpdateSchema = z.object({
  employee_id: z.string().min(1, 'Выберите сотрудника'),
  item_type_id: z.string().min(1, 'Выберите наименование'),
  quantity: z.coerce
    .number({
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Количество должно быть числом'
          : 'Количество должно быть числом',
    })
    .int('Количество должно быть целым')
    .positive('Количество должно быть больше 0'),
  certificate_id: z.string().optional().nullable(),
  wear_time_override: z.coerce
    .number({
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Срок носки должен быть числом'
          : 'Срок носки должен быть числом',
    })
    .int('Срок носки должен быть целым')
    .positive('Срок носки должен быть больше 0')
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z
    .enum(['personal', 'dosator'], {
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Выберите способ выдачи'
          : 'Выберите способ выдачи из списка',
    })
    .default('personal'),
})

export const normSchema = z.object({
  item_type_id: z.string().min(1, 'Выберите наименование'),
  period_months: z.coerce
    .number({
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Периодичность должна быть числом'
          : 'Периодичность должна быть числом',
    })
    .int('Периодичность должна быть целым')
    .positive('Периодичность должна быть больше 0'),
  quantity: z.coerce
    .number({
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Количество должно быть числом'
          : 'Количество должно быть числом',
    })
    .int('Количество должно быть целым')
    .positive('Количество должно быть больше 0')
    .optional()
    .nullable(),
  position: z.string().optional().nullable(),
  etn_point: z.string().optional().nullable(),
})

export const certificateSchema = z.object({
  product_name: z
    .string({ error: () => 'Введите наименование продукции' })
    .min(1, 'Введите наименование продукции'),
  certificate_number: z.string().optional().nullable(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z
    .string({ error: () => 'Введите срок действия' })
    .min(1, 'Введите срок действия'),
  item_type_id: z
    .string({ error: () => 'Выберите позицию номенклатуру' })
    .min(1, 'Выберите позицию номенклатуру'),
})

export const employeeSchema = z.object({
  full_name: z.string().min(1, 'Введите ФИО'),
  position: z.string().min(1, 'Введите должность'),
  site_id: z.string().min(1, 'Выберите объект'),
  gender: z
    .enum(['male', 'female'], {
      error: (issue) =>
        issue.input === undefined || issue.input === '' ? 'Выберите пол' : 'Выберите пол из списка',
    })
    .optional()
    .nullable(),
  hire_date: z.string().optional().nullable(),
  clothing_size: z.string().optional().nullable(),
  shoe_size: z.string().optional().nullable(),
  personnel_number: z.string().optional().nullable(),
  hat_size: z.string().optional().nullable(),
  respirator_size: z.string().optional().nullable(),
  gloves_size: z.string().optional().nullable(),
  height: z.coerce
    .number({
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Рост должен быть числом'
          : 'Рост должен быть числом',
    })
    .int('Рост должен быть целым')
    .positive('Рост должен быть больше 0')
    .optional()
    .nullable(),
  position_change_date: z.string().optional().nullable(),
  template_id: z.string().optional().nullable(),
})

export const siteSchema = z.object({
  name: z.string().min(1, 'Введите название объекта'),
  responsible_person: z.string().optional().nullable(),
})

export const itemSchema = z.object({
  name: z.string().min(1, 'Введите наименование'),
  category: z.string().min(1, 'Выберите категорию'),
  unit: z.string().optional().nullable(),
  default_wear_time: z.coerce
    .number({
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Срок годности должен быть числом'
          : 'Срок годности должен быть числом',
    })
    .int('Срок годности должен быть целым')
    .positive('Срок годности должен быть больше 0')
    .optional()
    .nullable(),
  seasonality: z.string().optional().nullable(),
  requires_certificate: z.boolean().optional(),
})

export const formTrackerSchema = z.object({
  name: z.string().min(1, 'Введите название формы'),
  description: z.string().optional().nullable(),
})

export const formUpdateSchema = z.object({
  name: z.string().min(1, 'Введите название формы').optional(),
  description: z.string().optional().nullable(),
})

export const formTakeSchema = z.object({
  employee_id: z.string().min(1, 'Выберите сотрудника'),
  form_id: z.string().min(1, 'Выберите форму'),
})

export const normTemplateSchema = z.object({
  name: z.string().min(1, 'Введите название шаблона'),
  position: z.string().min(1, 'Введите должность'),
  site_id: z.string().optional().nullable(),
})

export const normTemplateItemSchema = z.object({
  item_type_id: z.string().min(1, 'Выберите наименование'),
  period_months: z.coerce
    .number({
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Периодичность должна быть числом'
          : 'Периодичность должна быть числом',
    })
    .int('Периодичность должна быть целым')
    .positive('Периодичность должна быть больше 0'),
  quantity: z.coerce
    .number({
      error: (issue) =>
        issue.input === undefined || issue.input === ''
          ? 'Количество должно быть числом'
          : 'Количество должно быть числом',
    })
    .int('Количество должно быть целым')
    .positive('Количество должно быть больше 0')
    .optional()
    .nullable(),
  etn_point: z.string().optional().nullable(),
  period_text: z.string().optional().nullable(),
  seasonality: z.string().optional().nullable(),
})

export const loginSchema = z.object({
  username: z.string().min(1, 'Введите логин'),
  password: z.string().min(1, 'Введите пароль'),
})
