---
name: forthepeople-district-expansion
description: "Skill for expanding ForThePeople.in to new districts. Use when adding Bengaluru Urban, Mysuru, or any new Indian district to the platform. Triggers: 'add district', 'expand to Bangalore', 'expand to Mysore', 'unlock district', 'new city', 'seed data for district', 'add Bengaluru', 'add Mysuru', 'district-specific modules', 'local industry module'. Covers: district hierarchy seeding, taluk data, unique local modules (IT parks for Bangalore, tourism/heritage for Mysore, sugar for Mandya), infrastructure projects seeding, famous personalities, leadership data, GeoJSON maps, scraper configuration, and AI news intelligence expansion."
---

# ForThePeople.in — District Expansion Skill

## Expansion Philosophy

The codebase is GENERIC. Every district uses the same 29 dashboard modules, same API routes, same UI components. Expanding to a new district requires:

1. **Database seeding** — Add State/District/Taluk/Village rows with `active: true`
2. **Data population** — Seed ALL 45+ Prisma models with real data for the new district
3. **Local industry adaptation** — The "Local Industries" module adapts per district (Sugar→Mandya, IT Parks→Bengaluru, Tourism/Heritage→Mysuru)
4. **GeoJSON maps** — District + taluk boundary files in `public/geo/`
5. **Scraper config** — Add district-specific RSS queries and portal URLs
6. **AI News Intelligence** — Automatically works for any active district (queries Google News RSS with district name)

## District: Bengaluru Urban

```
State:          Karnataka
District:       Bengaluru Urban (ಬೆಂಗಳೂರು ನಗರ)
Slug:           bengaluru-urban
Tagline:        "Silicon Valley of India"
Population:     ~12,765,000 (2026 est.)
Area:           741 sq km
Literacy:       88.48%
Sex Ratio:      916
Density:        ~17,230/sq km
Avg Rainfall:   860mm

Taluks (4):
  1. Bengaluru North (ಬೆಂಗಳೂರು ಉತ್ತರ) — "Gateway to the Airport"
  2. Bengaluru South (ಬೆಂಗಳೂರು ದಕ್ಷಿಣ) — "Heart of the Garden City"
  3. Bengaluru East (ಬೆಂಗಳೂರು ಪೂರ್ವ) — "IT Corridor Hub"
  4. Anekal (ಆನೇಕಲ್) — "Electronics City Gateway"

Assembly Constituencies (28): Yelahanka, KR Puram, Byatarayanapura, Yeshwanthpur, 
  Dasarahalli, Mahalakshmi Layout, Malleshwaram, Hebbal, Pulakeshinagar, 
  Sarvagnanagar, CV Raman Nagar, Shivajinagar, Shantinagar, Gandhi Nagar, 
  Rajaji Nagar, Govindraj Nagar, Vijayanagar, Chamarajpet, Chickpet, 
  Basavanagudi, Padmanabhanagar, BTM Layout, Jayanagar, Bommanahalli, 
  Anekal, Bangalore South (Lok Sabha)

Lok Sabha: Bangalore North, Bangalore Central, Bangalore South (3 MPs)
```

### Bengaluru UNIQUE Modules (adapt Local Industries)

