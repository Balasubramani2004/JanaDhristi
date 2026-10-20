/**
 * Side-effect-only env loader for Node.js scripts.
 * Must be the FIRST import so subsequent imports (prisma client, ai-provider)
 * see DATABASE_URL + OPENROUTER_API_KEY at module-load time.
 *
 * Load order matches Next.js convention: .env first, .env.local overrides.
 */
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env" });
dotenvConfig({ path: ".env.local", override: true });
