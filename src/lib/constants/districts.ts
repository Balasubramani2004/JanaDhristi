/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// JanaDhristi — Full India Hierarchy
// India → State → District → Taluk → Village
// Active: Karnataka (Mandya, Bengaluru Urban, Mysuru)
// ═══════════════════════════════════════════════════════════

export interface Village {
  slug: string;
  name: string;
  nameLocal?: string;
  population?: number;
  pincode?: string;
}

export interface Taluk {
  slug: string;
  name: string;
  nameLocal: string;
  tagline?: string;
  population?: number;
  area?: number; // sq km
  villageCount?: number;
  villages?: Village[];
}

export interface DistrictBadge {
  emoji: string;
  label: string;
}

export interface District {
  slug: string;
  name: string;
  nameLocal: string;
  tagline?: string;
  taglineLocal?: string;
  active: boolean;
  population?: number;
  area?: number; // sq km
  talukCount?: number;
  villageCount?: number;
  literacy?: number;
  sexRatio?: number;
  badges?: DistrictBadge[];
  taluks: Taluk[];
}

export interface State {
  slug: string;
  name: string;
  nameLocal: string;
  active: boolean;
  capital?: string;
  type: "state" | "ut"; // state or union territory
  districts: District[];
}

// ── Mandya District — full detail ────────────────────────
const MANDYA_DISTRICT: District = {
  slug: "mandya",
  name: "Mandya",
  nameLocal: "ಮಂಡ್ಯ",
  tagline: "Sugar Capital of Karnataka",
  taglineLocal: "ಕರ್ನಾಟಕದ ಸಕ್ಕರೆ ನಗರ",
  active: true,
  badges: [
    { emoji: "🏭", label: "Sugar Capital of Karnataka" },
    { emoji: "🌊", label: "Home of KRS Dam" },
    { emoji: "🌾", label: "Kaveri Basin Heartland" },
  ],
  population: 1940428,
  area: 4961,
  talukCount: 7,
  villageCount: 1291,
  literacy: 72.8,
  sexRatio: 982,
  taluks: [
    {
      slug: "mandya",
      name: "Mandya",
      nameLocal: "ಮಂಡ್ಯ",
      tagline: "Sugar Capital of Karnataka",
      population: 516098,
      area: 727,
      villageCount: 193,
      villages: [
        { slug: "mandya-city", name: "Mandya City", nameLocal: "ಮಂಡ್ಯ ನಗರ", population: 131179, pincode: "571401" },
        { slug: "ganjam", name: "Ganjam", nameLocal: "ಗಂಜಾಂ", pincode: "571401" },
        { slug: "bogadi", name: "Bogadi", nameLocal: "ಬೊಗಾಡಿ", pincode: "571402" },
        { slug: "basaralu", name: "Basaralu", nameLocal: "ಬಸರಾಳು", pincode: "571441" },
        { slug: "bellur", name: "Bellur", nameLocal: "ಬೆಳ್ಳೂರು", pincode: "571448" },
      ],
    },
    {
      slug: "maddur",
      name: "Maddur",
      nameLocal: "ಮದ್ದೂರು",
      tagline: "Gateway to Old Mysore",
      population: 290000,
      area: 686,
      villageCount: 174,
      villages: [
        { slug: "maddur-town", name: "Maddur Town", nameLocal: "ಮದ್ದೂರು ಪಟ್ಟಣ", pincode: "571428" },
        { slug: "mahadevapura", name: "Mahadevapura", nameLocal: "ಮಹಾದೇವಪುರ", pincode: "571432" },
        { slug: "koppa", name: "Koppa", nameLocal: "ಕೊಪ್ಪ", pincode: "571425" },
      ],
    },
    {
      slug: "malavalli",
      name: "Malavalli",
      nameLocal: "ಮಳವಳ್ಳಿ",
      tagline: "Land of Temples & Tanks",
      population: 270000,
      area: 705,
      villageCount: 187,
      villages: [
        { slug: "malavalli-town", name: "Malavalli Town", nameLocal: "ಮಳವಳ್ಳಿ ಪಟ್ಟಣ", pincode: "571430" },
        { slug: "bharathinagara", name: "Bharathinagara", nameLocal: "ಭಾರತಿನಗರ", pincode: "571422" },
        { slug: "kollegal-road", name: "Kollegal Road", nameLocal: "ಕೊಳ್ಳೇಗಾಲ ರಸ್ತೆ", pincode: "571430" },
      ],
    },
    {
      slug: "srirangapatna",
      name: "Srirangapatna",
      nameLocal: "ಶ್ರೀರಂಗಪಟ್ಟಣ",
      tagline: "Tipu Sultan's Island Fortress",
      population: 225000,
      area: 581,
      villageCount: 135,
      villages: [
        { slug: "srirangapatna-town", name: "Srirangapatna Town", nameLocal: "ಶ್ರೀರಂಗಪಟ್ಟಣ ಪಟ್ಟಣ", pincode: "571438" },
        { slug: "bannur", name: "Bannur", nameLocal: "ಬನ್ನೂರು", pincode: "571101" },
        { slug: "kirugavalu", name: "Kirugavalu", nameLocal: "ಕಿರುಗಾವಲು", pincode: "571443" },
      ],
    },
    {
      slug: "nagamangala",
      name: "Nagamangala",
      nameLocal: "ನಾಗಮಂಗಲ",
      tagline: "Heart of the Deccan Plateau",
      population: 220000,
      area: 791,
      villageCount: 200,
      villages: [
        { slug: "nagamangala-town", name: "Nagamangala Town", nameLocal: "ನಾಗಮಂಗಲ ಪಟ್ಟಣ", pincode: "571432" },
        { slug: "hosur", name: "Hosur", nameLocal: "ಹೊಸೂರು", pincode: "571453" },
      ],
    },
    {
      slug: "kr-pete",
      name: "K R Pete",
      nameLocal: "ಕೆ.ಆರ್.ಪೇಟೆ",
      tagline: "Jewel of the Kaveri Basin",
      population: 235000,
      area: 727,
      villageCount: 210,
      villages: [
        { slug: "kr-pete-town", name: "K R Pete Town", nameLocal: "ಕೆ.ಆರ್.ಪೇಟೆ ಪಟ್ಟಣ", pincode: "571426" },
        { slug: "belagola", name: "Belagola", nameLocal: "ಬೇಲಗೊಳ", pincode: "571423" },
      ],
    },
    {
      slug: "pandavapura",
      name: "Pandavapura",
      nameLocal: "ಪಾಂಡವಪುರ",
      tagline: "Where the Pandavas Rested",
      population: 175000,
      area: 744,
      villageCount: 192,
      villages: [
        { slug: "pandavapura-town", name: "Pandavapura Town", nameLocal: "ಪಾಂಡವಪುರ ಪಟ್ಟಣ", pincode: "571434" },
        { slug: "melukote", name: "Melukote", nameLocal: "ಮೇಲುಕೋಟೆ", pincode: "571431" },
      ],
    },
  ],
};

