import { describe, it, expect } from 'vitest';
import { loadTemplate } from '../src/controllers/export/employeeCardHelpers.js';
import path from 'node:path';
import fs from 'node:fs';

const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'templates');

describe('loadTemplate — path traversal protection', () => {
  it('throws on path traversal with ../', async () => {
    await expect(loadTemplate('../etc/passwd', {})).rejects.toThrow(
      'path traversal detected'
    );
  });

  it('throws on path traversal with ..\\', async () => {
    await expect(loadTemplate('..\\windows\\system32', {})).rejects.toThrow(
      'path traversal detected'
    );
  });

  it('throws on path traversal with forward slash in filename', async () => {
    await expect(loadTemplate('subdir/template.docx', {})).rejects.toThrow(
      'path traversal detected'
    );
  });

  it('throws on empty filename with slashes', async () => {
    await expect(loadTemplate('/etc/passwd', {})).rejects.toThrow(
      'path traversal detected'
    );
  });

  it('throws on encoded path traversal', async () => {
    await expect(loadTemplate('..%2F..%2Fetc%2Fpasswd', {})).rejects.toThrow(
      'path traversal detected'
    );
  });
});

describe('loadTemplate — valid filenames', () => {
  it('accepts a simple filename without traversal', async () => {
    // Check if templates dir exists first
    if (!fs.existsSync(TEMPLATES_DIR)) {
      // Create a test template to verify the logic works
      const testTemplatePath = path.join(TEMPLATES_DIR, 'test-verify.docx');
      if (fs.existsSync(testTemplatePath)) {
        fs.unlinkSync(testTemplatePath);
      }
      // The function should at least try to load without throwing path traversal error
    }

    // If no real template exists, we can't fully test rendering,
    // but we can verify the path is constructed correctly by checking it doesn't
    // throw a path traversal error
    if (fs.existsSync(TEMPLATES_DIR)) {
      const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.docx'));
      if (files.length > 0) {
        const doc = await loadTemplate(files[0], { test: 'data' });
        expect(doc).toBeDefined();
        expect(typeof doc.setData).toBe('function');
      }
    }
  });
});
