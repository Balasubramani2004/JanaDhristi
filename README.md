<div align="center">

# 🇮🇳 JanaDhristi

### Your District. Your Data. Your Right.

**Free, real-time, district-level civic transparency platform for Karnataka.**

[Live Site](https://janadhristi.in) · [Vote for Features](https://janadhristi.in/en/features) · [Support the Project](https://janadhristi.in/support)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Districts](https://img.shields.io/badge/districts_live-9-green.svg)
![Modules](https://img.shields.io/badge/dashboards-29_per_district-orange.svg)

</div>

---

## What is JanaDhristi?

JanaDhristi aggregates publicly available government data into clean, citizen-friendly dashboards for Karnataka districts. Instead of navigating many government portals, citizens get a single platform with real-time data on crop prices, dam levels, budget spending, school performance, infrastructure projects, and 25+ more modules.

**Currently live:** Karnataka (Mandya, Mysuru, Bengaluru Urban)
**Current focus:** Karnataka-first district expansion and deeper module quality.

## 29 Dashboard Modules

| Category | Modules |
|----------|---------|
| **Live Data** | Overview, Interactive Map, Water & Dams, Crop Prices, Weather & Rainfall, Finance & Budget |
| **Governance** | Leadership, Police & Traffic, Schools, Courts, RTI Tracker, Gram Panchayat, Health |
| **Services** | Gov. Schemes, Services Guide, Elections, Transport, JJM Water Supply, Housing, Power |
| **Community** | Local Alerts, Offices, Citizen Corner, Famous Personalities, News, Data Sources |

## AI Civic Copilot

The header includes a Civic Copilot agent icon. On district pages, people can ask civic questions and get:

- real-time impact summary from district context
- immediate action checklist
- next-24-hour recommendations
- complaint draft
- RTI draft
- source citations and confidence

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, react-simple-maps, Recharts |
| Database | PostgreSQL (Neon), Prisma ORM (45+ models) |
| Cache | Upstash Redis |
| AI | OpenRouter via unified provider (`callAI` / `callAIJSON`) with purpose-based model routing |
| Data Collection Jobs | Railway.app (24/7), Google News RSS, Cheerio |
| Hosting | Vercel Pro |
| Payments | Razorpay (for supporter contributions) |
| Monitoring | Sentry (errors), Plausible (analytics, cookieless) |
| Email | Resend (admin alerts) |

## Getting Started

```bash
# Clone
git clone https://github.com/Balasubramani2004/JanaDhristi.git
cd forthepeople

# Install
npm install

# Set up environment
cp .env.example .env.local
# Fill in your API keys in .env.local

# Database
npx prisma generate
npx prisma db push

# Run
npm run dev
```

## Project Structure

```
docs/                       # All documentation (blueprint, skills, guides)
prompts/                    # Claude Code prompts archive (completed + pending)
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── data/[module]/  # 29-module unified data API
│   │   ├── cron/           # Scheduled jobs (news, crops, insights)
│   │   └── admin/          # Admin endpoints (health, alerts, analytics)
│   └── [locale]/[state]/[district]/  # District dashboard pages
├── components/             # Reusable React components
├── lib/                    # Core utilities (DB, Redis, AI, alerts, health score)
└── scraper/                # Background data collection jobs (Railway)
prisma/
├── schema.prisma           # 45+ database models
└── seed.ts                 # Seed data for Mandya district
```

## Legal

JanaDhristi is an **independent citizen transparency initiative**. It is NOT an official government website. All data is sourced from publicly available government portals under India's Open Data Policy (NDSAP) and the Right to Information (Article 19(1)(a) of the Indian Constitution).

## Support

Running and expanding this platform across Karnataka districts costs money every month. You can help:

- **One-Time Contribution** — any amount from ₹10
- **District Champion** — ₹99/mo, name on your chosen district page
- **State Champion** — ₹1,999/mo, name on every district in that state
- **Platform Patron** — ₹9,999/mo, featured across active district pages
- **Founding Builder** — ₹50,000/mo, permanent homepage spotlight

[Support page →](https://janadhristi.in/support) · [Contributor leaderboard →](https://janadhristi.in/en/contributors)

## Contributing

We welcome contributions from developers of all skill levels! Whether you want to add a Karnataka district, fix a bug, improve the UI, or add translations — every contribution helps.

- Read the [Contributing Guide](CONTRIBUTING.md) to get started
- Check out [`good-first-issue`](https://github.com/Balasubramani2004/JanaDhristi/labels/good-first-issue) labeled issues
- Review our [Code of Conduct](CODE_OF_CONDUCT.md)
- Report security issues privately via [SECURITY.md](SECURITY.md)

**Goal:** Expand high-quality coverage across Karnataka districts.

## Creator

**Jayanth M B** — Entrepreneur from Karnataka, India.

Built with the belief that every Indian citizen deserves free, transparent access to their district's government data.

- Project: [janadhristi.in](https://janadhristi.in)

## License

MIT with Attribution — see [LICENSE](LICENSE) for details.

Any fork or derivative must retain attribution to the original creator (Jayanth M B).
