/**
 * Imports the parsed INEC geography into Supabase.
 *
 * Idempotent: everything upserts on its INEC code, so re-running after a directory update
 * reconciles rather than duplicates. Run after applying the migrations.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-geography.mjs
 *
 * Uses the service role because geography is reference data that RLS makes read-only to everyone
 * else. Never expose that key to the browser.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const geo = JSON.parse(
  readFileSync(resolve(ROOT, 'src/lib/geography/kwara-south.generated.json'), 'utf8')
);

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_ || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const DISTRICTS = {
  central: ['06', '07', '08', '01'],
  north: ['02', '03', '11', '12', '16'],
  south: ['04', '05', '09', '10', '13', '14', '15'],
};

const districtOf = (code) =>
  Object.entries(DISTRICTS).find(([, codes]) => codes.includes(code))?.[0];

async function upsert(table, rows, onConflict) {
  if (rows.length === 0) return;
  // Chunked so a 1,872-row insert does not hit the request size ceiling.
  const size = 500;
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const res = await fetch(
      `${URL_}/rest/v1/${table}?on_conflict=${onConflict}`,
      {
        method: 'POST',
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(chunk),
      }
    );
    if (!res.ok) {
      console.error(`${table} chunk ${i / size + 1} failed:`, res.status, await res.text());
      process.exit(1);
    }
    process.stdout.write(`  ${table}: ${Math.min(i + size, rows.length)}/${rows.length}\r`);
  }
  console.log(`  ${table}: ${rows.length}/${rows.length} done          `);
}

const missingDistrict = geo.lgas.filter((l) => !districtOf(l.code));
if (missingDistrict.length) {
  console.error('LGAs with no senatorial district:', missingDistrict.map((l) => l.code));
  process.exit(1);
}

console.log('Importing Kwara South geography...');

await upsert(
  'lga',
  geo.lgas.map((l) => ({
    code: l.code,
    name: l.name,
    inec_name: l.inecName,
    district: districtOf(l.code),
    declared_ward_count: l.declaredWardCount,
    declared_pu_count: l.declaredPollingUnitCount,
  })),
  'code'
);

await upsert(
  'ward',
  geo.wards.map((w) => ({
    id: w.id,
    lga_code: w.lgaCode,
    code: w.code,
    name: w.name,
    inec_name: w.inecName,
    declared_pu_count: w.declaredPollingUnitCount,
  })),
  'id'
);

await upsert(
  'polling_unit',
  geo.pollingUnits.map((p) => ({
    id: p.id,
    ward_id: `${p.lgaCode}-${p.wardCode}`,
    lga_code: p.lgaCode,
    code: p.code,
    name: p.name,
    inec_name: p.inecName,
    enumerated_in_directory: true,
  })),
  'id'
);

await upsert(
  'polling_unit_roll',
  [
    {
      id: true,
      current_total: 907,
      source_publisher: 'Independent National Electoral Commission (INEC)',
      source_document: '2021 polling unit expansion — Kwara South Senatorial District LGA totals',
      source_revision: 'May 2021',
      source_url: 'https://inecelectionresults.ng/',
      note:
        'INEC converted 225 voting points to polling units across Kwara South in 2021, taking ' +
        'the district from 682 to 907. Ward-level allocation of those 225 units is not in the ' +
        '2015 directory; obtain the current directory from INEC Kwara to close the gap.',
    },
  ],
  'id'
);

console.log(
  `\nImported ${geo.lgas.length} LGAs, ${geo.wards.length} wards, ${geo.pollingUnits.length} polling units.`
);
console.log(`Roll total recorded as 907 — ${907 - geo.pollingUnits.length} not yet ward-allocated.`);
