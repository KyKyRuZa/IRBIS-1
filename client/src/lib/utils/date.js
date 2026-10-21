export function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

export function toDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

export function parseDateInput(value) {
  if (!value) return ''
  const parts = value.split('.')
  if (parts.length !== 3) return value
  const [day, month, year] = parts
  if (day.length === 2 && month.length === 2 && year.length === 4) {
    return `${year}-${month}-${day}`
  }
  return value
}

export function dateMaskInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length === 0) return ''
  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  const year = digits.slice(4, 8)
  let result = ''
  if (day) result = day
  if (month) result += '.' + month
  if (year) result += '.' + year
  return result
}
