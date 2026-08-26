export const EMPLOYEE_STATUSES = {
  active: 'Работает',
  terminated: 'Уволен',
};

export const EMPLOYEE_STATUS_VALUES = {
  active: 'active',
  terminated: 'terminated',
};

export function normalizeEmployeeStatus(value) {
  const v = String(value ?? '').trim().toLowerCase();
  if (v === 'active' || v === 'работает') return 'active';
  return 'terminated';
}