// ── Bengaluru Urban District ──────────────────────────────
const BENGALURU_URBAN_DISTRICT: District = {
  slug: "bengaluru-urban",
  name: "Bengaluru Urban",
  nameLocal: "ಬೆಂಗಳೂರು ನಗರ",
  tagline: "Silicon Valley of India",
  taglineLocal: "ಭಾರತದ ಸಿಲಿಕಾನ್ ಕಣಿವೆ",
  active: true,
  badges: [
    { emoji: "💻", label: "Startup Capital of India" },
    { emoji: "🌳", label: "Garden City" },
    { emoji: "🔬", label: "ISRO & HAL Headquarters" },
    { emoji: "🚀", label: "India's Silicon Valley" },
  ],
  population: 12765000,
  area: 741,
  talukCount: 4,
  villageCount: 532,
  literacy: 88.48,
  sexRatio: 916,
  taluks: [
    {
      slug: "bengaluru-north",
      name: "Bengaluru North",
      nameLocal: "ಬೆಂಗಳೂರು ಉತ್ತರ",
      tagline: "Gateway to the Airport",
      population: 3800000,
      area: 198,
      villageCount: 145,
      villages: [
        { slug: "yelahanka", name: "Yelahanka", nameLocal: "ಯಲಹಂಕ", population: 250000, pincode: "560064" },
        { slug: "devanahalli", name: "Devanahalli", nameLocal: "ದೇವನಹಳ್ಳಿ", population: 45000, pincode: "562110" },
        { slug: "doddaballapur", name: "Doddaballapur", nameLocal: "ದೊಡ್ಡಬಳ್ಳಾಪುರ", population: 60000, pincode: "561203" },
        { slug: "hesaraghatta", name: "Hesaraghatta", nameLocal: "ಹೆಸರಘಟ್ಟ", population: 18000, pincode: "560088" },
        { slug: "chikkaballapur-road", name: "Chikkaballapur Road", nameLocal: "ಚಿಕ್ಕಬಳ್ಳಾಪುರ ರಸ್ತೆ", pincode: "562101" },
      ],
    },
    {
      slug: "bengaluru-south",
      name: "Bengaluru South",
      nameLocal: "ಬೆಂಗಳೂರು ದಕ್ಷಿಣ",
      tagline: "Heart of the Garden City",
      population: 4200000,
      area: 186,
      villageCount: 120,
      villages: [
        { slug: "jayanagar", name: "Jayanagar", nameLocal: "ಜಯನಗರ", population: 450000, pincode: "560041" },
        { slug: "basavanagudi", name: "Basavanagudi", nameLocal: "ಬಸವನಗುಡಿ", population: 120000, pincode: "560004" },
        { slug: "btm-layout", name: "BTM Layout", nameLocal: "ಬಿ.ಟಿ.ಎಂ ಲೇಔಟ್", population: 280000, pincode: "560076" },
        { slug: "bannerghatta-road", name: "Bannerghatta Road", nameLocal: "ಬನ್ನೇರಘಟ್ಟ ರಸ್ತೆ", population: 320000, pincode: "560083" },
        { slug: "kanakapura-road", name: "Kanakapura Road", nameLocal: "ಕನಕಪುರ ರಸ್ತೆ", pincode: "560062" },
      ],
    },
    {
      slug: "bengaluru-east",
      name: "Bengaluru East",
      nameLocal: "ಬೆಂಗಳೂರು ಪೂರ್ವ",
      tagline: "IT Corridor Hub",
      population: 3100000,
      area: 194,
      villageCount: 150,
      villages: [
        { slug: "whitefield", name: "Whitefield", nameLocal: "ವೈಟ್‌ಫೀಲ್ಡ್", population: 380000, pincode: "560066" },
        { slug: "kr-puram", name: "K R Puram", nameLocal: "ಕೆ.ಆರ್.ಪುರ", population: 420000, pincode: "560036" },
        { slug: "marathahalli", name: "Marathahalli", nameLocal: "ಮರಾಠಾಹಳ್ಳಿ", population: 350000, pincode: "560037" },
        { slug: "hsr-layout", name: "HSR Layout", nameLocal: "ಎಚ್.ಎಸ್.ಆರ್ ಲೇಔಟ್", population: 200000, pincode: "560102" },
        { slug: "indiranagar", name: "Indiranagar", nameLocal: "ಇಂದಿರಾನಗರ", population: 180000, pincode: "560038" },
      ],
    },
    {
      slug: "anekal",
      name: "Anekal",
      nameLocal: "ಆನೇಕಲ್",
      tagline: "Electronics City Gateway",
      population: 1665000,
      area: 163,
      villageCount: 117,
      villages: [
        { slug: "electronic-city", name: "Electronic City", nameLocal: "ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ", population: 280000, pincode: "560100" },
        { slug: "chandapura", name: "Chandapura", nameLocal: "ಚಂದಾಪುರ", population: 95000, pincode: "562106" },
        { slug: "anekal-town", name: "Anekal Town", nameLocal: "ಆನೇಕಲ್ ಪಟ್ಟಣ", population: 38000, pincode: "562106" },
        { slug: "sarjapur", name: "Sarjapur", nameLocal: "ಸರ್ಜಾಪುರ", population: 120000, pincode: "562125" },
        { slug: "attibele", name: "Attibele", nameLocal: "ಅತ್ತಿಬೆಲೆ", population: 55000, pincode: "562107" },
      ],
    },
  ],
};

