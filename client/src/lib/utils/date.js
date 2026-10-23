export function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}.${month}.${year}`
}

export function toDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${day}.${month}.${year}`
}

export function parseDateInput(value) {
  if (!value) return ''
  const parts = value.split('.')
  if (parts.length !== 3) return value
  const [day, month, year] = parts.map(Number)
  if (day.length === 2 && month.length === 2 && year.length === 4) {
    return `${year}-${month}-${day}`
  }
  return value
}

export function isValidDate(value) {
  if (!value) return false
  const parts = value.split('.')
  if (parts.length !== 3) return false
  const [day, month, year] = parts.map(Number)
  if (!/^\d{2}$/.test(parts[0]) || !/^\d{2}$/.test(parts[1]) || !/^\d{4}$/.test(parts[2])) return false
  if (month < 1 || month > 12) return false
  const date = new Date(year, month - 1, day)
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) return false
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false
  }
  return true
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
