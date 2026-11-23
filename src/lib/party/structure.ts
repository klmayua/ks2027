/**
 * Party organisational structure — Kwara South Senatorial District (PDP).
 *
 * The roster is treated as a power map, not a directory: what matters operationally is which
 * positions are filled, by whom, and which bloc that person aligns to after the primary and
 * post-2025 PDP/SDP reunification. Vacancy and alignment at ward level are the two signals the war
 * room reads across the 83 wards of Kwara South.
 */

export type StructureLevel =
  | 'senatorial'
  | 'constituency'
  | 'lga'
  | 'ward'
  | 'polling_unit';

export type Wing = 'main' | 'women' | 'youth' | 'elders';

export interface PartyPosition {
  id: string;
  title: string;
  level: StructureLevel;
  rank: number;
  wing: Wing;
  /** Positions the war room treats as load-bearing for mobilisation. */
  loadBearing: boolean;
}

function positions(level: StructureLevel, titles: [string, boolean][]): PartyPosition[] {
  return titles.map(([title, loadBearing], i) => ({
    id: `${level}:${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title,
    level,
    rank: i,
    wing: 'main' as Wing,
    loadBearing,
  }));
}

const EXECUTIVE_TITLES: [string, boolean][] = [
  ['Chairman', true],
  ['Deputy Chairman', false],
  ['Secretary', true],
  ['Assistant Secretary', false],
  ['Organising Secretary', true],
  ['Publicity Secretary', true],
  ['Treasurer', false],
  ['Financial Secretary', false],
  ['Legal Adviser', false],
  ['Woman Leader', true],
  ['Youth Leader', true],
  ['Auditor', false],
  ['Welfare Officer', false],
];

export const PARTY_POSITIONS: PartyPosition[] = [
  ...positions('senatorial', [
    ['Senatorial Chairman', true],
    ['Director-General, Campaign', true],
    ['Secretary', true],
    ['Organising Secretary', true],
    ['Publicity Secretary', true],
    ['Woman Leader', true],
    ['Youth Leader', true],
    ['Legal & Election-Day Lead', true],
  ]),
  ...positions('constituency', [
    ['Constituency Coordinator', true],
    ['Deputy Coordinator', false],
    ['Secretary', true],
    ['Organising Lead', true],
    ['Woman Leader', true],
    ['Youth Leader', true],
  ]),
  ...positions('lga', EXECUTIVE_TITLES),
  ...positions('ward', [
    ['Chairman', true],
    ['Secretary', true],
    ['Organising Secretary', true],
    ['Publicity Secretary', false],
    ['Treasurer', false],
    ['Financial Secretary', false],
    ['Woman Leader', true],
    ['Youth Leader', true],
  ]),
  ...positions('polling_unit', [['Coordinator', true]]),
];

export const positionsForLevel = (level: StructureLevel): PartyPosition[] =>
  PARTY_POSITIONS.filter((p) => p.level === level);

export type Alignment =
  | 'aligned'
  | 'passive'
  | 'aggrieved'
  | 'reconciled'
  | 'unknown';

export const ALIGNMENT_LABELS: Record<Alignment, string> = {
  aligned: 'Aligned',
  passive: 'Passive',
  aggrieved: 'Aggrieved',
  reconciled: 'Reconciled',
  unknown: 'Not assessed',
};

export type Scope =
  | { level: 'senatorial' }
  | { level: 'constituency'; constituencyId: string }
  | { level: 'lga'; lgaCode: string }
  | { level: 'ward'; wardId: string }
  | { level: 'polling_unit'; pollingUnitId: string };

export interface Person {
  id: string;
  name: string;
  phone?: string;
  homeWardId?: string;
}

export interface Appointment {
  id: string;
  personId: string;
  positionId: string;
  scope: Scope;
  alignment: Alignment;
  assessmentNote?: string;
  assessedAt?: string;
}

export interface RosterEntry {
  appointment: Appointment;
  person: Person;
  position: PartyPosition;
}

// ---------------------------------------------------------------------------
// Power-map derivation
// ---------------------------------------------------------------------------

export interface WardControl {
  wardId: string;
  loadBearingSeats: number;
  filledSeats: number;
  alignment: Record<Alignment, number>;
  /** 0–1. Filled load-bearing seats held by aligned or reconciled officers. */
  effectiveControl: number;
  risk: 'held' | 'contested' | 'exposed' | 'vacant';
}

const WARD_LOAD_BEARING = positionsForLevel('ward').filter((p) => p.loadBearing).length;

export function deriveWardControl(wardId: string, entries: RosterEntry[]): WardControl {
  const wardEntries = entries.filter(
    (e) => e.appointment.scope.level === 'ward' && e.appointment.scope.wardId === wardId
  );
  const loadBearing = wardEntries.filter((e) => e.position.loadBearing);

  const alignment: Record<Alignment, number> = {
    aligned: 0,
    passive: 0,
    aggrieved: 0,
    reconciled: 0,
    unknown: 0,
  };
  for (const e of loadBearing) alignment[e.appointment.alignment] += 1;

  const filledSeats = loadBearing.length;
  const supportive = alignment.aligned + alignment.reconciled;
  const effectiveControl = WARD_LOAD_BEARING === 0 ? 0 : supportive / WARD_LOAD_BEARING;

  let risk: WardControl['risk'];
  if (filledSeats === 0) risk = 'vacant';
  else if (effectiveControl >= 0.6) risk = 'held';
  else if (effectiveControl >= 0.3) risk = 'contested';
  else risk = 'exposed';

  return {
    wardId,
    loadBearingSeats: WARD_LOAD_BEARING,
    filledSeats,
    alignment,
    effectiveControl,
    risk,
  };
}

export const RISK_LABELS: Record<WardControl['risk'], string> = {
  held: 'Held',
  contested: 'Contested',
  exposed: 'Exposed',
  vacant: 'No structure',
};
