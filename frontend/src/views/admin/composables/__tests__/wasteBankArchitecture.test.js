import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const wasteBankRoot = path.resolve(process.cwd(), 'src/views/modules/waste-bank');
const entryViews = [
  'WasteBankCustomers.vue',
  'WasteBankDashboard.vue',
  'WasteBankTransactions.vue',
  'NasabahDashboard.vue',
  'WasteBankReports.vue',
];

describe('waste-bank view architecture', () => {
  it.each(entryViews)('%s remains an orchestration view under 500 lines', (file) => {
    const source = fs.readFileSync(path.join(wasteBankRoot, file), 'utf8');
    expect(source.split(/\r?\n/).length).toBeLessThanOrEqual(500);
  });
});
