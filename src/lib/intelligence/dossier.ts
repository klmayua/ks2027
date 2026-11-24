/**
 * Candidate & Rivals Deep-Dive Dossier + Historical Kwara South PDP Legacy.
 *
 * Every factual claim in this module is grounded in published Nigerian press archives
 * (Vanguard, Punch, Premium Times, The Nation, ThisDay, Nigerian Tribune, Galaxy TV,
 * The Niche, FactualTimes) and INEC declarations (1999–2023 results & 2027 final list).
 * Strategic assessments ("who leads", tactical prescriptions) are explicitly typed as
 * war-room analysis built over those verified records.
 */

export interface HistoricalCycle {
  year: number;
  winner: string;
  party: 'PDP' | 'APC' | 'ANPP';
  runnerUp?: string;
  winnerVotes?: number;
  runnerUpVotes?: number;
  sdpVotes?: number;
  eraTag: string;
  significance: string;
  pdpLegacyNote: string;
  source: string;
}

export const KWARA_SOUTH_SENATE_HISTORY: HistoricalCycle[] = [
  {
    year: 1999,
    winner: 'Suleiman Makanjuola Ajadi',
    party: 'ANPP',
    eraTag: '4th Republic Opening',
    significance: 'Won on ANPP platform during Kwara’s initial Fourth Republic alignment.',
    pdpLegacyNote: 'Pre-consolidation cycle before the Saraki-led PDP statewide machine locked in.',
    source: 'INEC / 4th Republic archive',
  },
  {
    year: 2003,
    winner: 'Simon Ajibola (via June 2004 Tribunal)',
    party: 'PDP',
    runnerUp: 'Suleiman Makanjuola Ajadi (ANPP)',
    eraTag: 'PDP Takeover',
    significance:
      'Election Petition Tribunal nullified Ajadi’s initial return in June 2004 and swore in Simon Ajibola (PDP).',
    pdpLegacyNote:
      'Launched 15 continuous years of PDP senatorial incumbency across all 7 Kwara South LGAs (2004–2019).',
    source: 'Election Petition Tribunal / INEC archive',
  },
  {
    year: 2007,
    winner: 'Simon Ajibola',
    party: 'PDP',
    eraTag: 'PDP Hegemony',
    significance: 'Re-elected comfortably for a full mandate under Governor Bukola Saraki’s statewide PDP machine.',
    pdpLegacyNote:
      'Same administration in which Saheed Popoola entered state executive office as Commissioner for Youth & Sports (2008–2011).',
    source: 'INEC 2007 Senate declaration',
  },
  {
    year: 2011,
    winner: 'Simon Ajibola',
    party: 'PDP',
    runnerUp: 'Anu Ibiwoye (ACN) / Lola Ashiru (ACPN)',
    eraTag: '3-Term PDP Lock',
    significance:
      'Secured a historic 3rd term defeating ACN, ACPN (Lola Ashiru), and CPC contenders.',
    pdpLegacyNote:
      'Same year Saheed Popoola became Executive Chairman of Offa LGA (2011–2013) under the legacy PDP structure.',
    source: 'INEC 2011 Senate declaration',
  },
  {
    year: 2015,
    winner: 'Rafiu Adebayo Ibrahim',
    party: 'PDP',
    eraTag: '15-Year PDP Peak',
    significance:
      'Held the seat after Simon Ajibola ran for governor; rose to Chair Senate Committee on Banking, Insurance & Financial Institutions.',
    pdpLegacyNote:
      'Demonstrated deep structural PDP loyalty across Irepodun, Ifelodun, Offa, Oyun, Isin, Ekiti & Oke-Ero prior to the 2019 rupture.',
    source: 'INEC / 8th National Assembly record',
  },
  {
    year: 2019,
    winner: 'Oyelola Yisa Ashiru',
    party: 'APC',
    runnerUp: 'Rafiu Adebayo Ibrahim (PDP)',
    winnerVotes: 89_704,
    runnerUpVotes: 45_704,
    eraTag: '“O to ge” Wave Peak',
    significance:
      'Historic anti-dynasty uprising swept Kwara South into APC by +44,000 votes; Ashiru (ex-PDP), Popoola, and Oyedepo all fought on the O to ge side.',
    pdpLegacyNote:
      'Even at the height of O to ge, legacy PDP still retained 45,704 hard-floor votes in Kwara South.',
    source: 'INEC 2019 declaration (PM News / Premium Times)',
  },
  {
    year: 2023,
    winner: 'Oyelola Yisa Ashiru',
    party: 'APC',
    runnerUp: 'Rafiu Adebayo Ibrahim (PDP) + Prof. Wale Sulaiman (SDP)',
    winnerVotes: 55_966,
    runnerUpVotes: 34_950,
    sdpVotes: 24_265,
    eraTag: 'APC Contraction & Split Opposition',
    significance:
      'APC plunged -33,738 votes (-37.6%) from its 2019 peak. Combined PDP (34,950) + SDP (24,265) = 59,215 — beating APC by +3,249.',
    pdpLegacyNote:
      'Proves APC won 2023 ONLY because anti-APC votes split between PDP and SDP. Reunifying PDP + returning SDP (Popoola’s 2023 base) restores the historic majority.',
    source: 'INEC Omu-Aran Collation / Premium Times, Feb 2023',
  },
];

