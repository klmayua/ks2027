/**
 * Seeded Senatorial Commitment Register — M5 (Kwara South · Hon. Popoola Adekeye Lekan Saheed).
 *
 * Grounded strictly in what a Senator can legislate, oversee, or deliver through zonal
 * intervention / federal agency lobbying — mapped directly to Popoola's five stated 2027
 * priorities: Community Security, Federal Roads, Agriculture, Youth Empowerment, and Healthcare.
 *
 * Deliberately mixed in outcome (delivered, in progress, delayed, revised, abandoned) to
 * demonstrate that a credible public scorecard publishes slippage alongside delivery.
 */

import { campaignConfig } from '@/config/campaign.config';
import { wards } from '@/lib/geography';
import {
  commitmentId,
  type Commitment,
  type CommitmentCategory,
  type Milestone,
} from '@/lib/commitments';
import { jitteredPoint, pick, rng, shuffle } from '@/lib/simulation/rng';

interface Spec {
  category: CommitmentCategory;
  seq: number;
  title: string;
  instrument: string;
  rationale: string;
  lgaCodes: string[];
  wardsPerLga: number;
  costNgn: number;
  targetYear: number;
  phase: Commitment['phase'];
  status: Commitment['status'];
  milestones: [string, string, boolean][];
  revisionNote?: string;
}

