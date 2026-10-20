---
name: indian-district-hierarchy
description: "Complete Indian district administrative hierarchy for JanaDhristi. Use this skill when building leadership pages, org charts, hierarchy visualizations, or seeding officer data for any Indian district. Triggers: 'district hierarchy', 'leadership org chart', 'who governs', 'district officers', 'tahsildar', 'block development officer', 'district collector', 'SP police', 'district judge', 'add more officials', 'expand leadership', 'government hierarchy India'. Covers all 10 tiers from Parliament to village-level officers."
---

# Indian District Administrative Hierarchy — Complete Reference

## 10-Tier System (Generic for ANY Indian district)

### Tier 1: PARLIAMENT
```
- Member of Parliament (Lok Sabha) — elected, 5-year term
- Rajya Sabha MP — if district falls under their constituency
```

### Tier 2: STATE ASSEMBLY
```
- MLAs (Members of Legislative Assembly) — one per assembly constituency
  - Karnataka: 224 seats. Mandya district has 7 constituencies
  - Each state has different number of seats
- MLC (Member of Legislative Council) — if state has upper house
  - Karnataka has Legislative Council (75 seats)
```

### Tier 3: ELECTED LOCAL BODY
```
- Zilla Panchayat (ZP) President — elected head of district panchayat
- ZP Vice President
- City Municipal Council (CMC) / Town Municipal Council (TMC) President
- Taluk Panchayat President — one per taluk
- Gram Panchayat President (Sarpanch) — one per village panchayat
- Ward Members — elected representatives at ward level
```

### Tier 4: DISTRICT ADMINISTRATION (IAS/KAS)
```
- Deputy Commissioner (DC) / District Collector / District Magistrate
  - HEAD of district administration, IAS officer
  - In Karnataka: called "Deputy Commissioner"
  - In UP/Bihar: called "District Magistrate"
  - In Maharashtra: called "Collector"
- Additional Deputy Commissioner (ADC)
- Assistant Commissioner (AC) — one per subdivision
- Chief Executive Officer (CEO), Zilla Panchayat
- Project Director, DRDA (District Rural Development Agency)
- District Registrar (land/property registration)
- Sub-Registrar — one per taluk
```

### Tier 5: POLICE (IPS/State Police)
```
- Superintendent of Police (SP) — HEAD of district police, IPS officer
- Additional SP (Addl. SP)
- Deputy SP (Dy.SP) — one per subdivision/circle
- Circle Inspector (CI) — one per police circle
- Police Inspector (PI) — one per police station
- Sub-Inspector (SI) — multiple per station
- Traffic Police Inspector
- District Armed Reserve (DAR) Commandant
- Cyber Crime Cell head
- Women's Police Station head
```

### Tier 6: JUDICIARY
```
- District & Sessions Judge (Principal) — HEAD of district judiciary
- Additional District & Sessions Judge
- Senior Civil Judge
- Civil Judge & JMFC — one per taluk
- Chief Judicial Magistrate (CJM)
- Family Court Judge
- Labour Court Judge
- POCSO Special Court Judge
- Motor Accident Claims Tribunal (MACT) Judge
- Lok Adalat presiding officer
```

### Tier 7: REVENUE ADMINISTRATION
```
- District Revenue Officer (DRO)
- Tahsildar — one per taluk (KEY revenue officer)
- Deputy Tahsildar — one per taluk
- Revenue Inspector (RI) — multiple per taluk
- Village Accountant (VA) / Shanbhog — per hobli/group of villages
- Special Land Acquisition Officer (SLAO)
- Survey/Settlement Officer
```

### Tier 8: DEVELOPMENT & PANCHAYAT RAJ
```
- Chief Planning Officer (CPO)
- Block Development Officer (BDO) — one per taluk/block
- Executive Officer (EO), Taluk Panchayat — one per taluk
- Panchayat Development Officer (PDO) — per gram panchayat
- Assistant Executive Engineer (AEE), PWD
- Executive Engineer (EE), PWD (roads, buildings)
- Executive Engineer, Minor Irrigation
- Assistant Director, MGNREGA
- District Programme Coordinator, MGNREGA
```

