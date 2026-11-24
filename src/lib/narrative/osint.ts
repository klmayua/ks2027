/**
 * Narrative monitoring, OSINT topical relevance, recommendations, and response mechanism — M3 (Kwara South).
 *
 * Every monitored topic, tracked claim, and individual OSINT hit (`Mention`) carries:
 *   1. An explicit `TopicalRelevance` score (0–100) grounded in electoral weight, 72h velocity,
 *      swing sensitivity, and direct candidate exposure for the 2025–2027 Kwara South cycle.
 *   2. A mandatory `ResponseRecommendation` — guaranteeing zero unactionable hits.
 *   3. Named human approval gate (`assertSendable`) before outbound dispatch.
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

export type Language = 'yo' | 'en' | 'pcm' | 'ful';

export const LANGUAGE_LABELS: Record<Language, string> = {
  yo: 'Yoruba (Igbomina / Offa / Ekiti)',
  en: 'English',
  pcm: 'Nigerian Pidgin',
  ful: 'Fulfulde',
};

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type RelevanceTier = 'critical' | 'high' | 'elevated' | 'watch';

export const RELEVANCE_TIER_LABELS: Record<RelevanceTier, string> = {
  critical: 'Critical Relevance',
  high: 'High Relevance',
  elevated: 'Elevated',
  watch: 'Watch',
};

export interface TopicalRelevance {
  /** Composite topical relevance score for the 2027 Kwara South Senate cycle (0–100). */
  score: number;
  tier: RelevanceTier;
  /** Share of district electorate affected (0–100). */
  electoralWeight: number;
  /** Recency & 72h acceleration weight (0–100). */
  recencyMomentum: number;
  /** Impact on swing / SDP / ADC / undecided voters (0–100). */
  swingSensitivity: number;
  /** Direct exposure to Popoola vs. Adewoye vs. Oyedepo (0–100). */
  candidateExposure: number;
  /** Crisp 1-sentence reason why this topic matters right now. */
  whyItMattersNow: string;
  /** Verified 2025–2026 real-world event or press anchor. */
  verifiedContext: string;
  /** Primary target LGAs impacted. */
  impactedLgas: string[];
}

export type ResponsePosture = 'rebut' | 'clarify' | 'amplify' | 'concede' | 'monitor';

export const POSTURE_LABELS: Record<ResponsePosture, string> = {
  rebut: 'Rebut with evidence',
  clarify: 'Clarify proactively',
  amplify: 'Amplify & syndicate',
  concede: 'Concede & fix',
  monitor: 'Monitor — do not amplify',
};

export type ResponseUrgency = 'immediate_2h' | 'same_day_6h' | 'next_cycle_24h' | 'watch';

export const URGENCY_LABELS: Record<ResponseUrgency, string> = {
  immediate_2h: 'SLA: 2 hours',
  same_day_6h: 'SLA: 6 hours',
  next_cycle_24h: 'SLA: 24 hours',
  watch: 'Watchlist',
};

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

export const DISPATCH_TARGETS: Record<ResponseChannel, string> = {
  radio_script: 'Okin FM Offa · Harmony FM · Radio Kwara · Sobi FM desk',
  press_statement: 'Kwara South & national press correspondents (NUJ Ilorin)',
  ward_talking_points: 'All 83 Kwara South ward chairmen & liaison desks (KS2027 app)',
  social_post: 'Verified KS2027 PDP WhatsApp / TikTok / Facebook / X broadcast nodes',
};

/**
 * Structured recommendation attached to EVERY OSINT hit so analysts and principals immediately see
 * the recommended posture, channel, language, SLA, owner, citations, and starter draft.
 */
export interface ResponseRecommendation {
  posture: ResponsePosture;
  urgency: ResponseUrgency;
  channel: ResponseChannel;
  language: Language;
  ownerRole: string;
  angle: string;
  suggestedDraft: string;
  citations: string[];
}

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
  /** Topical relevance score (0–100) inherited & adjusted per hit. */
  relevanceScore: number;
  relevanceTier: RelevanceTier;
  whyRelevant: string;
  /** Mandatory on every OSINT hit — no hit appears without a response recommendation. */
  recommendation: ResponseRecommendation;
}

export interface Topic {
  id: string;
  label: string;
  origin: 'campaign' | 'opponent' | 'organic';
  relevance: TopicalRelevance;
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
  topicId: string;
  status: ClaimStatus;
  firstSeenAt: string;
  firstSeenSource: string;
  dailyMentions: number[];
  constituencyIds: FederalConstituencyId[];
  languages: Language[];
  assessment: 'false' | 'misleading' | 'unverified' | 'substantially_true';
  relevanceScore: number;
  relevanceTier: RelevanceTier;
  whyItMattersNow: string;
  verifiedAnchor: string;
  posture: ResponsePosture;
  urgency: ResponseUrgency;
  ownerRole: string;
  recommendedAngle: string;
  responseId: string;
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
  dispatchedTo?: string;
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

export const AVAILABLE_CITATIONS = [
  'KS-SEC-001 (Offa Neighbourhood Watch 2011–2013 Record)',
  'KS-RDS-002 (Ilorin–Omu-Aran–Kabba & Iloffa–Ekiti FERMA Brief)',
  'KS-GOV-008 (83 Ward Liaison Officers — NUJ News Keg Pledge)',
  'KS/DIR/2026/003 (Ifelodun–Irepodun 65% Field Surge)',
  '2023 INEC Omu-Aran Record (PDP+SDP 59,215 > APC 55,966)',
  'May 18, 2026 APC Primary Record (Ashiru 3rd-Place Fracture)',
  'Kwara South Dev. Forum 2026 Rural Displacement Brief',
  'March 2022 High Court Injunction (Justice Yusuf / Sec. 109)',
  'Galaxy TV / The Niche Public Reconciliation Transcript',
] as const;