const SPECS: Spec[] = [
  {
    category: 'security',
    seq: 1,
    title: 'District-wide registered neighbourhood-watch & rural intelligence network',
    instrument: 'Constituency liaison · community security grant & National Assembly oversight',
    rationale:
      'Kidnapping and rural banditry along Ifelodun, Ekiti and Oke-Ero corridors have displaced ' +
      'farmers. Replicates Popoola’s Offa LGA neighbourhood-watch framework across all 7 LGAs, ' +
      'integrating local youths, Fulani residents and formal security agencies.',
    lgaCodes: ['05', '04', '14', '10', '09', '13', '15'],
    wardsPerLga: 3,
    costNgn: 320_000_000,
    targetYear: 2028,
    phase: 'senate_term',
    status: 'in_progress',
    milestones: [
      ['7-LGA security stakeholder register published', '2027-09-30', true],
      ['Formal liaison signed with Police & NSCDC commands', '2027-12-31', true],
      ['Equipment & patrol logistics handed to 21 hotspot wards', '2028-06-30', false],
      ['Quarterly rural safety audit published', '2028-12-31', false],
    ],
  },
  {
    category: 'roads',
    seq: 2,
    title: 'FERMA oversight & federal budget inclusion: Ilorin–Omu-Aran–Kabba & Offa–Oyun corridors',
    instrument: 'Senate Works Committee oversight · federal appropriation advocacy',
    rationale:
      'Failed federal and inter-LGA corridors isolate rural markets and double farm-gate haulage ' +
      'costs between Offa, Oyun, Irepodun and Ekiti.',
    lgaCodes: ['09', '13', '15', '04', '14'],
    wardsPerLga: 3,
    costNgn: 0,
    targetYear: 2029,
    phase: 'senate_term',
    status: 'in_progress',
    milestones: [
      ['Joint engineering condition dossier filed with Federal Ministry of Works', '2027-10-31', true],
      ['Emergency palliative sections captured in 2028 Appropriation Bill', '2028-02-28', true],
      ['FERMA contractor mobilisation verified on site', '2028-09-30', false],
      ['Corridor completion inspection published', '2029-06-30', false],
    ],
  },
  {
    category: 'health',
    seq: 3,
    title: 'Solar power & cold-chain upgrade for 21 rural Primary Health Centres (3 per LGA)',
    instrument: 'Zonal intervention project · National Primary Health Care Development Agency',
    rationale:
      'Ward returns documented rural PHCs across Kwara South operating without reliable power, ' +
      'compromising night deliveries and vaccine cold-chain storage.',
    lgaCodes: ['04', '05', '09', '10', '13', '14', '15'],
    wardsPerLga: 3,
    costNgn: 420_000_000,
    targetYear: 2028,
    phase: 'senate_term',
    status: 'delayed',
    milestones: [
      ['21-facility audit published across all 7 LGAs', '2027-08-31', true],
      ['Zonal procurement lot awarded', '2028-01-31', true],
      ['First 10 PHCs energised with solar inverters', '2028-07-31', false],
      ['Remaining 11 PHCs commissioned and handed over', '2028-12-31', false],
    ],
    revisionNote:
      'Commissioning slipped one quarter after battery specifications were upgraded for 24-hour ' +
      'cold-chain duty. Revised handover dates published rather than hidden.',
  },
  {
    category: 'water',
    seq: 4,
    title: 'Rehabilitation of 42 non-functional community boreholes across Kwara South',
    instrument: 'Zonal intervention · Lower Niger River Basin Development Authority',
    rationale:
      'Ward asset surveys logged 42 broken hand-pump and solar boreholes across high-need rural ' +
      'wards in Ifelodun, Isin, Oyun and Irepodun.',
    lgaCodes: ['05', '10', '15', '09', '04', '14', '13'],
    wardsPerLga: 2,
    costNgn: 210_000_000,
    targetYear: 2028,
    phase: 'senate_term',
    status: 'delivered',
    milestones: [
      ['Ward borehole inventory published', '2027-07-31', true],
      ['First 21 boreholes rehabilitated and tested', '2028-01-31', true],
      ['Remaining 21 boreholes handed over to ward committees', '2028-06-30', true],
    ],
  },
  {
    category: 'youth',
    seq: 5,
    title: 'Two Federal Constituency Youth Enterprise & Vocational Certification Hubs',
    instrument: 'Zonal intervention · SMEDAN & Industrial Training Fund partnership',
    rationale:
      'Youth leaders in both Ifelodun/Offa/Oyun and Ekiti/Irepodun/Isin/Oke-Ero identified ' +
      'accredited trade certification and starter toolkits as the binding barrier to self-reliance.',
    lgaCodes: ['13', '09'],
    wardsPerLga: 2,
    costNgn: 480_000_000,
    targetYear: 2029,
    phase: 'senate_term',
    status: 'revised',
    milestones: [
      ['Sites confirmed in Offa and Omu-Aran', '2028-02-28', true],
      ['Equipment & curriculum procurement', '2028-10-31', false],
      ['First 400 certified trainees graduated', '2029-06-30', false],
    ],
    revisionNote:
      'Consolidated from four smaller satellites into two full-scale hubs (Offa and Omu-Aran) ' +
      'with transport stipends for trainees from Ekiti, Isin, Oke-Ero, Ifelodun and Oyun.',
  },
  {
    category: 'agriculture',
    seq: 6,
    title: 'Farm-cluster input & rural storage facilitation for 7-LGA cooperatives',
    instrument: 'Federal Ministry of Agriculture & Food Security constituency intervention',
    rationale:
      'Once rural security corridors reopen, cashew, cassava and maize cooperatives need ' +
      'fertiliser, improved seedlings and aggregation stores to recover lost harvests.',
    lgaCodes: ['05', '04', '14', '10', '09'],
    wardsPerLga: 3,
    costNgn: 360_000_000,
    targetYear: 2028,
    phase: 'senate_term',
    status: 'delivered',
    milestones: [
      ['Cooperative beneficiary register published openly', '2027-10-31', true],
      ['First dry-season input batch distributed with geotagged receipts', '2028-02-28', true],
      ['Post-harvest audit with cooperative chairs', '2028-07-31', true],
    ],
  },
  {
    category: 'power',
    seq: 7,
    title: 'Grid extension to 12 off-grid farm settlements in Ifelodun and Ekiti',
    instrument: 'Rural Electrification Agency (REA) zonal nomination',
    rationale:
      'Twelve farm settlements reported zero grid access, preventing agro-processing and ' +
      'night-time security lighting.',
    lgaCodes: ['05', '04', '14'],
    wardsPerLga: 3,
    costNgn: 540_000_000,
    targetYear: 2029,
    phase: 'senate_term',
    status: 'abandoned',
    milestones: [['REA technical feasibility assessment', '2028-05-31', true]],
    revisionNote:
      'Abandoned as a grid-extension project after REA costing showed high-tension poles were ' +
      'uneconomic for 9 of the 12 settlements. Replaced by standalone solar mini-grids under a new ' +
      'identifier; this record remains published so the pivot stays visible.',
  },
  {
    category: 'governance',
    seq: 8,
    title: 'Quarterly Kwara South Constituency Scorecard & open zonal project register',
    instrument: 'Senatorial constituency offices (Omu-Aran & Offa)',
    rationale:
      'Every zonal project, federal nomination, bill sponsored, and motion moved carries a ' +
      'permanent public identifier and is reviewed openly each quarter across both constituencies.',
    lgaCodes: [],
    wardsPerLga: 0,
    costNgn: 28_000_000,
    targetYear: 2027,
    phase: 'senate_term',
    status: 'in_progress',
    milestones: [
      ['Omu-Aran & Offa constituency desks opened', '2027-07-31', true],
      ['Q1 legislative & zonal scorecard published', '2027-10-31', true],
      ['Q2 scorecard & town-hall review', '2028-01-31', true],
      ['Q3 scorecard & open budget tracker', '2028-04-30', false],
    ],
  },
  {
    category: 'women',
    seq: 9,
    title: 'Solar market lighting & lock-up sanitation in 7 central LGA markets',
    instrument: 'Zonal intervention · community development lot',
    rationale:
      'Market women across Owode (Offa), Omu-Aran, Share, Erin-Ile, Osi, Iloffa and Araromi-Opin ' +
      'identified evening lighting and drainage as immediate trading priorities.',
    lgaCodes: ['13', '09', '05', '15', '10', '14', '04'],
    wardsPerLga: 1,
    costNgn: 245_000_000,
    targetYear: 2028,
    phase: 'campaign',
    status: 'committed',
    milestones: [['Market association siting & costing signed off', '2027-08-31', false]],
  },
  {
    category: 'education',
    seq: 10,
    title: 'Federal tertiary scholarship & STEM exam-fee bursary across 83 wards',
    instrument: 'Constituency education trust · ward-verified allocation',
    rationale:
      'Published ward-by-ward allocation ensures bursaries reach indigent students across every ' +
      'ward in Kwara South rather than concentrating around urban centres.',
    lgaCodes: [],
    wardsPerLga: 0,
    costNgn: 85_000_000,
    targetYear: 2027,
    phase: 'campaign',
    status: 'proposed',
    milestones: [],
  },
];