export type CandidateId = 'popoola' | 'adewoye' | 'oyedepo';

export interface TimelineEvent {
  period: string;
  role: string;
  detail: string;
  source: string;
}

export interface VulnerabilityItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'moderate';
  verifiedFact: string;
  opponentAttackAngle: string;
  counterPlay: string;
  source: string;
}

export interface AssetItem {
  title: string;
  detail: string;
  electoralValue: string;
  source: string;
}

export interface CandidateDossier {
  id: CandidateId;
  name: string;
  shortName: string;
  party: 'PDP' | 'APC' | 'ADC';
  partyFull: string;
  isPrincipal?: boolean;
  hometown: string;
  homeLgaCode: string;
  homeLgaName: string;
  culturalBloc: 'Ibolo' | 'Igbomina' | 'Ekiti-Kwara';
  profileLine: string;
  pdpLegacyRelation: string;
  education: string[];
  timeline: TimelineEvent[];
  corePitch2027: string[];
  assets: AssetItem[];
  vulnerabilities: VulnerabilityItem[];
  /** Relative ground strength across Kwara South's 7 LGAs (strategic assessment over verified base). */
  lgaFootprint: Record<string, { rating: 'strong' | 'competitive' | 'weak'; note: string }>;
  overallThreatOrEdge: string;
}