```
LOCAL INDUSTRY = "IT & Startups" (not Sugar Factories)

Models to seed:
- IT Parks: Electronic City, Manyata Tech Park, Bagmane Tech Park, 
  Whitefield IT Hub, Embassy Tech Village, RMZ Ecoworld, Prestige Tech Park,
  Brigade Tech Park, International Tech Park (ITPB), Kirloskar Business Park
- Startup ecosystem: Number of startups, unicorns, funding data
- BBMP ward-wise budget data
- BMTC bus routes (300+ routes)
- Namma Metro routes (Purple + Green + extensions)
- Bengaluru Suburban Rail (4 corridors, 64 stations)
- Lakes: Ulsoor, Hebbal, Sankey, Bellandur, Varthur + restoration status
- Air Quality Index from CPCB stations
- Traffic congestion data
- Property tax collections (BBMP)

INFRASTRUCTURE PROJECTS (100+ to seed):
  MEGA PROJECTS:
  - Namma Metro Phase 2A (ORR Line, Silk Board→KR Puram, 19km, 13 stations)
  - Namma Metro Phase 2B (Airport Line, 36.4km, ~₹14,000 Cr)
  - Namma Metro Phase 3 (Sarjapur-Hebbal 36.6km + JP Nagar-Kempapura 32km)
  - Bengaluru Suburban Rail Project (148km, 64 stations, ₹15,767 Cr, K-RIDE)
  - Satellite Town Ring Road STRR (280km, ₹15,676 Cr, 12 towns)
  - Peripheral Ring Road / Bangalore Business Corridor (74km, 8-lane)
  - Twin Tunnel Hebbal to Silk Board (18km, ₹12,690 Cr)
  - Bengaluru-Chennai Expressway (258km, ₹17,930 Cr)
  - Bengaluru-Mysuru Expressway (118km, operational)
  - B-SMILE road program (₹7,000 Cr)
  - Second Airport proposal
  - AI City / Tech Hub
  - Elevated corridors (multiple)
  - Double-decker metro proposal
  
  ROAD PROJECTS:
  - Signal-free corridors (10+ ongoing)
  - Flyover constructions (20+ ongoing)
  - Grade separators
  - Underpass constructions
  - Road widening projects (100+ streets)
  - White-topping program
  
  WATER & DRAINAGE:
  - Cauvery Stage 5 water supply
  - Lake rejuvenation (Bellandur, Varthur, etc.)
  - Storm water drain upgrades
  - Sewage treatment plants (KC Valley, etc.)
  - Flood mitigation projects
  
  SMART CITY:
  - BBMP Smart City projects
  - LED street lighting
  - CCTV surveillance network
  - Digital governance portals
  - EV charging infrastructure

UNIQUE GOVERNANCE:
  - Greater Bengaluru Authority (GBA) replaced BBMP
  - BBMP budget: ₹19,000 Cr (2025-26)
  - BDA (Bengaluru Development Authority)
  - BMRCL (Metro Rail Corporation)
  - BWSSB (Water Supply & Sewerage Board)
  - BESCOM (electricity)
  - BMTC (bus transport)
  - BTP (Bengaluru Traffic Police)
```

## District: Mysuru

```
State:          Karnataka
District:       Mysuru (ಮೈಸೂರು)
Slug:           mysuru
Tagline:        "Cultural Capital of Karnataka"
Population:     ~3,200,000 (2026 est.)
Area:           6,854 sq km
Literacy:       72.56%
Sex Ratio:      981
Density:        ~467/sq km
Avg Rainfall:   785mm

Taluks (7):
  1. Mysuru (ಮೈಸೂರು) — "City of Palaces"
  2. Nanjangud (ನಂಜನಗೂಡು) — "Dakshina Kashi"
  3. T. Narasipura (ಟಿ.ನರಸೀಪುರ) — "Triveni Sangama"
  4. Hunsur (ಹುಣಸೂರು) — "Gateway to Nagarahole"
  5. H.D. Kote (ಎಚ್.ಡಿ.ಕೋಟೆ) — "Land of Forests & Wildlife"
  6. Periyapatna (ಪಿರಿಯಾಪಟ್ಟಣ) — "Coffee & Spice Country"
  7. K.R. Nagar (ಕೃಷ್ಣರಾಜನಗರ) — "KRS Dam's Home"

Assembly Constituencies (8): Chamaraja, Krishnaraja, Narasimharaja, 
  Chamundeshwari, Nanjangud, T. Narasipura, Hunsur, HD Kote, Periyapatna, KR Nagar

Lok Sabha: Mysuru-Kodagu (1 MP)
```

### Mysuru UNIQUE Modules

