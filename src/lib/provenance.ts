/**
 * Provenance — the enforcement mechanism for the platform's first design rule:
 *
 *   No number renders without a source record.
 *
 * Every figure that reaches a screen is carried as a `Sourced<T>`, so the type system makes an
 * unsourced statistic impossible to construct by accident. Simulated values are representable, but
 * they are a distinct variant and the UI is required to badge them.
 */

export type Provenance =
  | {
      kind: 'official';
      publisher: string;
      document: string;
      revision: string;
      url?: string;
      staleness?: string;
    }
  | {
      kind: 'submission';
      submissionId: string;
      submittedBy: string;
      submittedAt: string;
      wardId?: string;
      location?: { lat: number; lng: number; accuracyMetres: number };
    }
  | {
      kind: 'derived';
      formula: string;
      inputs: Provenance[];
    }
  | {
      kind: 'document';
      title: string;
      url: string;
      publishedAt: string;
    }
  | {
      kind: 'simulated';
      scenario: string;
      seed: string;
    };

export interface Sourced<T> {
  readonly value: T;
  readonly provenance: Provenance;
}

export function sourced<T>(value: T, provenance: Provenance): Sourced<T> {
  return { value, provenance };
}

export function isSimulated(p: Provenance): boolean {
  if (p.kind === 'simulated') return true;
  if (p.kind === 'derived') return p.inputs.some(isSimulated);
  return false;
}

export function stalenessOf(p: Provenance): string | null {
  if (p.kind === 'official') return p.staleness ?? null;
  if (p.kind === 'derived') {
    for (const input of p.inputs) {
      const s = stalenessOf(input);
      if (s) return s;
    }
  }
  return null;
}

export function describeProvenance(p: Provenance): string {
  switch (p.kind) {
    case 'official':
      return `${p.publisher} — ${p.document} (${p.revision})`;
    case 'submission':
      return `Field submission by ${p.submittedBy}, ${new Date(p.submittedAt).toLocaleString('en-NG')}`;
    case 'derived':
      return `Computed: ${p.formula}`;
    case 'document':
      return `${p.title} (${p.publishedAt})`;
    case 'simulated':
      return `Simulated — scenario "${p.scenario}", seed ${p.seed}`;
  }
}

/**
 * Guard for anything crossing into the public ledger. Simulated values must never be published,
 * so the publish path calls this and throws rather than rendering a fabricated figure.
 */
export function assertPublishable<T>(s: Sourced<T>, context: string): Sourced<T> {
  if (isSimulated(s.provenance)) {
    throw new Error(
      `Refusing to publish simulated value in ${context}: ${describeProvenance(s.provenance)}`
    );
  }
  return s;
}

/** Convenience builder for values that trace to the bundled INEC directory. */
export const INEC_PU_DIRECTORY_2015: Provenance = {
  kind: 'official',
  publisher: 'Independent National Electoral Commission (INEC)',
  document: 'Directory of Polling Units — Kwara State (Kwara South extract)',
  revision: 'January 2015',
  url: 'https://inecnigeria.org/wp-content/uploads/2019/02/PU_Directory_Revised_January_2015_Kwara.pdf',
  staleness:
    'Ward-level polling unit enumeration predates the 2021 INEC expansion (682 enumerated vs 907 ' +
    'current Kwara South total) and must be reconciled against the current INEC directory.',
};