export const CANDIDATES: CandidateDossier[] = [
  {
    id: 'popoola',
    name: 'Hon. Popoola Adekeye Lekan Saheed',
    shortName: 'Saheed Popoola',
    party: 'PDP',
    partyFull: 'Peoples Democratic Party',
    isPrincipal: true,
    hometown: 'Obatiwajoye Compound, Offa',
    homeLgaCode: '13',
    homeLgaName: 'Offa',
    culturalBloc: 'Ibolo',
    profileLine:
      'Born Jan 17, 1971 · Trained builder/administrator · Ex-Commissioner (Youth & Sports), Ex-Offa LGA Chairman, 2-term Kwara Assembly member (Ojomu/Balogun).',
    pdpLegacyRelation:
      'Original PDP product (2008–2013 under Saraki/Ahmed) who returned home to PDP in late 2025/2026 with full Saraki endorsement AND brings his 2023 SDP grassroots constituency base back under one umbrella.',
    education: [
      'B.Sc. Political Science — Obafemi Awolowo University (OAU), Ile-Ife',
      'National Certificate of Education (NCE) — Delar College of Education, Idoosi, Ekiti State',
      'Trained builder & public administrator',
    ],
    timeline: [
      {
        period: '2008 – 2011',
        role: 'Kwara State Commissioner for Youth & Sports (PDP)',
        detail:
          'Served in the state executive cabinet under Governors Bukola Saraki and Abdulfatah Ahmed, building statewide youth & sports networks across all 16 LGAs.',
        source: 'Kwara State Executive Archive / Wikipedia',
      },
      {
        period: '2011 – 2013',
        role: 'Executive Chairman, Offa Local Government Area (PDP)',
        detail:
          'Deployed a registered community Neighbourhood Watch integrating youth, Yoruba & Fulani residents, and formal security agencies — still his strongest proof point in 2026.',
        source: 'ReportsNow / ThisDay / Vanguard',
      },
      {
        period: '2015 – 2022',
        role: 'Two-Term Member, Kwara State House of Assembly (Ojomu/Balogun)',
        detail:
          'Elected across the 8th and 9th Assemblies; notably the ONLY returning second-term lawmaker in the 9th Kwara Assembly after the 2019 O to ge sweep. Aligned with Minister Lai Mohammed’s APC faction.',
        source: 'Vanguard / The Informant247',
      },
      {
        period: '31 March 2022',
        role: 'Defection to SDP & Sec. 109(1)(g) Seat-Vacation Clash',
        detail:
          'Amid the Lai Mohammed vs. Gov. AbdulRazaq APC rift, Popoola defected to SDP. Speaker Yakubu Danladi Salihu (now APC’s 2027 Governorship candidate) declared his seat vacant despite Popoola obtaining a preemptive High Court injunction from Justice Yusuf.',
        source: 'Premium Times / TVC News / 21st Century Chronicle',
      },
      {
        period: 'Feb 2023',
        role: 'SDP House of Representatives Candidate (Ifelodun / Offa / Oyun)',
        detail:
          'Contested the 3-LGA federal constituency (41 wards, ~56% of Kwara South’s electorate) on SDP, losing to APC’s Tijani Kayode Ismail but locking in deep personal name recognition across Ifelodun, Offa, and Oyun.',
        source: 'NGElections / INEC 2023 archive',
      },
      {
        period: 'Late 2025 – 2026',
        role: 'Return to PDP, Public Saraki Reconciliation & 2027 Senate Nomination',
        detail:
          'Dumped APC citing worsening Kwara South banditry and road collapse; publicly apologized to Dr. Bukola Saraki for 2018–2019 political heat; emerged confirmed PDP Kwara South Senate flagbearer on INEC’s 2027 list.',
        source: 'Vanguard / Galaxy TV / The Niche / FactualTimes / INEC',
      },
    ],
    corePitch2027: [
      'Community Security First: Replicate his proven registered Offa Neighbourhood Watch across all 7 LGAs (Oke-Ero, Ifelodun, Isin, Oro) integrating youths, Fulani residents & police/military.',
      'Federal Road Rescue: Legislative & FERMA pressure on Iloffa–Ekiti, Ilorin–Omu-Aran–Egbe/Kabba, and Ajase-Ipo–Offa corridors.',
      'Safe-Farm Agriculture Revival: Secure rural farmlands so displaced Ifelodun & Oke-Ero farmers return to production.',
      '83 Ward Liaison Officers: Direct ward-level constituent desk bridging all 83 Kwara South wards to the National Assembly (NUJ News Keg commitment).',
    ],
    assets: [
      {
        title: 'Only Candidate Bridging Legacy PDP + 2023 SDP + Former O to ge Voters',
        detail:
          'Combining 2023 PDP (34,950) and 2023 SDP (24,265) yields 59,215 votes — already +3,249 ahead of APC’s 55,966. Popoola personally carried the SDP flag in Ifelodun/Offa/Oyun in 2023 and now carries PDP with Saraki’s backing.',
        electoralValue: 'Unlocks up to +20,000 coalition votes if harmonised',
        source: 'INEC 2023 declaration / FactualTimes',
      },
      {
        title: 'Proven Local-Government Security Execution (Not Just Manifesto Talk)',
        detail:
          'With late-2025/2026 kidnappings in Eruku, Owa-Onire, and Share–Oke-Ode dominating voter fear, Popoola is the only contender who actually built and ran a registered multi-ethnic neighbourhood watch as LGA Chairman.',
        electoralValue: 'Decisive contrast on #1 topical voter issue (Security)',
        source: 'ThisDay / NUJ News Keg Engagement Series',
      },
      {
        title: 'Direct Historical Foil to APC’s 2027 Ticket Top-of-Ballot',
        detail:
          'APC’s 2027 governorship candidate, Speaker Yakubu Danladi Salihu, is the exact official who defied a High Court injunction to declare Popoola’s seat vacant in March 2022 — giving Popoola an authentic anti-impunity underdog narrative.',
        electoralValue: 'Energises grassroots & aggrieved ex-APC / Lai Mohammed loyalists',
        source: 'Premium Times / TVC News',
      },
      {
        title: 'Deepest Local Political Street Credibility in Offa–Oyun–Ifelodun Core',
        detail:
          '20+ years in Kwara grassroots politics (Commissioner, LGA Chairman, 2-term Assembly, 2023 Reps runner across Ifelodun/Offa/Oyun).',
        electoralValue: 'Anchors Offa (173 PUs) & Oyun (108 PUs) immediately',
        source: 'Vanguard / Wikipedia',
      },
    ],
    vulnerabilities: [
      {
        id: 'v-pop-1',
        title: '2018–2019 Offa Bank Robbery Remarks & Saraki Reconciliation Clips',
        severity: 'critical',
        verifiedFact:
          'During the 2018–2019 O to ge heat, Popoola publicly linked Bukola Saraki to the Offa robbery; upon returning to PDP he openly apologized (Galaxy TV / The Niche), acknowledging the accusations were wrong.',
        opponentAttackAngle:
          'APC & ADC will splice 2018 video clips onto WhatsApp/TikTok to alienate both die-hard Saraki loyalists in Irepodun/Ifelodun and anti-Saraki O to ge voters in Offa.',
        counterPlay:
          'Inoculate early: frame the public apology as rare political courage and maturity — “he put Kwara South’s security and survival above 2018 bitterness.” Pair with joint Saraki–Popoola visuals in Irepodun & Ifelodun.',
        source: 'Galaxy TV / The Niche',
      },
      {
        id: 'v-pop-2',
        title: '4-Party Trajectory (“Cross-Carpeter” Label: PDP → APC → SDP → PDP)',
        severity: 'high',
        verifiedFact:
          'Moved from PDP to APC (O to ge), defected to SDP (March 2022) during the Lai Mohammed/AbdulRazaq split, and returned to PDP (late 2025/2026).',
        opponentAttackAngle:
          'Adewoye (APC) and Oyedepo (ADC) will brand him a serial party hopper seeking personal relevance.',
        counterPlay:
          'Anchor the counter-frame in policy consistency: he fought AbdulRazaq’s APC from inside over Kwara South neglect and insecurity (even losing his Assembly seat for it) and returned to the legacy PDP base where Kwara South won 4 straight Senate elections.',
        source: 'Premium Times / Vanguard',
      },
      {
        id: 'v-pop-3',
        title: 'Ibolo (Offa) vs. Igbomina/Ekiti Representation Deficit',
        severity: 'critical',
        verifiedFact:
          'Offa is 1 LGA (12 wards / 173 PUs), whereas Igbomina & Ekiti LGAs (Ifelodun, Irepodun, Isin, Oke-Ero, Ekiti) hold 60 wards and 626 PUs. Both Adewoye and Oyedepo actively harvest Igbomina identity.',
        opponentAttackAngle:
          '“Offa-only agenda” whisper campaign across Omu-Aran, Share, Oke-Ode, Isanlu-Isin, and Iloffa.',
        counterPlay:
          'Deploy visible Irepodun/Ifelodun campaign co-directors, publish the 83-ward liaison charter naming Igbomina ward officers upfront, and keep 65%+ of field & digital spend outside Offa.',
        source: 'INEC Kwara South Geography / The Informant247',
      },
      {
        id: 'v-pop-4',
        title: '2018 Kwara Assembly Committee Petition Archive',
        severity: 'moderate',
        verifiedFact:
          'In 2018, Kwara Assembly committees moved to investigate certificate/dud-cheque petitions against Popoola before a Kwara State High Court restrained the House pending substantive determination.',
        opponentAttackAngle:
          'Late-stage dirty-tricks smear drop 14 days before January 16, 2027 to dampen urban/elite turnout.',
        counterPlay:
          'Keep pre-cleared legal dossier and court order summary in the Legal Adviser’s rapid-response folder; never amplify unprompted, rebut in <2h only if weaponized.',
        source: 'Punch / Vanguard (2018 archive)',
      },
    ],
    lgaFootprint: {
      '13': { rating: 'strong', note: 'Home LGA (Offa); ex-Chairman & 2-term Assemblyman — high personal floor, must defend against Ashiru/APC cash.' },
      '15': { rating: 'strong', note: 'Oyun (Ibolo sister LGA); contested in 2023 Reps race, strong PDP/SDP carryover.' },
      '05': { rating: 'competitive', note: 'Ifelodun (236 PUs, largest LGA); 2023 Reps name recognition + banditry anger favours challenger IF ward reconciliation & turnout lift happen.' },
      '09': { rating: 'competitive', note: 'Irepodun (158 PUs); Saraki’s 2026 tour rebuilt momentum, but APC Adewoye & ADC Oyedepo fiercely contest Omu-Aran/Oro.' },
      '10': { rating: 'weak', note: 'Isin (80 PUs); Oyedepo’s home LGA (Isanlu-Isin) AND Adewoye’s top APC primary LGA — damage containment zone.' },
      '14': { rating: 'competitive', note: 'Oke-Ero (76 PUs); Eruku abduction outrage creates massive anti-APC opening for Popoola’s security manifesto.' },
      '04': { rating: 'competitive', note: 'Ekiti (76 PUs); Iloffa–Ekiti federal road decay drives anti-incumbent anger; needs ward agent lock-in.' },
    },
    overallThreatOrEdge:
      'Strongest grassroots retail politician & only bridge unifying historic PDP + 2023 SDP + anti-AbdulRazaq dissidents — wins IF Igbomina reach, ADC containment, and Osun-grade digital PU defence are executed.',
  },
  {
    id: 'adewoye',
    name: 'Prince Olalekan Adewoye',
    shortName: 'Lekan Adewoye',
    party: 'APC',
    partyFull: 'All Progressives Congress',
    hometown: 'Kwara South (Strongest Primary Base: Isin / Igbomina Axis)',
    homeLgaCode: '10',
    homeLgaName: 'Isin / Igbomina',
    culturalBloc: 'Igbomina',
    profileLine:
      'Industrialist (30+ yrs steel/manufacturing, MAN-linked) & philanthropist · Won May 18, 2026 11-aspirant APC primary (65,256 declared votes), unseating Sen. Lola Ashiru.',
    pdpLegacyRelation:
      'Zero legacy PDP structure roots; represents corporate/philanthropic fresh-face politics backed by outgoing Gov. AbdulRahman AbdulRazaq’s APC state apparatus.',
    education: [
      'Private-sector industrialist & corporate executive (30+ years in steel & manufacturing)',
      'Manufacturers Association of Nigeria (MAN) industry network & philanthropic foundation founder',
    ],
    timeline: [
      {
        period: 'Pre-2025',
        role: 'Steel & Manufacturing Industrialist / Foundation Philanthropist',
        detail:
          'Built 30+ year corporate profile and ran a personal grassroots welfare & youth empowerment foundation across Kwara South before seeking elective office.',
        source: 'Vanguard / ThisDay',
      },
      {
        period: '18 May 2026',
        role: 'Landslide Winner, APC Kwara South Senatorial Primary',
        detail:
          'Defeated 10 rivals — including incumbent Deputy Senate Leader Sen. Lola Ashiru (who finished 3rd after an aborted governorship push) — polling 65,256 declared primary votes with his highest tally in Isin LGA.',
        source: 'The Nation / HolisticInfos / Punch',
      },
      {
        period: 'Mid–Late 2026',
        role: 'APC Flagbearer Campaign & NUJ Media Parliament',
        detail:
          'Campaigning heavily on state police, legislative protection for indigenous investors/SMEs, youth job creation, and rural security.',
        source: 'The Nation / Guardian / Punch',
      },
    ],
    corePitch2027: [
      'State police & stronger federal-state security architecture to protect rural farmers and investors.',
      'Industrialist-led legislation shielding indigenous manufacturers, SMEs, and youth entrepreneurship.',
      'Continuity with APC federal & state patronage channels (paired with Speaker Yakubu Danladi Salihu’s APC gov ticket).',
    ],
    assets: [
      {
        title: 'Deepest Private War Chest + Sitting State/Federal Incumbency Machinery',
        detail:
          '30-year industrialist funding capacity backed by Gov. AbdulRazaq’s sitting state government, LGA chairmen, and federal party alignment.',
        electoralValue: 'Dominant cash & state-logistics advantage on poll day unless neutralised by digital PU defence',
        source: 'Vanguard / ThisDay',
      },
      {
        title: '“Clean Technocrat / Non-Career Politician” Appeal',
        detail:
          'No prior electoral baggage, no party-switching history, and strong philanthropic goodwill across Igbomina communities.',
        electoralValue: 'Appeals to middle-class, business & undecided voters fatigued by career politicians',
        source: 'ThisDay / Punch',
      },
      {
        title: 'Strong Igbomina Primary Mandate (Highest Tally in Isin)',
        detail:
          'Swept an 11-aspirant field with broad primary structure across Isin, Irepodun, and Ifelodun.',
        electoralValue: 'Starts ahead in Igbomina APC ward networks',
        source: 'HolisticInfos / The Informant247',
      },
    ],
    vulnerabilities: [
      {
        id: 'v-ade-1',
        title: 'Bitter May 2026 Post-Primary Fracture (Sen. Lola Ashiru & 10 Defeated Aspirants)',
        severity: 'critical',
        verifiedFact:
          'Incumbent Senator & Deputy Senate Leader Lola Ashiru (Offa) was humiliated in 3rd place in the May 18, 2026 primary alongside 9 other defeated aspirants.',
        opponentAttackAngle:
          'Ashiru’s loyalists across Offa, Oyun, and Irepodun feel betrayed by the state governor’s succession machine — ripe for silent defection or sit-at-home protest.',
        counterPlay:
          'Popoola’s reconciliation desk MUST run quiet bilateral outreach to Ashiru ward coordinators in Offa/Irepodun/Ifelodun (even passive neutrality strips 6,000–10,000 votes off APC).',
        source: 'The Nation / Punch (May 2026)',
      },
      {
        id: 'v-ade-2',
        title: 'Incumbent APC Liability on Kwara South Banditry & Collapsed Federal Roads',
        severity: 'critical',
        verifiedFact:
          'APC has held both Kwara State Government AND the Kwara South Senate seat since 2019 — yet 2025–2026 brought Eruku church abductions, Owa-Onire displacements, and highway blockades on Ilorin–Omu-Aran–Kabba.',
        opponentAttackAngle:
          'Tie Adewoye directly to 8 years of APC control: “If APC couldn’t secure Eruku, Ifelodun farms, or fix Omu-Aran–Kabba in 8 years, why reward them with 4 more?”',
        counterPlay:
          'Pin every security & road OSINT hit directly onto APC’s 2019–2026 record.',
        source: 'FIJ / Premium Times / Channels TV',
      },
      {
        id: 'v-ade-3',
        title: 'Kwara South Governorship Snub (APC Ticket Zoned to Kwara North)',
        severity: 'high',
        verifiedFact:
          'APC handed its 2027 governorship ticket to Speaker Yakubu Salihu Danladi (Kwara North), ending Kwara South’s governorship aspirations inside APC.',
        opponentAttackAngle:
          'Kwara South APC stakeholders have lower emotional urgency to turn out for a Kwara North top-of-ticket.',
        counterPlay:
          'Exploit ticket-splitting: urge Kwara South voters who feel sidelined by APC zoning to assert district leverage via Popoola in the Senate.',
        source: 'Premium Times / Tribune (2026)',
      },
    ],
    lgaFootprint: {
      '10': { rating: 'strong', note: 'Isin — recorded highest vote share in May 2026 APC primary.' },
      '09': { rating: 'strong', note: 'Irepodun — strong APC LGA machinery & philanthropy visibility.' },
      '05': { rating: 'competitive', note: 'Ifelodun — holds LGA structure, but badly bruised by Owa-Onire/Share–Oke-Ode banditry anger.' },
      '13': { rating: 'competitive', note: 'Offa — weakened by Lola Ashiru’s May 2026 primary humiliation.' },
      '15': { rating: 'competitive', note: 'Oyun — contested; APC incumbency vs. Popoola’s 2023/local base.' },
      '14': { rating: 'weak', note: 'Oke-Ero — heavy incumbent backlash over Eruku abductions & Egbe–Eruku road.' },
      '04': { rating: 'competitive', note: 'Ekiti — federal road decay erodes APC floor despite state machinery.' },
    },
    overallThreatOrEdge:
      'Primary rival to beat: superior corporate cash + APC state apparatus, but carrying severe 8-year security/road baggage and an unhealed May 2026 Lola Ashiru primary wound.',
  },
  {
    id: 'oyedepo',
    name: 'Chief (Akogun) Iyiola Oyedepo',
    shortName: 'Akogun Oyedepo',
    party: 'ADC',
    partyFull: 'African Democratic Congress',
    hometown: 'Isanlu-Isin, Isin LGA',
    homeLgaCode: '10',
    homeLgaName: 'Isin',
    culturalBloc: 'Igbomina',
    profileLine:
      'Veteran lawyer (UI, UNILAG, BL), author & Akogun of Isanlu-Isin · Ex-3rd Republic Commissioner, Ex-Kwara Assembly Chief Whip, Ex-Kwara PDP Chairman & O to ge ideologue.',
    pdpLegacyRelation:
      'Former Kwara PDP State Chairman who broke fiercely with the Saraki dynasty (authored “Shonga and the Looting of Kwara State”) and led O to ge — now fishing for disillusioned anti-APC & ex-PDP reformers under ADC.',
    education: [
      'B.Sc. Political Science — University of Ibadan (UI)',
      'LL.B Law — University of Lagos (UNILAG); Barrister-at-Law (B.L., Nigerian Law School)',
      'Principal, Iyiola Oyedepo & Co; President/CEO, Nations Leadership Institute, Ilorin',
    ],
    timeline: [
      {
        period: 'Third Republic',
        role: 'Commissioner for Agriculture & Commissioner for Commerce (Kwara State)',
        detail: 'Served in Gov. Shaaba Lafiagi’s administration; later served as Chief Whip of the Kwara State House of Assembly.',
        source: 'Premium Times / Vanguard',
      },
      {
        period: 'Pre-2019',
        role: 'Former Kwara State PDP Chairman & Anti-Dynasty Author',
        detail:
          'Chaired Kwara PDP before authoring governance critiques (“Shonga and the Looting of Kwara State”, “Letters to the Emir”, “Twenty-One Political Lies in Nigeria”) and spearheading the 2019 O to ge movement.',
        source: 'Premium Times / Vanguard',
      },
      {
        period: '2026 – 2027',
        role: 'ADC Kwara South Senatorial Candidate',
        detail:
          'Confirmed on INEC’s 2027 final candidate list for ADC, pitching an ideological third-force protest alternative against both APC and Saraki-led PDP.',
        source: 'INEC 2027 List / Premium Times',
      },
    ],
    corePitch2027: [
      'Ideological accountability & anti-godfatherism (“neither AbdulRazaq’s APC nor Saraki’s PDP”).',
      'Constitutional & legal advocacy for Kwara South equity, agriculture, and moral governance.',
    ],
    assets: [
      {
        title: 'High Intellectual & Media Credibility on Kwara Radio/Press',
        detail:
          'Articulate lawyer, author, and veteran commentator who dominates Ilorin/Kwara South talk radio and elite civic forums.',
        electoralValue: 'Persuades educated, anti-establishment & civil-society voters',
        source: 'Premium Times',
      },
      {
        title: 'Deep Personal Respect in Isin & Igbomina Civic Circles',
        detail:
          'Holds the traditional title of Akogun of Isanlu-Isin with decades of grassroots recognition in Isin and neighbouring Ifelodun/Irepodun.',
        electoralValue: 'Guarantees a meaningful spoiler share in Isin & parts of Irepodun/Ifelodun',
        source: 'Premium Times',
      },
    ],
    vulnerabilities: [
      {
        id: 'v-oye-1',
        title: 'No 907-Polling-Unit Logistics or Election-Day Agent Network',
        severity: 'critical',
        verifiedFact:
          'ADC historically lacks full polling-unit agent coverage and turnout machinery across all 83 Kwara South wards compared to PDP and APC.',
        opponentAttackAngle:
          '“A vote for ADC cannot beat APC across 907 polling units — it only hands the Senate seat back to APC.”',
        counterPlay:
          'Run disciplined “Don’t Split the Change Vote” messaging in Isin, Irepodun, and Ifelodun — showing the exact 2023 math (PDP+SDP = 59,215 > APC 55,966).',
        source: 'INEC 2023 Senate collation math',
      },
      {
        id: 'v-oye-2',
        title: 'Anti-Saraki Ideological Framing Limits Coalition Reach',
        severity: 'high',
        verifiedFact:
          'His decades-long personal crusade against the Saraki political family caps his ability to win legacy PDP wards.',
        opponentAttackAngle:
          'Framed as fighting 2018 battles while 2026 Kwara South farmers face active kidnappers.',
        counterPlay:
          'Keep Popoola relentlessly focused on 2026 security, roads & ward liaison delivery — never get dragged into a 2018 ideological debate with Oyedepo.',
        source: 'Premium Times / Vanguard',
      },
    ],
    lgaFootprint: {
      '10': { rating: 'strong', note: 'Isin — hometown (Isanlu-Isin) & Akogun traditional stature.' },
      '09': { rating: 'competitive', note: 'Irepodun — elite/radio protest appeal; dangerous spoiler for PDP.' },
      '05': { rating: 'competitive', note: 'Ifelodun — pulls anti-APC & anti-Saraki protest votes.' },
      '13': { rating: 'weak', note: 'Offa — minimal polling-unit structure against Popoola & APC.' },
      '15': { rating: 'weak', note: 'Oyun — thin ward machinery.' },
      '14': { rating: 'weak', note: 'Oke-Ero — low structural presence.' },
      '04': { rating: 'weak', note: 'Ekiti — low structural presence.' },
    },
    overallThreatOrEdge:
      'DANGEROUS SPOILER, NOT LIKELY WINNER: Cannot sweep 907 PUs outright, but if ADC pulls 14,000+ anti-APC votes in Isin/Irepodun/Ifelodun, APC wins through the middle — just like SDP split 2023.',
  },
];

