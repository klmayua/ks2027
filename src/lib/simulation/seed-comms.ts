/**
 * Seeded directives, acknowledgements and task completions — M2 (Kwara South PDP).
 *
 * Acknowledgement rates correlate directly with ward control from the M1 power map across the 83
 * wards of Kwara South. Directives reflect the real sprint toward the 16 January 2027 Senate poll.
 */

import { campaignConfig } from '@/config/campaign.config';
import { wards } from '@/lib/geography';
import type {
  Acknowledgement,
  Directive,
  TaskCompletion,
} from '@/lib/comms/directives';
import { resolveScope } from '@/lib/comms/directives';
import type { RosterEntry, WardControl } from '@/lib/party/structure';
import { deriveWardControl } from '@/lib/party/structure';
import { jitteredPoint, personName, pick, rng } from '@/lib/simulation/rng';

const ISSUERS: [string, string][] = [
  ['Senatorial Chairman', 'party'],
  ['Director-General, KS2027', 'campaign'],
  ['Organising Secretary', 'party'],
  ['Publicity Secretary', 'party'],
  ['Woman Leader, Kwara South', 'party'],
];

export function seedDirectives(seedText = campaignConfig.simulation.seed): Directive[] {
  const r = rng(`${seedText}:directives`);

  const issuer = (i: number) => {
    const [role] = ISSUERS[i % ISSUERS.length];
    return { role, name: personName(r) };
  };

  const d = (
    i: number,
    partial: Omit<Directive, 'id' | 'reference' | 'issuedByRole' | 'issuedByName'>
  ): Directive => {
    const { role, name } = issuer(i);
    return {
      id: `d-${i + 1}`,
      reference: `KS/DIR/2026/${String(i + 1).padStart(3, '0')}`,
      issuedByRole: role,
      issuedByName: name,
      ...partial,
    };
  };

  return [
    d(0, {
      title: 'Ward executive verification — PDP & returning structures',
      body:
        'Confirm the active holder of every load-bearing ward office across all 83 wards — ' +
        'chairman, secretary, organising secretary, woman leader, youth leader. Where a ward ' +
        'still runs parallel PDP and returning SDP lists, log both names so harmonisation closes ' +
        'before December.',
      scope: { kind: 'district' },
      priority: 'urgent',
      issuedAt: '2026-11-12T07:30:00.000Z',
      ackDeadline: '2026-11-18T17:00:00.000Z',
      requiresAck: true,
      task: { instruction: 'Return verified 5-seat ward executive sheet.', requiresProof: false },
    }),
    d(1, {
      title: 'Rural security & farmland access baseline — ward audit',
      body:
        'Document active community vigilante posts, inaccessible farm corridors, and local youth ' +
        'or Fulani liaison contacts in your ward. Attach geotagged photographs of failed bridges ' +
        'or abandoned security posts so the principal’s neighbourhood-watch rollout is mapped to ' +
        'real wards.',
      scope: { kind: 'district' },
      priority: 'priority',
      issuedAt: '2026-11-05T08:00:00.000Z',
      ackDeadline: '2026-11-19T17:00:00.000Z',
      requiresAck: true,
      task: {
        instruction: 'Submit geotagged corridor and community security asset records.',
        requiresProof: true,
      },
    }),
    d(2, {
      title: 'Ifelodun & Irepodun turnout surge — door-to-door teams',
      body:
        'Ifelodun (22.6% turnout in 2023) and Irepodun (Omu-Aran) together hold over 51,000 cast ' +
        'votes and the largest untapped voter pool in Kwara South. Each ward in both LGAs is to ' +
        'constitute two additional canvass teams immediately.',
      scope: { kind: 'lga', lgaCodes: ['05', '09'] },
      priority: 'urgent',
      issuedAt: '2026-11-14T09:15:00.000Z',
      ackDeadline: '2026-11-21T17:00:00.000Z',
      requiresAck: true,
    }),
    d(3, {
      title: 'Polling unit agent nominations — all 907 Kwara South PUs',
      body:
        'Submit two verified PDP agent nominees per polling unit — including converted 2021 ' +
        'voting points (Offa alone carries 173 PUs). Nominees must be registered voters in the ' +
        'ward they will guard on 16 January 2027.',
      scope: { kind: 'district' },
      priority: 'priority',
      issuedAt: '2026-11-10T08:00:00.000Z',
      ackDeadline: '2026-11-28T17:00:00.000Z',
      requiresAck: true,
      task: { instruction: 'Return two accredited agent nominees per polling unit.', requiresProof: false },
    }),
    d(4, {
      title: 'Omu-Aran & Ekiti-axis reconciliation town hall attendance',
      body:
        'Ward chairmen across Ekiti, Irepodun, Isin and Oke-Ero are to confirm attendance at the ' +
        'constituency harmonisation meeting in Omu-Aran through the app — not by voice call.',
      scope: { kind: 'constituency', constituencyIds: ['ekiti_irepodun_isin_oke_ero'] },
      priority: 'priority',
      issuedAt: '2026-11-16T15:00:00.000Z',
      ackDeadline: '2026-11-22T12:00:00.000Z',
      requiresAck: true,
    }),
    d(5, {
      title: 'Women’s wing — Owode, Omu-Aran & rural market outreach',
      body:
        'Ward woman leaders are to meet market association heads across Offa, Erin-Ile, Share, ' +
        'Omu-Aran, Osi and Iloffa and log priority concerns on transport and produce access.',
      scope: { kind: 'wing', wing: 'women' },
      priority: 'routine',
      issuedAt: '2026-11-18T10:30:00.000Z',
      requiresAck: true,
    }),
    d(6, {
      title: 'Federal road & PHC condition photo returns',
      body:
        'Photograph damaged sections along the Ilorin–Omu-Aran–Kabba and Offa–Oyun corridors plus ' +
        'any non-powered primary health centre in your ward for the Public Ledger evidence file.',
      scope: { kind: 'district' },
      priority: 'routine',
      issuedAt: '2026-11-01T09:00:00.000Z',
      ackDeadline: '2026-11-20T17:00:00.000Z',
      requiresAck: true,
      task: { instruction: 'Upload geotagged road or PHC condition evidence.', requiresProof: true },
    }),
  ];
}

