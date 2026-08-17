import fs from 'fs';
import pathModule from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

const __dirname = pathModule.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.IRBIS_BASE || 'http://localhost:5000';
const TMP = pathModule.join(__dirname, '..', 'tmp');
fs.mkdirSync(TMP, { recursive: true });

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' }),
  });
  const data = await res.json();
  return data.token;
}

async function download(filePath, token) {
  const res = await fetch(`${BASE}${filePath}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const buffer = Buffer.from(await res.arrayBuffer());
  const rawName = filePath.split('/').pop().split('?')[0] || 'file';
  const query = filePath.includes('?') ? filePath.split('?')[1] : '';
  const safeName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_') + (query ? '_' + query.replace(/[^a-zA-Z0-9_-]/g, '_') : '');
  const ext = res.headers.get('content-type')?.includes('sheet') ? '.xlsx' : res.headers.get('content-type')?.includes('json') ? '.json' : '.docx';
  const outPath = pathModule.join(TMP, safeName + ext);
  fs.writeFileSync(outPath, buffer);
  return { status: res.status, size: buffer.length, type: res.headers.get('content-type'), filePath: outPath };
}

async function unzipDocx(docxPath) {
  const AdmZip = (await import('adm-zip')).default;
  const zip = new AdmZip(docxPath);
  const entry = zip.getEntry('word/document.xml');
  if (!entry) return null;
  return entry.getData().toString('utf-8');
}

async function main() {
  const token = await login();
  console.log('Token obtained');

  const checks = [
    { name: 'Employee card', path: '/api/export/employee-card/12', expectText: 'Уварова' },
    { name: 'Consumables I', path: '/api/export/consumables/12?period=first', expectText: 'Уварова' },
    { name: 'Issues report', path: '/api/export/issues-report', expectText: 'Иванов' },
    { name: 'Expiring report', path: '/api/export/expiring-report', expectText: 'Иванов' },
    { name: 'Demand excel', path: '/api/reports/demand/excel', expectText: null },
    { name: 'Admin demand JSON', path: '/api/admin/demand', expectText: 'Куртка зимняя' },
  ];

  for (const c of checks) {
    try {
      const result = await download(c.path, token);
      console.log(`✔ ${c.name}: status=${result.status}, size=${result.size}, type=${result.type}, saved=${pathModule.basename(result.filePath)}`);

      if (result.filePath.endsWith('.xlsx')) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(result.filePath);
        const sheet = workbook.worksheets[0];
        let rowCount = 0;
        sheet.eachRow(() => { rowCount++; });
        console.log(`  Excel rows count: ${rowCount}`);
      }

      if (result.filePath.endsWith('.docx')) {
        const xml = await unzipDocx(result.filePath);
        if (xml) {
          const hasText = c.expectText ? xml.includes(c.expectText) : true;
          console.log(`  DOCX contains "${c.expectText || 'content'}": ${hasText}`);
        } else {
          console.log('  DOCX: word/document.xml not found');
        }
      }

      if (result.filePath.endsWith('.json')) {
        const content = fs.readFileSync(result.filePath, 'utf-8');
        const hasText = c.expectText ? content.includes(c.expectText) : true;
        console.log(`  JSON contains "${c.expectText || 'content'}": ${hasText}`);
      }
    } catch (e) {
      console.log(`✘ ${c.name}: ${e.response?.status || 'ERR'} ${e.response?.data?.error || e.message}`);
    }
  }
}

main();
