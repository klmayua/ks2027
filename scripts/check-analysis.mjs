/**
 * Sanity check on the Kwara South electoral geography invariants.
 *
 * Asserts that geography reconciles against INEC's declared totals for Kwara South's 7 LGAs,
 * every ward belongs to a known LGA, every polling unit belongs to a known ward, and the two
 * federal constituencies partition the 7 LGAs cleanly.
 *
 * Usage: node scripts/check-analysis.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const geo = JSON.parse(
  readFileSync(resolve(ROOT, 'src/lib/geography/kwara-south.generated.json'), 'utf8')
);

const failures = [];
const check = (label, actual, expected) => {
  const ok = actual === expected;
  if (!ok) failures.push(`${label}: got ${actual}, expected ${expected}`);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}: ${actual}`);
};

console.log('Kwara South Geography\n---------------------');
check('LGAs', geo.lgas.length, 7);
check('Wards', geo.wards.length, 83);
check('Polling units (2015 enumerated)', geo.pollingUnits.length, 682);

const declaredWards = geo.lgas.reduce((s, l) => s + l.declaredWardCount, 0);
const declaredPus = geo.lgas.reduce((s, l) => s + l.declaredPollingUnitCount, 0);
check('Wards match INEC declared sum', geo.wards.length, declaredWards);
check('Polling units match INEC declared sum', geo.pollingUnits.length, declaredPus);

const lgaCodes = new Set(geo.lgas.map((l) => l.code));
const wardIds = new Set(geo.wards.map((w) => w.id));
check(
  'Wards with an unknown LGA',
  geo.wards.filter((w) => !lgaCodes.has(w.lgaCode)).length,
  0
);
check(
  'Polling units with an unknown ward',
  geo.pollingUnits.filter((p) => !wardIds.has(`${p.lgaCode}-${p.wardCode}`)).length,
  0
);
check('Duplicate ward ids', geo.wards.length - wardIds.size, 0);
check(
  'Duplicate polling unit ids',
  geo.pollingUnits.length - new Set(geo.pollingUnits.map((p) => p.id)).size,
  0
);

// Federal constituencies must partition the 7 Kwara South LGAs exactly.
const CONSTITUENCIES = {
  ifelodun_offa_oyun: ['05', '13', '15'],
  ekiti_irepodun_isin_oke_ero: ['04', '09', '10', '14'],
};
const assigned = Object.values(CONSTITUENCIES).flat();
console.log('\nFederal constituencies\n----------------------');
check('LGAs assigned to a federal constituency', assigned.length, 7);
check('Distinct LGAs assigned', new Set(assigned).size, 7);
check(
  'Assigned codes that exist',
  assigned.filter((c) => lgaCodes.has(c)).length,
  7
);
for (const [id, codes] of Object.entries(CONSTITUENCIES)) {
  const w = geo.wards.filter((x) => codes.includes(x.lgaCode)).length;
  console.log(`      ${id}: ${codes.length} LGAs, ${w} wards`);
}

console.log(
  failures.length ? `\n${failures.length} FAILURE(S)\n` : '\nAll invariants hold.\n'
);
for (const f of failures) console.log(`  - ${f}`);
process.exit(failures.length ? 1 : 0);