const ACK_BY_RISK: Record<WardControl['risk'], number> = {
  held: 0.92,
  contested: 0.68,
  exposed: 0.38,
  vacant: 0.1,
};

/** Rural border LGAs with patchier mobile coverage report later due to connectivity, not intent. */
const LOW_SIGNAL_LGAS = new Set(['04', '05', '10', '14']);

export function seedAcknowledgements(
  directives: Directive[],
  entries: RosterEntry[],
  seedText = campaignConfig.simulation.seed
): { acks: Acknowledgement[]; completions: TaskCompletion[] } {
  const r = rng(`${seedText}:acks`);

  const control = new Map<string, WardControl>();
  for (const w of wards) control.set(w.id, deriveWardControl(w.id, entries));

  const acks: Acknowledgement[] = [];
  const completions: TaskCompletion[] = [];

  for (const directive of directives) {
    const target = resolveScope(directive.scope);
    const issued = new Date(directive.issuedAt).getTime();

    const ageDays = Math.max(1, (Date.now() - issued) / 86_400_000);
    const maturity = Math.min(1, 0.4 + ageDays / 10);
    const urgencyBoost =
      directive.priority === 'urgent' ? 1.1 : directive.priority === 'priority' ? 1.0 : 0.88;

    for (const wardId of target) {
      const c = control.get(wardId);
      if (!c) continue;
      const p = ACK_BY_RISK[c.risk] * maturity * urgencyBoost;
      if (r() > p) continue;

      const lgaCode = wardId.split('-')[0];
      const lagHours = (LOW_SIGNAL_LGAS.has(lgaCode) ? 12 : 4) + r() * 36;
      const at = new Date(issued + lagHours * 3_600_000).toISOString();

      acks.push({
        directiveId: directive.id,
        wardId,
        byPersonName: personName(r),
        byRole: pick(r, ['Ward Chairman', 'Ward Secretary', 'Organising Secretary', 'Woman Leader']),
        at,
      });

      if (directive.task && r() < 0.58) {
        const withProof = directive.task.requiresProof && r() < 0.74;
        completions.push({
          directiveId: directive.id,
          wardId,
          byPersonName: personName(r),
          at: new Date(issued + (lagHours + 18 + r() * 72) * 3_600_000).toISOString(),
          proof: withProof
            ? {
                caption: pick(r, [
                  'Failed culvert along Oke-Ode rural farm link road',
                  'Primary health centre operating without power supply',
                  'Community vigilante checkpoint at border junction',
                  'Non-functional solar borehole beside ward market',
                  'Collapsed washout on Offa–Ilemona feeder route',
                ]),
                ...jitteredPoint(r, lgaCode),
                accuracyMetres: Math.round(4 + r() * 20),
                capturedAt: new Date(issued + (lagHours + 15 + r() * 68) * 3_600_000).toISOString(),
              }
            : undefined,
        });
      }
    }
  }

  return { acks, completions };
}
