/**
 * Parses the INEC Directory of Polling Units (Kwara State) and scopes it to Kwara South Senatorial
 * District (7 LGAs, 83 wards, 682 enumerated 2015 polling units).
 *
 * Source: https://inecnigeria.org/wp-content/uploads/2019/02/PU_Directory_Revised_January_2015_Kwara.pdf
 * Revision: January 2015. See data/inec/README.md for provenance and known staleness.
 *
 * Emits src/lib/geography/kwara-south.generated.json — every record carries its INEC code so it
 * can be reconciled against a newer directory without re-keying.
 *
 * Usage: node scripts/parse-inec-directory.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(ROOT, 'data/inec/kwara-pu-directory-2015.txt');
const TARGET = resolve(ROOT, 'src/lib/geography/kwara-south.generated.json');

const SOURCE_URL =
  'https://inecnigeria.org/wp-content/uploads/2019/02/PU_Directory_Revised_January_2015_Kwara.pdf';
const SOURCE_REVISION = 'January 2015';

/** The 7 LGAs that constitute Kwara South Senatorial District. */
const KWARA_SOUTH_LGAS = new Set(['04', '05', '09', '10', '13', '14', '15']);

/** The PDF uses U+2010 HYPHEN and non-breaking spaces; normalise to ASCII. */
function normalise(text) {
  return text
    .replace(/‐/g, '-')
    .replace(/–|—/g, '-')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n');
}

