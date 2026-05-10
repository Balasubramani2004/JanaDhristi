# Data freshness — verification and module matrix

## Quick verification (crop prices stuck on an old mandi date)

1. **Vercel → Project → Settings → Environment Variables**  
   Confirm **Production** has `DATA_GOV_API_KEY` and `CRON_SECRET`.

2. **Manual cron run** (replace host and secret):
   ```http
   GET https://<your-domain>/api/cron/scrape-crops
   Authorization: Bearer <CRON_SECRET>
   ```
   Expect **200** JSON with `totalNewRecords` and per-district results. **401** means `CRON_SECRET` mismatch.

3. **Railway scraper** (if used for fresher than daily crops): Service must be running with `DATABASE_URL` and `DATA_GOV_API_KEY`. Logs should not show `DATA_GOV_API_KEY not set — skipping`.

4. **Admin**: Scraper / System Health — check last crop job errors and API HTTP failures.
5. **Admin diagnostics API**: `GET /api/admin/data-freshness` (cookie auth) for per-district news/crops latest timestamps, stale status, and last success/error job details.

## Module → ingestion → schedule → env

| Module (API slug) | Primary job | Vercel cron (UTC) | Railway scheduler (see `src/scraper/scheduler.ts`) | Critical env |
|-------------------|------------|-------------------|------------------------------------------------------|----------------|
| crops | `scrapeCrops` | `30 3 * * *`, `30 9 * * *` | Every 15 min, 06:00–20:00 **Asia/Kolkata** | `DATA_GOV_API_KEY`, `CRON_SECRET` (Vercel) |
| weather | `scrapeWeather` | — | Every 5 min | `OPENWEATHER_API_KEY` |
| water / dams | `scrapeDams` | — | Every 30 min | (job-specific) |
| power | `scrapePower` | — | Every 15 min | (job-specific) |
| news | `scrapeNews` | `0 * * * *` | Every 1 hour | RSS / news config |
| scrape-news cron | batch news | `0 * * * *` | — | `CRON_SECRET` |
| insights | `generate-insights` | `0 0,12 * * *` | — | AI keys, `CRON_SECRET` |

Static or infrequent modules (schools, schemes, JJM batch, etc.) depend on Railway weekly/monthly jobs or seeds — see `scheduler.ts` and `vercel.json` for the full list.

## UI vs source

The crop prices page shows **LIVE** only when the latest mandi **arrival date** in the API is **today or yesterday** in **Asia/Kolkata**. Older data still displays with the last mandi date but without the live badge.