export interface GroundGameDimension {
  id: string;
  dimension: string;
  weight: 'decisive' | 'high' | 'medium';
  leader: CandidateId | 'contested';
  leaderLabel: string;
  popoolaScore: number; // 0-100 analytical ground-game index
  adewoyeScore: number;
  oyedepoScore: number;
  pdpLegacyAnchor: string;
  groundReality: string;
  whatPopoolaMustDo: string;
}

/**
 * Side-by-side ground-game audit across 8 decisive Kwara South battleground dimensions.
 * Clearly shows where Popoola LEADS (legacy PDP + SDP reunification + security record) vs.
 * where APC Adewoye or ADC Oyedepo currently hold the edge.
 */
export const GROUND_GAME_MATRIX: GroundGameDimension[] = [
  {
    id: 'gg-pdp-legacy',
    dimension: 'Historical Kwara South PDP Legacy & Old Structure',
    weight: 'decisive',
    leader: 'popoola',
    leaderLabel: 'Popoola (PDP) Leads',
    popoolaScore: 86,
    adewoyeScore: 18,
    oyedepoScore: 34,
    pdpLegacyAnchor:
      'PDP won 4 consecutive Kwara South Senate cycles (2004–2019: Simon Ajibola 3 terms + Rafiu Ibrahim 1 term) and still held 34,950 hard-floor votes in 2023.',
    groundReality:
      'Popoola is an original PDP alumnus (Commissioner 2008–2011, Offa Chairman 2011–2013) backed by Bukola Saraki’s 2026 Kwara South rebuilding tour. Oyedepo chaired PDP years ago but split violently from the base; Adewoye has zero legacy PDP roots.',
    whatPopoolaMustDo:
      'Reactivate dormant 2015/2019 PDP ward chairmen across all 83 wards and pair Saraki’s legacy loyalty with Popoola’s modern security agenda.',
  },
  {
    id: 'gg-sdp-reunify',
    dimension: '2023 SDP Protest Base Reunification (24,265 Votes)',
    weight: 'decisive',
    leader: 'popoola',
    leaderLabel: 'Popoola (PDP) Leads',
    popoolaScore: 82,
    adewoyeScore: 22,
    oyedepoScore: 48,
    pdpLegacyAnchor:
      'In 2023, PDP (34,950) + SDP (24,265) = 59,215 — beating APC (55,966) by +3,249. The anti-APC majority already exists on paper.',
    groundReality:
      'Popoola personally ran on SDP for Ifelodun/Offa/Oyun House of Reps in 2023, giving him unmatched trust with returning SDP ward coordinators. Oyedepo (ADC) is trying to poach that exact dissident pool.',
    whatPopoolaMustDo:
      'Formally fold returning 2023 SDP ward coordinators into PDP campaign committees in Ifelodun, Offa, Oyun & Irepodun before Dec 15 so ADC cannot peel them off.',
  },
  {
    id: 'gg-security',
    dimension: 'Security Execution Credibility (2025–2026 Banditry Crisis)',
    weight: 'decisive',
    leader: 'popoola',
    leaderLabel: 'Popoola (PDP) Leads',
    popoolaScore: 84,
    adewoyeScore: 46,
    oyedepoScore: 52,
    pdpLegacyAnchor:
      'Popoola built & operated Offa’s registered Neighbourhood Watch (2011–2013) under the old PDP local government structure — a verifiable track record.',
    groundReality:
      'Late-2025 Eruku church abductions and 2026 Owa-Onire/Share–Oke-Ode displacements are the #1 kitchen-table issue in Kwara South. Adewoye talks state police, but APC owns 8 years of state & Senate incumbency.',
    whatPopoolaMustDo:
      'Publish the concrete 7-LGA Community Security Blueprint naming multi-ethnic youth/Fulani/police coordination and tour Eruku, Oke-Ode & Isanlu-Isin directly.',
  },
  {
    id: 'gg-igbomina',
    dimension: 'Igbomina & Ekiti Geographic Reach (5 LGAs · 60 Wards · 626 PUs)',
    weight: 'decisive',
    leader: 'adewoye',
    leaderLabel: 'Adewoye (APC) & Oyedepo (ADC) Edge Today',
    popoolaScore: 51,
    adewoyeScore: 78,
    oyedepoScore: 68,
    pdpLegacyAnchor:
      'Historically, PDP won Kwara South by dominating Ifelodun and Irepodun (both Igbomina) — Offa alone (173 PUs) can never win a 907-PU Senate district.',
    groundReality:
      'Adewoye polled highest in Isin during the May 2026 APC primary and carries Igbomina elite networks; Oyedepo is Akogun of Isanlu-Isin. Popoola (Offa/Ibolo) faces an active “Offa-only” whisper campaign.',
    whatPopoolaMustDo:
      'MANDATORY: Allocate 65%+ of field/digital spend to Ifelodun (236 PUs) & Irepodun (158 PUs), appoint visible Igbomina DG/deputies, and launch Saraki–Popoola joint Irepodun/Ifelodun rallies.',
  },
  {
    id: 'gg-ashiru-split',
    dimension: 'Grassroots Ward Machine & Post-Primary Cohesion',
    weight: 'high',
    leader: 'contested',
    leaderLabel: 'Contested (APC Fractured Post-May 2026)',
    popoolaScore: 68,
    adewoyeScore: 66,
    oyedepoScore: 28,
    pdpLegacyAnchor:
      'Old PDP ward machinery still has living muscle memory in every Kwara South ward, whereas APC just suffered its sharpest internal rupture since 2019.',
    groundReality:
      'APC has sitting LGA chairmen, BUT Sen. Lola Ashiru’s humiliating 3rd-place defeat in May 2026 (plus 9 other losing aspirants) fractured APC’s Offa/Kwara South base. PDP’s own reconciliation (legacy PDP + returning SDP) is mid-flight.',
    whatPopoolaMustDo:
      'Close all open PDP reconciliation files (especially Ifelodun/Irepodun) AND quietly recruit aggrieved Ashiru ward coordinators into neutrality or silent support.',
  },
  {
    id: 'gg-warchest',
    dimension: 'Funding, Patronage & State/Federal Weight',
    weight: 'high',
    leader: 'adewoye',
    leaderLabel: 'Adewoye (APC) Leads Heavily',
    popoolaScore: 54,
    adewoyeScore: 91,
    oyedepoScore: 31,
    pdpLegacyAnchor:
      'When PDP held Kwara Government House (2003–2019), state patronage locked polling units; today APC holds that exact lever.',
    groundReality:
      'Adewoye combines a 30-year steel/manufacturing fortune with Gov. AbdulRazaq’s sitting state apparatus and federal backing — an overwhelming cash/patronage advantage on traditional ground terms.',
    whatPopoolaMustDo:
      'Do NOT try to out-spend APC naira-for-naira on vote-buying. Neutralise cash the exact way Osun August 2026 beat federal might: tracked turnout + 907-PU real-time photo capture.',
  },
  {
    id: 'gg-spoiler',
    dimension: 'Anti-Establishment / Intellectual Protest Insulation',
    weight: 'high',
    leader: 'oyedepo',
    leaderLabel: 'Oyedepo (ADC) Spoiler Threat',
    popoolaScore: 58,
    adewoyeScore: 49,
    oyedepoScore: 76,
    pdpLegacyAnchor:
      'Every time Kwara South’s anti-APC vote fragments (2023: PDP 34.9k + SDP 24.2k), APC slips through the middle.',
    groundReality:
      'Akogun Oyedepo commands radio airtime and anti-dynasty moral appeal in Isin, Irepodun & Ifelodun. If he takes 15,000+ anti-APC votes, Popoola loses even with high APC disapproval.',
    whatPopoolaMustDo:
      'Run disciplined “Tactical Unity” messaging in Isin/Irepodun/Ifelodun proving ADC lacks 907-PU reach and that splitting the vote hands Adewoye a free victory.',
  },
  {
    id: 'gg-digital',
    dimension: 'Digital Command, Narrative Velocity & Live 907-PU Defence',
    weight: 'decisive',
    leader: 'contested',
    leaderLabel: 'Open Tie-Breaker (First-Mover Wins)',
    popoolaScore: 62,
    adewoyeScore: 52,
    oyedepoScore: 38,
    pdpLegacyAnchor:
      'Old PDP relied on analog ward captains; 2027 Kwara South requires marrying that legacy PDP ward network with an Osun-2026-grade real-time digital nervous system.',
    groundReality:
      'No camp has yet locked live photo-tabulation across all 907 Kwara South PUs or multi-language WhatsApp/TikTok/radio rapid response. Meanwhile 2018 clips & party-switch confusion threaten PDP if left unguarded.',
    whatPopoolaMustDo:
      'Deploy the KS2027 Digital Wave system across all 907 PUs before Dec 2026: real-time result capture, 4-language narrative drops, youth/diaspora turnout tracking & <15-min incident command.',
  },
];

export function getCandidate(id: CandidateId): CandidateDossier {
  return CANDIDATES.find((c) => c.id === id) ?? CANDIDATES[0];
}