### Tier 9: DEPARTMENT HEADS (District Level)
```
EDUCATION:
- Deputy Director of Public Instruction (DDPI)
- Block Education Officer (BEO) — one per taluk
- District Institute of Education & Training (DIET) Principal

HEALTH:
- District Health Officer (DHO)
- District Medical Officer (DMO)
- District Surgeon
- Taluk Health Officer (THO) — one per taluk
- District RCH (Reproductive & Child Health) Officer
- District Malaria Officer
- District TB Officer

AGRICULTURE:
- Joint Director, Agriculture
- Deputy Director, Agriculture
- Assistant Director, Agriculture — one per taluk
- KVK (Krishi Vigyan Kendra) Head Scientist
- Sericulture Deputy Director (where applicable)
- District Horticulture Officer

ANIMAL HUSBANDRY:
- Deputy Director, Animal Husbandry & Veterinary Services
- District Fisheries Officer
- District Veterinary Officer

INFRASTRUCTURE:
- Executive Engineer, Karnataka PWD
- Executive Engineer, National Highways
- Executive Engineer, Cauvery Neeravari Nigam (irrigation)
- Superintending Engineer, CESC/BESCOM/DISCOM (electricity)
- Assistant Executive Engineer, CESC/BESCOM
- Executive Engineer, BWSSB/Water Supply Board

TRANSPORT:
- Regional Transport Officer (RTO)
- Assistant RTO

SOCIAL WELFARE:
- District Social Welfare Officer
- District Women & Child Development Officer (DWCDO)
- District Backward Classes Welfare Officer
- District Minorities Welfare Officer
- District Disability Welfare Officer
- Child Protection Officer

FINANCE & REVENUE:
- Lead District Manager (Lead Bank)
- District Treasury Officer
- District Excise Superintendent

INDUSTRY & EMPLOYMENT:
- General Manager, District Industries Centre (DIC)
- District Employment Officer
- District Labour Officer

FOOD & CIVIL SUPPLIES:
- District Food & Civil Supplies Officer
- Taluk Food Inspector — per taluk

OTHER:
- District Information Officer (DIO)
- NIC District Coordinator
- District Sports Officer
- District Youth Services Officer
- District Statistics Officer
- District Soil Conservation Officer
```

### Tier 10: TALUK LEVEL (repeat per taluk)
```
- Tahsildar
- Deputy Tahsildar
- BDO (Block Development Officer)
- BEO (Block Education Officer)
- THO (Taluk Health Officer)
- Police Inspector (PI) / Sub-Inspector (SI)
- Agricultural Officer
- Taluk Social Welfare Officer
- Junior Engineer, PWD
- Taluk Panchayat Executive Officer
- Sub-Registrar
- Taluk Veterinary Officer
```

## State Variations

```
KARNATAKA: DC (Deputy Commissioner), SP, CEO ZP
MAHARASHTRA: Collector, SP, CEO ZP
UTTAR PRADESH: DM (District Magistrate), SSP, CDO
TAMIL NADU: Collector, SP, Project Director DRD
WEST BENGAL: DM, SP, Sabhadhipati (ZP Chair)
RAJASTHAN: Collector, SP, CEO ZP, Pradhan (Panchayat)
KERALA: Collector, SP, District Panchayat President

Each state may have additional unique positions.
Karnataka-specific: Sericulture, Sugar Commissioner, Cauvery Water Authority
```

## Data Sources for Names

```
1. {district}.nic.in — Official district website "Who's Who" page
2. Wikipedia — Elected representatives, judges
3. ECI (results.eci.gov.in) — Election winners
4. ADR (myneta.info) — Candidate details
5. State government gazette — Appointments, transfers
6. District court website — Judicial officers
7. State police website — SP, ASP appointments
```

## Prisma Model Design

```prisma
model Leader {
  tier          Int       // 1-10 as above
  role          String    // "Member of Parliament", "Tahsildar", etc.
  department    String?   // "Police", "Revenue", "Education", etc.
  // ... other existing fields
}
```

## UI: Expandable accordion sections by tier on Leadership page
