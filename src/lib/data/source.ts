/**
 * Data source resolution.
 *
 * The platform runs in one of two modes, decided by whether Supabase credentials are present:
 *
 *   `seed` — deterministic generated data. Everything carries simulated provenance, the publish
 *            guards refuse it, and the UI badges it. This is what the demo runs on.
 *   `live` — the Supabase backend. Real roster, real submissions, real provenance.
 */

export type DataMode = 'seed' | 'live';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const dataMode: DataMode = url && anonKey ? 'live' : 'seed';

export const isLive = dataMode === 'live';
export const isSeeded = dataMode === 'seed';

export function describeDataMode(): string {
  return isLive
    ? 'Live — reading from Supabase'
    : 'Seeded — deterministic generated data, not publishable';
}

export function assertLive(operation: string): void {
  if (!isLive) {
    throw new Error(
      `Refusing to ${operation} in seed mode. Configure NEXT_PUBLIC_SUPABASE_URL and ` +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY to run against the live backend.'
    );
  }
}

export const supabaseConfig = { url, anonKey } as const;