/** Title-cases INEC's ALL-CAPS names while preserving separators and known acronyms. */
function titleCase(name) {
  return name
    .toLowerCase()
    .replace(/(^|[\s/\-'.])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
    .replace(/\bL\.?G\.?E\.?A\.?\b/gi, 'LGEA')
    .replace(/\bLgea\b/g, 'LGEA')
    .replace(/\bIi\b/g, 'II')
    .replace(/\bIii\b/g, 'III')
    .replace(/\bIv\b/g, 'IV');
}

const raw = normalise(readFileSync(SOURCE, 'utf8'));
const pages = raw.split(/\n-- \d+ of \d+ --\n/);

// ---------------------------------------------------------------------------
// 1. State summary — filter to Kwara South's 7 LGAs.
// ---------------------------------------------------------------------------
const lgas = [];
const summaryPage = pages.find((p) => p.includes('THE LIST OF LOCAL GOVERNMENT AREAS'));
if (!summaryPage) throw new Error('Could not locate the LGA summary page.');

for (const line of summaryPage.split('\n')) {
  const m = line.match(/^(\d{2})\t(.+?)\s*\t(\d+)\s*\t(\d+)\s*$/);
  if (!m) continue;
  if (!KWARA_SOUTH_LGAS.has(m[1])) continue;
  lgas.push({
    code: m[1],
    name: titleCase(m[2].trim()),
    inecName: m[2].trim(),
    declaredWardCount: Number(m[3]),
    declaredPollingUnitCount: Number(m[4]),
  });
}

// ---------------------------------------------------------------------------
// 2. Per-LGA registration-area (ward) lists — Kwara South only.
// ---------------------------------------------------------------------------
const wards = [];
for (const page of pages) {
  if (!page.includes('THE LIST OF REGISTRATION AREAS')) continue;

  const lgaCode = page.match(/Code:\s*(\d{2})/)?.[1];
  if (!lgaCode || !KWARA_SOUTH_LGAS.has(lgaCode)) continue;

  for (const line of page.split('\n')) {
    const m = line.match(/^(\d{2})\t(.+?)\s*\t(\d+)\s*$/);
    if (!m) continue;
    wards.push({
      lgaCode,
      code: m[1],
      id: `${lgaCode}-${m[1]}`,
      name: titleCase(m[2].trim()),
      inecName: m[2].trim(),
      declaredPollingUnitCount: Number(m[3]),
    });
  }
}

// ---------------------------------------------------------------------------
// 3. Polling units — Kwara South only.
// ---------------------------------------------------------------------------
const pollingUnits = [];
let currentLgaCode = null;
let currentWardCode = null;

for (const page of pages) {
  if (!page.includes('PU Name')) continue;

  const lgaOnPage = page.match(/\n?(.+?)\s*\tCode:\s*\t(\d{2})\t?LGA:/);
  if (lgaOnPage) currentLgaCode = lgaOnPage[2];

  for (const line of page.split('\n')) {
    const wardHeader = line.match(/^(.+?)\s*\tCode:\s*(\d{2})\s*$/);
    if (wardHeader) {
      currentWardCode = wardHeader[2];
      continue;
    }
    const pu = line.match(/^(.+?)\s*\t(\d{3})\s*$/);
    if (!pu || !currentLgaCode || !currentWardCode) continue;
    if (!KWARA_SOUTH_LGAS.has(currentLgaCode)) continue;
    if (/^TOTAL/i.test(pu[1])) continue;

    pollingUnits.push({
      lgaCode: currentLgaCode,
      wardCode: currentWardCode,
      code: pu[2],
      id: `${currentLgaCode}-${currentWardCode}-${pu[2]}`,
      name: titleCase(pu[1].trim()),
      inecName: pu[1].trim(),
    });
  }
}

// ---------------------------------------------------------------------------
// 4. Reconcile against INEC's own declared totals before emitting anything.
// ---------------------------------------------------------------------------
const problems = [];

for (const lga of lgas) {
  const lgaWards = wards.filter((w) => w.lgaCode === lga.code);
  if (lgaWards.length !== lga.declaredWardCount) {
    problems.push(
      `${lga.name}: parsed ${lgaWards.length} wards, INEC declares ${lga.declaredWardCount}`
    );
  }
  const lgaPus = pollingUnits.filter((p) => p.lgaCode === lga.code);
  if (lgaPus.length !== lga.declaredPollingUnitCount) {
    problems.push(
      `${lga.name}: parsed ${lgaPus.length} polling units, INEC declares ${lga.declaredPollingUnitCount}`
    );
  }
}

for (const ward of wards) {
  const wardPus = pollingUnits.filter(
    (p) => p.lgaCode === ward.lgaCode && p.wardCode === ward.code
  );
  if (wardPus.length !== ward.declaredPollingUnitCount) {
    problems.push(
      `${ward.name} (${ward.id}): parsed ${wardPus.length} polling units, INEC declares ${ward.declaredPollingUnitCount}`
    );
  }
}

const output = {
  source: {
    publisher: 'Independent National Electoral Commission (INEC)',
    document: 'Directory of Polling Units — Kwara State (Kwara South Senatorial District extract)',
    revision: SOURCE_REVISION,
    url: SOURCE_URL,
    parsedAt: new Date().toISOString(),
    caveat:
      'Ward-level polling unit enumeration predates the 2021 INEC polling unit expansion (682 ' +
      'enumerated vs 907 post-2021 district total). Ward and LGA structure is stable, and ' +
      'coverage denominators use the authoritative 907 figure.',
  },
  totals: {
    lgas: lgas.length,
    wards: wards.length,
    pollingUnits: pollingUnits.length,
  },
  lgas,
  wards,
  pollingUnits,
};

writeFileSync(TARGET, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

console.log(`LGAs:           ${lgas.length}`);
console.log(`Wards:          ${wards.length}`);
console.log(`Polling units:  ${pollingUnits.length}`);
console.log(
  problems.length
    ? `\nReconciliation problems (${problems.length}):`
    : '\nReconciles cleanly against INEC declared totals.'
);
for (const p of problems.slice(0, 40)) console.log(`  - ${p}`);
if (problems.length > 40) console.log(`  ... and ${problems.length - 40} more`);
console.log(`\nWrote ${TARGET}`);
if (problems.length) process.exit(1);