// ── Mysuru District ───────────────────────────────────────
const MYSURU_DISTRICT: District = {
  slug: "mysuru",
  name: "Mysuru",
  nameLocal: "ಮೈಸೂರು",
  tagline: "City of Palaces",
  taglineLocal: "ಅರಮನೆಗಳ ನಗರ",
  active: true,
  badges: [
    { emoji: "🏆", label: "India's Cleanest City" },
    { emoji: "🏛️", label: "City of Palaces" },
    { emoji: "🎪", label: "Dasara Heritage" },
    { emoji: "🐘", label: "Wildlife Capital" },
    { emoji: "🧼", label: "Mysore Sandal Soap" },
  ],
  population: 3248000,
  area: 6854,
  talukCount: 7,
  villageCount: 2629,
  literacy: 72.64,
  sexRatio: 984,
  taluks: [
    {
      slug: "mysuru-taluk",
      name: "Mysuru",
      nameLocal: "ಮೈಸೂರು",
      tagline: "Heritage Capital of Karnataka",
      population: 1800000,
      area: 1654,
      villageCount: 362,
      villages: [
        { slug: "mysuru-city", name: "Mysuru City", nameLocal: "ಮೈಸೂರು ನಗರ", population: 920000, pincode: "570001" },
        { slug: "bogadi", name: "Bogadi", nameLocal: "ಬೊಗಾಡಿ", population: 42000, pincode: "570026" },
        { slug: "hebbal-mysuru", name: "Hebbal", nameLocal: "ಹೆಬ್ಬಾಳ", population: 38000, pincode: "570016" },
        { slug: "nanjangud-road", name: "Nanjangud Road", nameLocal: "ನಂಜನಗೂಡು ರಸ್ತೆ", population: 28000, pincode: "570008" },
        { slug: "bannur", name: "Bannur", nameLocal: "ಬನ್ನೂರು", population: 22000, pincode: "571101" },
      ],
    },
    {
      slug: "hunsur",
      name: "Hunsur",
      nameLocal: "ಹನ್ಸೂರು",
      tagline: "Coffee & Cardamom Country",
      population: 320000,
      area: 862,
      villageCount: 284,
      villages: [
        { slug: "hunsur-town", name: "Hunsur", nameLocal: "ಹನ್ಸೂರು", population: 55000, pincode: "571105" },
        { slug: "bettadapura", name: "Bettadapura", nameLocal: "ಬೆಟ್ಟದಪುರ", population: 12000, pincode: "571108" },
        { slug: "sargur", name: "Sargur", nameLocal: "ಸರ್ಗೂರು", population: 18000, pincode: "571109" },
        { slug: "kathriguppe", name: "Kathriguppe", nameLocal: "ಕತ್ತ್ರಿಗುಪ್ಪೆ", population: 9000, pincode: "571107" },
        { slug: "bilikere", name: "Bilikere", nameLocal: "ಬಿಳಿಕೆರೆ", population: 14000, pincode: "571104" },
      ],
    },
    {
      slug: "nanjangud",
      name: "Nanjangud",
      nameLocal: "ನಂಜನಗೂಡು",
      tagline: "Temple Town on the Kapila",
      population: 325000,
      area: 936,
      villageCount: 325,
      villages: [
        { slug: "nanjangud-town", name: "Nanjangud", nameLocal: "ನಂಜನಗೂಡು", population: 78000, pincode: "571301" },
        { slug: "tagadur", name: "Tagadur", nameLocal: "ತಾಗಡೂರು", population: 8000, pincode: "571312" },
        { slug: "natanahalli", name: "Natanahalli", nameLocal: "ನಾಟನಹಳ್ಳಿ", population: 6500, pincode: "571302" },
        { slug: "gundlupet-jn", name: "Gundlupet Jn", nameLocal: "ಗುಂಡ್ಲುಪೇಟೆ ಜಂಕ್ಷನ್", population: 11000, pincode: "571111" },
        { slug: "hullahalli", name: "Hullahalli", nameLocal: "ಹುಲ್ಲಹಳ್ಳಿ", population: 7500, pincode: "571304" },
      ],
    },
    {
      slug: "t-narasipur",
      name: "T. Narasipur",
      nameLocal: "ತಿರುಮಕೂಡಲು ನರಸೀಪುರ",
      tagline: "Triveni Sangama — Three Rivers Meet",
      population: 260000,
      area: 1005,
      villageCount: 348,
      villages: [
        { slug: "t-narasipur-town", name: "T. Narasipur", nameLocal: "ತಿ. ನರಸೀಪುರ", population: 32000, pincode: "571124" },
        { slug: "muguru", name: "Muguru", nameLocal: "ಮುಗೂರು", population: 7000, pincode: "571127" },
        { slug: "hosa-holalu", name: "Hosa Holalu", nameLocal: "ಹೊಸ ಹೊಳಲು", population: 5500, pincode: "571123" },
        { slug: "sathegala", name: "Sathegala", nameLocal: "ಸಾತೆಗಾಲ", population: 8000, pincode: "571126" },
        { slug: "kalale", name: "Kalale", nameLocal: "ಕಳಲೆ", population: 6000, pincode: "571122" },
      ],
    },
    {
      slug: "hd-kote",
      name: "H.D. Kote",
      nameLocal: "ಎಚ್.ಡಿ. ಕೋಟೆ",
      tagline: "Gateway to Nagarahole",
      population: 220000,
      area: 2374,
      villageCount: 370,
      villages: [
        { slug: "hd-kote-town", name: "H.D. Kote", nameLocal: "ಎಚ್.ಡಿ. ಕೋಟೆ", population: 28000, pincode: "571114" },
        { slug: "nagarahole", name: "Nagarahole", nameLocal: "ನಾಗರಹೊಳೆ", population: 5000, pincode: "571118" },
        { slug: "antarsante", name: "Antarsante", nameLocal: "ಅಂತರ್ಸಂತೆ", population: 8000, pincode: "571116" },
        { slug: "kuttoor", name: "Kuttoor", nameLocal: "ಕುತ್ತೂರು", population: 6500, pincode: "571115" },
        { slug: "manchala", name: "Manchala", nameLocal: "ಮಂಚಾಲ", population: 4500, pincode: "571117" },
      ],
    },
    {
      slug: "periyapatna",
      name: "Periyapatna",
      nameLocal: "ಪಿರಿಯಾಪಟ್ಟಣ",
      tagline: "Land of Turmeric and Pepper",
      population: 210000,
      area: 782,
      villageCount: 260,
      villages: [
        { slug: "periyapatna-town", name: "Periyapatna", nameLocal: "ಪಿರಿಯಾಪಟ್ಟಣ", population: 38000, pincode: "571107" },
        { slug: "shivapura-mys", name: "Shivapura", nameLocal: "ಶಿವಪುರ", population: 7000, pincode: "571119" },
        { slug: "hosaholalu", name: "Hosaholalu", nameLocal: "ಹೊಸಹೊಳಲು", population: 5500, pincode: "571120" },
        { slug: "balehonnur-jn", name: "Balehonnur Jn", nameLocal: "ಬಾಳೆಹೊನ್ನೂರು ಜಂಕ್ಷನ್", population: 9000, pincode: "571108" },
        { slug: "hannur", name: "Hannur", nameLocal: "ಹಣ್ಣೂರು", population: 6000, pincode: "571121" },
      ],
    },
    {
      slug: "kr-nagar",
      name: "K.R. Nagar",
      nameLocal: "ಕೃಷ್ಣರಾಜನಗರ",
      tagline: "Cauvery Heartland",
      population: 215000,
      area: 1079,
      villageCount: 305,
      villages: [
        { slug: "kr-nagar-town", name: "K.R. Nagar", nameLocal: "ಕೃಷ್ಣರಾಜನಗರ", population: 34000, pincode: "571602" },
        { slug: "arakere-mys", name: "Arakere", nameLocal: "ಅರಕೆರೆ", population: 8000, pincode: "571604" },
        { slug: "yedatore", name: "Yedatore", nameLocal: "ಯಡತೊರೆ", population: 7500, pincode: "571603" },
        { slug: "bherya", name: "Bherya", nameLocal: "ಭೇರ್ಯ", population: 5500, pincode: "571605" },
        { slug: "krishnarajasagara", name: "KRS Dam Area", nameLocal: "ಕೃಷ್ಣರಾಜ ಸಾಗರ", population: 12000, pincode: "571607" },
      ],
    },
  ],
};