```
LOCAL INDUSTRY = "Heritage, Tourism & Manufacturing"

Models to seed:
- Heritage sites: Mysore Palace, Chamundi Hills, St. Philomena's Church,
  Mysore Zoo, Brindavan Gardens, Jaganmohan Palace, Lalitha Mahal
- Tourism economy: Dasara festival stats, tourist footfall, hotel occupancy
- Mysore Sandal Soap (KSDL), Mysore Silk (KSIC), Mysore Pak
- Manufacturing: Frauscher Sensor Technology hub, BEML, Mysore Paints,
  Wipro GE Healthcare, Infosys Mysore Campus (world's largest training)
- MMLP Kadakola (Multi-Modal Logistics Park, ₹102 Cr)
- STPI Mysore (Software Technology Park)
- KRS Dam & Brindavan Gardens (shared with Mandya)

INFRASTRUCTURE PROJECTS:
  MEGA:
  - "New Mysuru" 5-pillar transformation plan
  - Mysuru Peripheral Ring Road (105.3km, DPR stage, ~2026-27)
  - Outer Ring Road improvements (42.5km)
  - Mysore-Chennai High Speed Rail (435km corridor)
  - Mysore Airport expansion
  - Mysuru Rapid Metro proposal
  - ₹2,578 Cr development package (CM's projects)
  
  ROADS:
  - ₹393 Cr road concreting (12 major arterials)
  - Bengaluru-Mysuru Expressway connectivity links
  - Ring Road signal improvements (35 new signals)
  - City road widening projects
  
  HEALTH:
  - 100-bed Nephro-Urology Hospital (₹117.71 Cr)
  - Jayadeva Hospital expansion
  - District Hospital upgrades
  
  INDUSTRIAL:
  - Hebbal Industrial Area expansion
  - Nanjangud Industrial Area upgrades
  - KIADB SEZ developments
  - Frauscher global manufacturing hub (155,000 sqft)
  
  WATER:
  - Kabini Dam management
  - KRS Dam (shared with Mandya)
  - Vani Vilas Sagar
  - City water supply augmentation
  - UGD (Underground Drainage) expansion
  
  RAILWAY:
  - Ashokapuram Railway Station yard remodelling (₹30.42 Cr)
  - New platforms 4 & 5
  - MMLP railway goods shed connectivity
  
  GOVERNANCE:
  - CESC (Chamundeshwari Electricity Supply Corp)
  - MCC (Mysuru City Corporation) — ₹380 Cr projects
  - MDA (Mysore Development Authority) replacing MUDA
  - Mysuru Urban Development Authority (MUDA)

UNIQUE DATA:
  - Dasara festival budget & attendance
  - Tourist footfall monthly
  - Heritage site revenue
  - Cleanest city rankings (Mysuru won multiple times)
  - Coffee/spice production (Periyapatna, HD Kote)
  - Wildlife corridor data (Nagarahole, Bandipur proximity)
  - University data (University of Mysore, JSS, SJCE)
```

## News-Driven Modules (No Manual Seeding Required)

Two modules populate themselves from the news pipeline — they do **NOT**
need a seed file for a new district. They ship with `"Awaiting data"`
placeholders and fill in as soon as the hourly `scrape-news` cron runs:

### Infrastructure Tracker (`/infrastructure`)
- Schema: `InfraProject` + `InfraUpdate` timeline rows.
- Pipeline: NewsItem classified `module="infrastructure"` →
  `extractInfraFromNews()` (free-tier AI) → `verifyInfraExtraction()`
  (second free-tier pass) → `syncInfraFromNews()` fuzzy-upsert.
- NATIONAL-scope projects (Bullet Train, Vande Bharat, NH corridors)
  fan out to every active district automatically.
- STATE-scope projects fan out to all active districts in the matching
  state. DISTRICT-scope stays local.
- Per-cron extraction cap: **10 infra extractions / news-cron run**
  (enforced in `news-action-engine`, reset via
  `resetExtractionCounters()`).
- New-district onboarding (optional top-up):
  ```bash
  npx tsx -e "
    import './_env';
    import { onboardDistrictExams } from '@/lib/exam-onboard';
    // If you also want a bulk national-project clone, add a similar
    // infra-onboard helper or just wait one news-cron cycle.
  "
  ```
- Manual admin editing: available in the admin Content Editor
  (CONTENT_MODULES["infrastructure"]). Each admin save writes an
  `InfraUpdate` row with `updateType="ADMIN_EDIT"` so the public
  timeline records the provenance.
- Backfill legacy news: `npx tsx scripts/backfill-infra-from-news.ts --limit 10 [--dry-run]`
- Merge duplicates: `npx tsx scripts/dedup-infra-projects.ts --dry-run [--district <slug>]`
- Disclaimer banner is mandatory at the top of the page — never
  remove it.

