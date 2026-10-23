export function addMonthsClamped(date, months) {
  const d = new Date(date)
  const startDay = d.getDate()
  d.setMonth(d.getMonth() + months)
  if (d.getDate() < startDay) {
    d.setDate(0)
  }
  return d
}