// ── Karnataka — all 31 districts ─────────────────────────
const KARNATAKA_DISTRICTS: District[] = [
  MANDYA_DISTRICT,
  BENGALURU_URBAN_DISTRICT,
  MYSURU_DISTRICT,
  { slug: "bengaluru-rural", name: "Bengaluru Rural", nameLocal: "ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ", active: false, population: 990923, area: 2259, talukCount: 4, villageCount: 1078, taluks: [] },
  { slug: "tumakuru", name: "Tumakuru", nameLocal: "ತುಮಕೂರು", active: false, population: 2678980, area: 10597, talukCount: 10, villageCount: 2741, taluks: [] },
  { slug: "kolar", name: "Kolar", nameLocal: "ಕೋಲಾರ", active: false, population: 1540231, area: 3969, talukCount: 5, villageCount: 1396, taluks: [] },
  { slug: "ramanagara", name: "Ramanagara", nameLocal: "ರಾಮನಗರ", active: false, population: 1082739, area: 3510, talukCount: 4, villageCount: 1029, taluks: [] },
  { slug: "chikkaballapur", name: "Chikkaballapur", nameLocal: "ಚಿಕ್ಕಬಳ್ಳಾಪುರ", active: false, population: 1255104, area: 4207, talukCount: 6, villageCount: 1543, taluks: [] },
  { slug: "hassan", name: "Hassan", nameLocal: "ಹಾಸನ", active: false, population: 1776421, area: 6814, talukCount: 8, villageCount: 2447, taluks: [] },
  { slug: "chikkamagaluru", name: "Chikkamagaluru", nameLocal: "ಚಿಕ್ಕಮಗಳೂರು", active: false, population: 1137961, area: 7201, talukCount: 7, villageCount: 1710, taluks: [] },
  { slug: "kodagu", name: "Kodagu", nameLocal: "ಕೊಡಗು", active: false, population: 554762, area: 4102, talukCount: 3, villageCount: 282, taluks: [] },
  { slug: "shivamogga", name: "Shivamogga", nameLocal: "ಶಿವಮೊಗ್ಗ", active: false, population: 1755512, area: 8477, talukCount: 7, villageCount: 2035, taluks: [] },
  { slug: "davanagere", name: "Davanagere", nameLocal: "ದಾವಣಗೆರೆ", active: false, population: 1945497, area: 5926, talukCount: 6, villageCount: 1551, taluks: [] },
  { slug: "chitradurga", name: "Chitradurga", nameLocal: "ಚಿತ್ರದುರ್ಗ", active: false, population: 1660378, area: 8440, talukCount: 6, villageCount: 1839, taluks: [] },
  { slug: "ballari", name: "Ballari", nameLocal: "ಬಳ್ಳಾರಿ", active: false, population: 2530068, area: 8447, talukCount: 7, villageCount: 1481, taluks: [] },
  { slug: "vijayanagara", name: "Vijayanagara", nameLocal: "ವಿಜಯನಗರ", active: false, population: 1300000, area: 3000, talukCount: 5, villageCount: 600, taluks: [] },
  { slug: "raichur", name: "Raichur", nameLocal: "ರಾಯಚೂರು", active: false, population: 1924773, area: 6827, talukCount: 5, villageCount: 786, taluks: [] },
  { slug: "koppal", name: "Koppal", nameLocal: "ಕೊಪ್ಪಳ", active: false, population: 1391292, area: 5490, talukCount: 4, villageCount: 651, taluks: [] },
  { slug: "gadag", name: "Gadag", nameLocal: "ಗದಗ", active: false, population: 1065235, area: 4656, talukCount: 5, villageCount: 696, taluks: [] },
  { slug: "dharwad", name: "Dharwad", nameLocal: "ಧಾರವಾಡ", active: false, population: 1847023, area: 4263, talukCount: 4, villageCount: 570, taluks: [] },
  { slug: "haveri", name: "Haveri", nameLocal: "ಹಾವೇರಿ", active: false, population: 1598506, area: 4851, talukCount: 7, villageCount: 1025, taluks: [] },
  { slug: "belagavi", name: "Belagavi", nameLocal: "ಬೆಳಗಾವಿ", active: false, population: 4779661, area: 13415, talukCount: 14, villageCount: 2929, taluks: [] },
  { slug: "vijayapura", name: "Vijayapura", nameLocal: "ವಿಜಯಪುರ", active: false, population: 2175097, area: 10534, talukCount: 5, villageCount: 1038, taluks: [] },
  { slug: "bagalkot", name: "Bagalkot", nameLocal: "ಬಾಗಲಕೋಟೆ", active: false, population: 1890826, area: 6575, talukCount: 6, villageCount: 1114, taluks: [] },
  { slug: "bidar", name: "Bidar", nameLocal: "ಬೀದರ್", active: false, population: 1700018, area: 5448, talukCount: 5, villageCount: 852, taluks: [] },
  { slug: "kalaburagi", name: "Kalaburagi", nameLocal: "ಕಲಬುರಗಿ", active: false, population: 2566326, area: 10951, talukCount: 7, villageCount: 1408, taluks: [] },
  { slug: "yadgir", name: "Yadgir", nameLocal: "ಯಾದಗಿರಿ", active: false, population: 1173170, area: 5117, talukCount: 3, villageCount: 537, taluks: [] },
  { slug: "dakshina-kannada", name: "Dakshina Kannada", nameLocal: "ದಕ್ಷಿಣ ಕನ್ನಡ", active: false, population: 2089649, area: 4560, talukCount: 5, villageCount: 793, taluks: [] },
  { slug: "udupi", name: "Udupi", nameLocal: "ಉಡುಪಿ", active: false, population: 1177908, area: 3880, talukCount: 3, villageCount: 479, taluks: [] },
  { slug: "uttara-kannada", name: "Uttara Kannada", nameLocal: "ಉತ್ತರ ಕನ್ನಡ", active: false, population: 1437169, area: 10291, talukCount: 11, villageCount: 1085, taluks: [] },
  { slug: "chamarajanagar", name: "Chamarajanagar", nameLocal: "ಚಾಮರಾಜನಗರ", active: false, population: 1020791, area: 5101, talukCount: 4, villageCount: 743, taluks: [] },
];