### Exams Tracker (`/exams`)
- Schema: `GovernmentExam` (extended with news-driven fields).
- Pipeline: NewsItem classified `module="exams"` →
  `extractExamFromNews()` → `syncExamFromNews()` fuzzy upsert by
  `shortName` + first-three-word title match.
- NATIONAL exams (UPSC, SSC, IBPS, RRB) fan out to every active
  district.
- Daily status cron: `/api/cron/update-exams` advances status from
  calendar dates (APPLICATIONS_OPEN when within window, ADMIT_CARD_OUT,
  etc.) and flags `needsVerification=true` on rows stale >30 days.
- New-district onboarding: `onboardDistrictExams(districtId)` clones
  NATIONAL + matching STATE exams from other districts (deduped by
  `shortName`).
- Backfill: `npx tsx scripts/backfill-exams-from-news.ts --limit 10 [--dry-run]`

### AI cost guardrails (applies to BOTH modules)
- Use `purpose: "classify"` (free tier: `openai/gpt-oss-20b:free` with
  fallback chain to other free models).
- `purpose: "insight"` (Gemini 2.5 Pro) is only used for the lazy
  /api/data/infra-analysis endpoint, triggered by the user clicking
  "Generate AI Analysis". 24h Redis cache.
- try/catch around every extract/verify/sync call — one failure never
  aborts the news pipeline.

## Seeding Checklist (Per District)

```
For EACH new district, seed ALL of these:
□ State (if not exists) + District + Taluks + Villages
□ Leaders — uses the 5-tier hierarchy (T1 NATIONAL · T2 STATE · T3 DISTRICT
  ADMIN · T4 ELECTED REPS · T5 MUNICIPAL & DEPT). T1 (Modi/Murmu) and the
  state CM/Governor at T2 auto-populate via scripts/fix-all-districts-
  leadership.ts. T3 bureaucrats (Collector, SP, ZP CEO) need MANUAL
  verification per district — use "[Verify at <official portal>]" as the
  name when unsure rather than fabricating a name. T4 (MP + MLAs) and T5
  (Mayor / dept heads) seed from the state assembly + ECI source-of-truth,
  then the news pipeline auto-updates as transfers/elections happen.
□ Famous Personalities (15-25 real people with Wikipedia photos)
□ Infrastructure Projects — SKIP manual seeding; populated automatically
  by the news-driven pipeline (see "News-Driven Modules" section above).
  Optional: run scripts/backfill-infra-from-news.ts after going live.
□ Budget Data (department-wise, 3 fiscal years)
□ Revenue Collections (monthly, all categories)
□ Population History (1991, 2001, 2011, 2024 est.)
□ Rainfall History (2015-2025, monthly)
□ Police Stations (all stations with address, phone, SHO)
□ Crime Stats (5 years, category-wise)
□ Schools (all govt + aided schools with UDISE codes)
□ Government Offices (all offices with hours)
□ Election Results (last 3 elections — LS, Assembly, ZP)
□ Bus Routes (KSRTC + BMTC for Bangalore)
□ Train Schedules (all stations in district)
□ Dam/Reservoir data (relevant dams)
□ Schemes (Central + State + District specific)
□ Service Guides (certificates, land, transport)
□ RTI Templates (department-wise PIOs)
□ Citizen Tips (district-specific)
□ Local Alerts (current advisories)
□ Crop Prices (district mandis)
□ Weather (current + historical)
□ JJM Water Supply coverage
□ Housing Scheme (PMAY data)
□ Power/DISCOM info (BESCOM for Bangalore, CESC for Mysore)
□ Soil Health records
□ Court Stats (district court data)
□ Gram Panchayat data (for rural taluks)
□ GeoJSON files (district boundary + taluk boundaries)
□ News RSS queries configured
□ AI Intelligence pipeline queries added
```

## GeoJSON Sources

```
Bengaluru Urban taluks: datameet.org or Survey of India
Mysuru taluks: datameet.org or Survey of India
Download and store in: public/geo/karnataka-bengaluru-urban-taluks.json
                       public/geo/karnataka-mysuru-taluks.json
```