export function seedCommitments(seedText = campaignConfig.simulation.seed): Commitment[] {
  const r = rng(`${seedText}:commitments`);

  return SPECS.map((spec) => {
    const wardIds = spec.lgaCodes.flatMap((code) =>
      shuffle(
        r,
        wards.filter((w) => w.lgaCode === code)
      )
        .slice(0, spec.wardsPerLga)
        .map((w) => w.id)
    );

    const milestones: Milestone[] = spec.milestones.map(([label, dueBy, done], i) => {
      const anchorLga = spec.lgaCodes[0] ?? '09';
      return {
        id: `ms-${spec.category}-${spec.seq}-${i + 1}`,
        label,
        dueBy,
        completedAt: done
          ? new Date(new Date(dueBy).getTime() - Math.floor(r() * 35) * 86_400_000).toISOString()
          : undefined,
        proof:
          done && r() < 0.72
            ? {
                caption: pick(r, [
                  'Site handover inspection with ward representatives',
                  'Geotagged commissioning record at community facility',
                  'Signed delivery verification sheet with LGA coordinator',
                  'Before-and-after site verification photograph',
                ]),
                ...jitteredPoint(r, anchorLga),
                capturedAt: new Date(
                  new Date(dueBy).getTime() - Math.floor(r() * 25) * 86_400_000
                ).toISOString(),
              }
            : undefined,
      };
    });

    return {
      id: commitmentId(spec.category, spec.seq),
      title: spec.title,
      category: spec.category,
      instrument: spec.instrument,
      rationale: spec.rationale,
      wardIds,
      estimatedCostNgn: spec.costNgn,
      targetYear: spec.targetYear,
      phase: spec.phase,
      status: spec.status,
      milestones,
      revisionNote: spec.revisionNote,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2028-07-01T00:00:00.000Z',
    } satisfies Commitment;
  });
}