// ── Canonical state list (Karnataka-only) ─────────────────
export const INDIA_STATES: State[] = [
  {
    slug: "karnataka",
    name: "Karnataka",
    nameLocal: "ಕರ್ನಾಟಕ",
    active: true,
    capital: "Bengaluru",
    type: "state",
    districts: KARNATAKA_DISTRICTS,
  },
];

export const FRONTEND_STATES: State[] = INDIA_STATES;

// ── Lookup helpers ────────────────────────────────────────
export function getState(stateSlug: string): State | undefined {
  return INDIA_STATES.find((s) => s.slug === stateSlug);
}

export function getDistrict(
  stateSlug: string,
  districtSlug: string
): District | undefined {
  return getState(stateSlug)?.districts.find((d) => d.slug === districtSlug);
}

export function getTaluk(
  stateSlug: string,
  districtSlug: string,
  talukSlug: string
): Taluk | undefined {
  return getDistrict(stateSlug, districtSlug)?.taluks.find(
    (t) => t.slug === talukSlug
  );
}

export function getActiveDistrict(
  stateSlug: string
): District | undefined {
  return getState(stateSlug)?.districts.find((d) => d.active);
}

export function getActiveDistricts(stateSlug: string): District[] {
  return getState(stateSlug)?.districts.filter((d) => d.active) ?? [];
}

/**
 * Total count of active districts across all states.
 * Use this instead of hardcoding "9 active districts" anywhere in the UI —
 * the number changes as new districts go live.
 */
export function getTotalActiveDistrictCount(): number {
  return INDIA_STATES.reduce(
    (sum, s) => sum + s.districts.filter((d) => d.active).length,
    0,
  );
}

/**
 * Count of states with at least one active district.
 * For support-page copy ("across N states").
 */
export function getActiveStateCount(): number {
  return INDIA_STATES.filter((s) => s.districts.some((d) => d.active)).length;
}

// Pilot district constants
export const PILOT_STATE = "karnataka";
export const PILOT_DISTRICT = "mandya";
