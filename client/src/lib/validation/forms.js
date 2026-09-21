import { z } from 'zod';

export const issueSchema = z.object({
  employee_id: z.string().min(1, 'Выберите сотрудника'),
  item_type_id: z.string().min(1, 'Выберите наименование'),
  quantity: z.coerce.number({ error: (issue) => issue.input === undefined || issue.input === '' ? 'Количество должно быть числом' : 'Количество должно быть числом' }).int('Количество должно быть целым').positive('Количество должно быть больше 0'),
  certificate_id: z.string().optional().nullable(),
  wear_time_override: z.coerce.number({ error: (issue) => issue.input === undefined || issue.input === '' ? 'Срок носки должен быть числом' : 'Срок носки должен быть числом' }).int('Срок носки должен быть целым').positive('Срок носки должен быть больше 0').optional().nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z.enum(['personal', 'dosator'], { error: (issue) => (issue.input === undefined || issue.input === '' ? 'Выберите способ выдачи' : 'Выберите способ выдачи из списка') }).default('personal'),
  signature_path: z.string().optional().nullable(),
});

export const issueBatchSchema = z.object({
  site_id: z.string().min(1, 'Выберите объект'),
  item_type_id: z.string().min(1, 'Выберите наименование'),
  quantity: z.coerce.number({ error: (issue) => issue.input === undefined || issue.input === '' ? 'Количество должно быть числом' : 'Количество должно быть числом' }).int('Количество должно быть целым').positive('Количество должно быть больше 0'),
  certificate_id: z.string().optional().nullable(),
  wear_time_override: z.coerce.number({ error: (issue) => issue.input === undefined || issue.input === '' ? 'Срок носки должен быть числом' : 'Срок носки должен быть числом' }).int('Срок носки должен быть целым').positive('Срок носки должен быть больше 0').optional().nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z.enum(['personal', 'dosator'], { error: (issue) => (issue.input === undefined || issue.input === '' ? 'Выберите способ выдачи' : 'Выберите способ выдачи из списка') }).default('personal'),
});

export const issueBatchSingleSchema = z.object({
  employee_id: z.string().min(1, 'Выберите сотрудника'),
  issue_date: z.string().optional().nullable(),
  items: z.array(z.object({
    item_type_id: z.string().min(1, 'Выберите наименование'),
    quantity: z.coerce.number({ error: (issue) => issue.input === undefined || issue.input === '' ? 'Количество должно быть числом' : 'Количество должно быть числом' }).int('Количество должно быть целым').positive('Количество должно быть больше 0'),
    certificate_id: z.string().optional().nullable(),
    wear_time_override: z.coerce.number({ error: (issue) => issue.input === undefined || issue.input === '' ? 'Срок носки должен быть числом' : 'Срок носки должен быть числом' }).int('Срок носки должен быть целым').positive('Срок носки должен быть больше 0').optional().nullable(),
    notes: z.string().optional().nullable(),
    issue_method: z.enum(['personal', 'dosator'], { error: (issue) => (issue.input === undefined || issue.input === '' ? 'Выберите способ выдачи' : 'Выберите способ выдачи из списка') }).default('personal'),
  })).min(1, 'Добавьте хотя бы одну позицию'),
});

export const issueUpdateSchema = z.object({
  employee_id: z.string().min(1, 'Выберите сотрудника'),
  item_type_id: z.string().min(1, 'Выберите наименование'),
  quantity: z.coerce.number({ error: (issue) => issue.input === undefined || issue.input === '' ? 'Количество должно быть числом' : 'Количество должно быть числом' }).int('Количество должно быть целым').positive('Количество должно быть больше 0'),
  certificate_id: z.string().optional().nullable(),
  wear_time_override: z.coerce.number({ error: (issue) => issue.input === undefined || issue.input === '' ? 'Срок носки должен быть числом' : 'Срок носки должен быть числом' }).int('Срок носки должен быть целым').positive('Срок носки должен быть больше 0').optional().nullable(),
  notes: z.string().optional().nullable(),
  issue_method: z.enum(['personal', 'dosator'], { error: (issue) => (issue.input === undefined || issue.input === '' ? 'Выберите способ выдачи' : 'Выберите способ выдачи из списка') }).default('personal'),
});

export const normSchema = z.object({
  item_type_id: z.string().min(1, 'Выберите наименование'),
  period_months: z.coerce.number({ error: (issue) => issue.input === undefined || issue.input === '' ? 'Периодичность должна быть числом' : 'Периодичность должна быть числом' }).int('Периодичность должна быть целым').positive('Периодичность должна быть больше 0'),
  quantity: z.coerce.number({ error: (issue) => issue.input === undefined || issue.input === '' ? 'Количество должно быть числом' : 'Количество должно быть числом' }).int('Количество должно быть целым').positive('Количество должно быть больше 0').optional().nullable(),
  position: z.string().optional().nullable(),
});

export const certificateSchema = z.object({
  product_name: z.string().min(1, 'Введите наименование продукции'),
  certificate_number: z.string().optional().nullable(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().min(1, 'Введите срок действия'),
  item_type_id: z.string().optional().nullable(),
});

export const employeeSchema = z.object({
  full_name: z.string().min(1, 'Введите ФИО'),
  position: z.string().min(1, 'Введите должность'),
  site_id: z.string().optional().nullable(),
  gender: z.enum(['male', 'female'], { error: (issue) => (issue.input === undefined || issue.input === '' ? 'Выберите пол' : 'Выберите пол из списка') }).optional().nullable(),
  hire_date: z.string().optional().nullable(),
  clothing_size: z.string().optional().nullable(),
  shoe_size: z.string().optional().nullable(),
  personnel_number: z.string().optional().nullable(),
  hat_size: z.string().optional().nullable(),
  respirator_size: z.string().optional().nullable(),
  gloves_size: z.string().optional().nullable(),
  height: z.coerce.number({ error: (issue) => issue.input === undefined || issue.input === '' ? 'Рост должен быть числом' : 'Рост должен быть числом' }).int('Рост должен быть целым').positive('Рост должен быть больше 0').optional().nullable(),
  position_change_date: z.string().optional().nullable(),
});

export const siteSchema = z.object({
  name: z.string().min(1, 'Введите название объекта'),
  responsible_person: z.string().optional().nullable(),
});

export const itemSchema = z.object({
  name: z.string().min(1, 'Введите наименование'),
  category: z.string().min(1, 'Выберите категорию'),
  unit: z.string().optional().nullable(),
  default_wear_time: z.coerce.number({ error: (issue) => issue.input === undefined || issue.input === '' ? 'Срок годности должен быть числом' : 'Срок годности должен быть числом' }).int('Срок годности должен быть целым').positive('Срок годности должен быть больше 0').optional().nullable(),
  seasonality: z.string().optional().nullable(),
  requires_certificate: z.boolean().optional(),
});

export const formTrackerSchema = z.object({
  name: z.string().min(1, 'Введите название формы'),
  description: z.string().optional().nullable(),
});

export const formUpdateSchema = z.object({
  name: z.string().min(1, 'Введите название формы').optional(),
  description: z.string().optional().nullable(),
});

export const formTakeSchema = z.object({
  employee_id: z.string().min(1, 'Выберите сотрудника'),
  form_id: z.string().min(1, 'Выберите форму'),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Введите логин'),
  password: z.string().min(1, 'Введите пароль'),
});
