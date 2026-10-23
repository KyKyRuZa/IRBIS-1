import toast from 'react-hot-toast'

export const showSuccess = (message) =>
  toast.success(message, {
    duration: 3000,
    position: 'bottom-right',
  })

export const showError = (message) =>
  toast.error(message, {
    duration: 4000,
    position: 'bottom-right',
  })

export const showInfo = (message) =>
  toast(message, {
    duration: 3000,
    position: 'bottom-right',
    icon: 'ℹ️',
  })

const FIELD_LABELS = {
  employee_id: 'Сотрудник',
  item_type_id: 'Наименование',
  quantity: 'Количество',
  certificate_id: 'Сертификат',
  wear_time_override: 'Срок носки',
  site_id: 'Объект',
  issue_method: 'Способ выдачи',
  issue_date: 'Дата выдачи',
  expiry_date: 'Срок действия',
  full_name: 'ФИО',
  position: 'Должность',
  position_change_date: 'Дата изменения профессии',
  gender: 'Пол',
  hire_date: 'Дата приёма',
  clothing_size: 'Размер одежды',
  shoe_size: 'Размер обуви',
  height: 'Рост',
  personnel_number: 'Табельный номер',
  hat_size: 'Размер головного убора',
  respirator_size: 'Размер СИЗОД',
  gloves_size: 'Размер СИЗ рук',
  name: 'Название',
  category: 'Категория',
  unit: 'Единица измерения',
  default_wear_time: 'Срок годности',
  seasonality: 'Сезонность',
  requires_certificate: 'Необходимость сертификата',
  product_name: 'Продукция',
  certificate_number: 'Номер сертификата',
  description: 'Описание',
  form_id: 'Форма',
  return_quantity: 'Количество возврата',
  return_date: 'Дата возврата',
  month: 'Месяцы',
  endpoint: 'Endpoint',
  keys: 'Ключи подписки',
  p256dh: 'Ключ p256dh',
  auth: 'Ключ auth',
  level: 'Уровень лога',
  message: 'Сообщение',
  module: 'Модуль',
  context: 'Контекст',
  notificationId: 'ID уведомления',
}

function fieldLabel(path) {
  const key = path.join('.')
  return FIELD_LABELS[key] || FIELD_LABELS[path[path.length - 1]] || key
}

export const showFieldErrors = (issues) => {
  const unique = []
  const seen = new Set()
  ;(issues || []).forEach((issue) => {
    const key = issue.path.join('.')
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(issue)
    }
  })
  const message = unique
    .map((issue) => {
      const label = fieldLabel(issue.path)
      return label ? `${label}: ${issue.message}` : issue.message
    })
    .join('; ')
  return showError(message || 'Исправьте ошибки в форме')
}

export function handleValidationError(err, fallbackMsg) {
  const issues = err?.response?.data?.issues
  if (Array.isArray(issues) && issues.length > 0) {
    return showFieldErrors(issues)
  }
  const msg = err?.response?.data?.error || err?.message || fallbackMsg || 'Ошибка сохранения'
  return showError(msg)
}

export function formatValidationError(err, fallbackMsg) {
  const issues = err?.response?.data?.issues
  if (Array.isArray(issues) && issues.length > 0) {
    return issues
      .map((issue) => {
        const label = fieldLabel(issue.path)
        return label ? `${label}: ${issue.message}` : issue.message
      })
      .join('; ')
  }
  return err?.response?.data?.error || err?.message || fallbackMsg || 'Ошибка'
}
