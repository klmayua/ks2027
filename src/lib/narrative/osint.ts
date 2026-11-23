/**
 * Narrative monitoring and response — M3 (Kwara South Senatorial District).
 *
 * Scope is fixed in the type system: `SourceKind` admits only public broadcast surfaces and the
 * campaign's own field reporting. Responses carry a mandatory approval record via `assertSendable`.
 */

import { FEDERAL_CONSTITUENCIES, type FederalConstituencyId } from '@/lib/geography';

export type SourceKind =
  | 'news'
  | 'radio'
  | 'social_public'
  | 'field_report'
  | 'official_statement';

export const SOURCE_LABELS: Record<SourceKind, string> = {
  news: 'News',
  radio: 'Radio',
  social_public: 'Public social',
  field_report: 'Field report',
  official_statement: 'Official statement',
};

/**
 * Languages spoken across Kwara South's 7 LGAs.
 * Yoruba (Offa, Igbomina, Ekiti/Ibolo) dominates radio and town-hall discourse; Fulfulde matters
 * directly in rural pastoralist corridors across Ifelodun, Ekiti, and Oke-Ero.
 */
export type Language = 'yo' | 'en' | 'pcm' | 'ful';

export const LANGUAGE_LABELS: Record<Language, string> = {
  yo: 'Yoruba (Igbomina / Offa / Ekiti)',
  en: 'English',
  pcm: 'Nigerian Pidgin',
  ful: 'Fulfulde',
};

export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface Mention {
  id: string;
  sourceKind: SourceKind;
  sourceName: string;
  url?: string;
  language: Language;
  excerpt: string;
  sentiment: Sentiment;
  confidence: number;
  topicId: string;
  constituencyId?: FederalConstituencyId;
  lgaCode?: string;
  observedAt: string;
  claimId?: string;
}

export interface Topic {
  id: string;
  label: string;
  origin: 'campaign' | 'opponent' | 'organic';
}

export type ClaimStatus =
  | 'monitoring'
  | 'verifying'
  | 'response_drafted'
  | 'response_approved'
  | 'responded'
  | 'conceded'
  | 'dormant';

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  monitoring: 'Monitoring',
  verifying: 'Verifying',
  response_drafted: 'Response drafted',
  response_approved: 'Approved',
  responded: 'Responded',
  conceded: 'Conceded',
  dormant: 'Dormant',
};

export interface Claim {
  id: string;
  statement: string;
  status: ClaimStatus;
  firstSeenAt: string;
  firstSeenSource: string;
  dailyMentions: number[];
  constituencyIds: FederalConstituencyId[];
  languages: Language[];
  assessment: 'false' | 'misleading' | 'unverified' | 'substantially_true';
  responseId?: string;
}

export function velocity(claim: Claim): number {
  const d = claim.dailyMentions;
  if (d.length < 2) return 0;
  const recent = d.slice(-2).reduce((a, b) => a + b, 0) / 2;
  const earlier = d.slice(0, -2);
  const base = earlier.length ? earlier.reduce((a, b) => a + b, 0) / earlier.length : 1;
  return base === 0 ? recent : recent / base;
}

export function totalMentions(claim: Claim): number {
  return claim.dailyMentions.reduce((a, b) => a + b, 0);
}

export type ResponseChannel =
  | 'press_statement'
  | 'radio_script'
  | 'ward_talking_points'
  | 'social_post';

export const CHANNEL_LABELS: Record<ResponseChannel, string> = {
  press_statement: 'Press statement',
  radio_script: 'Radio script',
  ward_talking_points: 'Ward talking points',
  social_post: 'Social post',
};

export interface Approval {
  byName: string;
  byRole: string;
  at: string;
  note?: string;
}

export interface Response {
  id: string;
  claimId: string;
  channel: ResponseChannel;
  language: Language;
  draft: string;
  citations: string[];
  draftedBy: 'ai_assisted' | 'human';
  approval?: Approval;
  sentAt?: string;
}

export function assertSendable(response: Response): Response {
  if (!response.approval) {
    throw new Error(
      `Refusing to send response ${response.id}: no recorded human approval. ` +
        'AI-assisted drafts require named sign-off before they reach any audience.'
    );
  }
  return response;
}

export function isSendable(response: Response): boolean {
  return Boolean(response.approval);
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  net: number;
}

export function breakdown(mentions: Mention[]): SentimentBreakdown {
  const b = { positive: 0, neutral: 0, negative: 0 };
  for (const m of mentions) b[m.sentiment] += 1;
  const total = mentions.length;
  return {
    ...b,
    total,
    net: total ? (b.positive - b.negative) / total : 0,
  };
}

export function byConstituency(
  mentions: Mention[]
): { constituencyId: FederalConstituencyId; breakdown: SentimentBreakdown }[] {
  return FEDERAL_CONSTITUENCIES.map((fc) => ({
    constituencyId: fc.id,
    breakdown: breakdown(mentions.filter((m) => m.constituencyId === fc.id)),
  }));
}

export function byLanguage(mentions: Mention[]): { language: Language; count: number }[] {
  const counts = new Map<Language, number>();
  for (const m of mentions) counts.set(m.language, (counts.get(m.language) ?? 0) + 1);
  return [...counts.entries()]
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);
}

export function lowConfidence(mentions: Mention[], threshold = 0.65): Mention[] {
  return mentions.filter((m) => m.confidence < threshold);
}
