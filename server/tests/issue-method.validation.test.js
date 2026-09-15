import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssueRecordSchema, IssueBatchSchema, IssueBatchSingleSchema, IssueRecordUpdateSchema } from '../src/validation/index.js';

describe('Validation: issue_method', () => {
  it('accepts valid issue_method on create', () => {
    expect(() => IssueRecordSchema.parse({
      employee_id: 1,
      item_type_id: 1,
      issue_method: 'personal',
    })).not.toThrow();
    expect(() => IssueRecordSchema.parse({
      employee_id: 1,
      item_type_id: 1,
      issue_method: 'dosator',
    })).not.toThrow();
  });

  it('rejects invalid issue_method on create', () => {
    expect(() => IssueRecordSchema.parse({
      employee_id: 1,
      item_type_id: 1,
      issue_method: 'invalid',
    })).toThrow();
  });

  it('accepts valid issue_method on update', () => {
    expect(() => IssueRecordUpdateSchema.parse({ issue_method: 'personal' })).not.toThrow();
    expect(() => IssueRecordUpdateSchema.parse({ issue_method: 'dosator' })).not.toThrow();
  });

  it('rejects invalid issue_method on update', () => {
    expect(() => IssueRecordUpdateSchema.parse({ issue_method: 'invalid' })).toThrow();
  });

  it('allows null/undefined issue_method', () => {
    expect(() => IssueRecordSchema.parse({
      employee_id: 1,
      item_type_id: 1,
      issue_method: null,
    })).not.toThrow();
    expect(() => IssueRecordUpdateSchema.parse({ issue_method: undefined })).not.toThrow();
  });

  it('batch schema accepts issue_method', () => {
    expect(() => IssueBatchSchema.parse({
      site_id: 1,
      item_type_id: 1,
      issue_method: 'dosator',
    })).not.toThrow();
  });

  it('batch-single items accept issue_method', () => {
    expect(() => IssueBatchSingleSchema.parse({
      employee_id: 1,
      items: [
        { item_type_id: 1, issue_method: 'personal' },
        { item_type_id: 2, issue_method: 'dosator' },
      ],
    })).not.toThrow();
  });
});
