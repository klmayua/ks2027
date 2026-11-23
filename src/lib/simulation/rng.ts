/**
 * Deterministic generation primitives shared by every KS2027 seed module.
 *
 * Same seed, same output, across runtimes — so a demo never reshuffles between rehearsal and the
 * pitch room, and every figure stays reproducible.
 */

export function rng(seedText: string): () => number {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];

export function weighted<T extends string>(r: () => number, table: [T, number][]): T {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let n = r() * total;
  for (const [value, w] of table) {
    n -= w;
    if (n <= 0) return value;
  }
  return table[table.length - 1][0];
}

export function shuffle<T>(r: () => number, xs: readonly T[]): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Name pools reflecting Kwara South's communities across Offa, Igbomina, Ekiti, and Oyun.
export const FIRST_NAMES = [
  'Adebayo', 'Adewale', 'Aishat', 'Aminat', 'Ayo', 'Bamidele', 'Bilikisu', 'Biodun',
  'Bukola', 'Damilola', 'Fatimah', 'Folake', 'Femi', 'Funke', 'Gbenga', 'Ibrahim',
  'Jide', 'Kayode', 'Kehinde', 'Kunle', 'Lukman', 'Mariam', 'Mufutau', 'Olusegun',
  'Opeyemi', 'Rasheed', 'Sadiat', 'Sikiru', 'Sulaiman', 'Taiwo', 'Tope', 'Tunde',
  'Wale', 'Yinka', 'Yusuf', 'Zainab',
];

export const SURNAMES = [
  'Adebayo', 'Adebiyi', 'Adekeye', 'Adeleke', 'Adeoye', 'Adesina', 'Adewumi', 'Ajayi',
  'Akande', 'Akinola', 'Alabi', 'Aremu', 'Arowolo', 'Babalola', 'Bamidele', 'Bello',
  'Dada', 'Fagbemi', 'Fashola', 'Ibrahim', 'Jimoh', 'Kolawole', 'Lawal', 'Ogunleye',
  'Ogunniyi', 'Ojo', 'Oladipo', 'Olanrewaju', 'Olawuyi', 'Olorunfemi', 'Omotosho', 'Salami',
  'Salihu', 'Sanni', 'Shittu', 'Yusuf',
];

export const personName = (r: () => number) => `${pick(r, FIRST_NAMES)} ${pick(r, SURNAMES)}`;

/** Approximate GPS centroids for Kwara South's 7 LGAs. */
export const LGA_ANCHORS: Record<string, [number, number]> = {
  '04': [8.1667, 5.2000], // Ekiti (Araromi-Opin)
  '05': [8.5500, 4.9000], // Ifelodun (Share / Oke-Ode)
  '09': [8.3167, 4.8000], // Irepodun (Omu-Aran)
  '10': [8.3000, 5.0500], // Isin (Owu-Isin / Osi)
  '13': [8.1500, 4.7167], // Offa
  '14': [8.1000, 5.1500], // Oke-Ero (Iloffa)
  '15': [8.2167, 4.7500], // Oyun (Ilemona / Erin-Ile)
};

export function jitteredPoint(
  r: () => number,
  lgaCode: string,
  spreadDegrees = 0.08
): { lat: number; lng: number } {
  const [lat, lng] = LGA_ANCHORS[lgaCode] ?? [8.25, 4.88];
  return {
    lat: Number((lat + (r() - 0.5) * spreadDegrees).toFixed(5)),
    lng: Number((lng + (r() - 0.5) * spreadDegrees).toFixed(5)),
  };
}
