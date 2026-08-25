import { describe, it, expect } from 'vitest';
import { EMPLOYEE_STATUSES } from '@/lib/constants/employee-statuses.js';
import { CERTIFICATE_STATUSES, CERTIFICATE_STATUS_LABELS } from '@/lib/constants/certificate-statuses.js';
import { ISSUE_STATUSES, ISSUE_STATUS_LABELS } from '@/lib/constants/issue-statuses.js';
import { ITEM_CATEGORIES } from '@/lib/constants/item-categories.js';
import { SEASONALITY } from '@/lib/constants/seasonality.js';

describe('constants', () => {
  it('employee statuses map to russian labels', () => {
    expect(EMPLOYEE_STATUSES.active).toBe('Работает');
    expect(EMPLOYEE_STATUSES.terminated).toBe('Уволен');
  });

  it('certificate statuses and labels are consistent', () => {
    expect(Object.keys(CERTIFICATE_STATUSES).length).toBe(3);
    expect(CERTIFICATE_STATUS_LABELS.active).toBe('Активен');
    expect(CERTIFICATE_STATUS_LABELS.expiring).toBe('Истекает');
    expect(CERTIFICATE_STATUS_LABELS.expired).toBe('Просрочен');
  });

  it('issue statuses and labels are consistent', () => {
    expect(ISSUE_STATUSES.issued).toBe('issued');
    expect(ISSUE_STATUS_LABELS.issued).toBe('Выдано');
    expect(ISSUE_STATUS_LABELS.disposed).toBe('Списано');
    expect(ISSUE_STATUS_LABELS.returned).toBe('Возвращено');
    expect(ISSUE_STATUS_LABELS.due_for_disposal).toBe('Подлежит списанию');
  });

  it('item categories cover the main groups', () => {
    expect(ITEM_CATEGORIES.clothing).toBe('Спецодежда');
    expect(ITEM_CATEGORIES.footwear).toBe('Обувь');
    expect(ITEM_CATEGORIES.siz).toBe('СИЗ');
    expect(ITEM_CATEGORIES.consumable).toBe('Расходники');
  });

  it('seasonality has winter/summer/year-round', () => {
    expect(SEASONALITY.winter).toBe('Зимняя');
    expect(SEASONALITY.summer).toBe('Летняя');
    expect(SEASONALITY.year_round).toBe('Круглогодичная');
  });
});
