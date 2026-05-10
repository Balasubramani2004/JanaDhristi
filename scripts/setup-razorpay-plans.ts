/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 *
 * Run ONCE to create subscription plans on Razorpay:
 *   npx tsx -r dotenv/config scripts/setup-razorpay-plans.ts
 */

const PLANS = [
  {
    envKey: "RAZORPAY_PLAN_DISTRICT",
    plan: {
      period: "monthly",
      interval: 1,
      item: {
        name: "JanaDhristi District Champion",
        amount: 20000, // ₹200 in paise
        currency: "INR",
        description: "District Champion — your name on the district you champion",
      },
    },
  },
  {
    envKey: "RAZORPAY_PLAN_STATE",
    plan: {
      period: "monthly",
      interval: 1,
      item: {
        name: "JanaDhristi State Champion",
        amount: 200000, // ₹2,000 in paise
        currency: "INR",
        description: "State Champion — your name on all districts in one state",
      },
    },
  },
  {
    envKey: "RAZORPAY_PLAN_PATRON",
    plan: {
      period: "monthly",
      interval: 1,
      item: {
        name: "JanaDhristi All-India Patron",
        amount: 1000000, // ₹10,000 in paise
        currency: "INR",
        description: "All-India Patron — featured across all 780+ districts",
      },
    },
  },
  {
    envKey: "RAZORPAY_PLAN_FOUNDER",
    plan: {
      period: "monthly",
      interval: 1,
      item: {
        name: "JanaDhristi Founding Builder",
        amount: 5000000, // ₹50,000 in paise
        currency: "INR",
        description: "Founding Builder — everything + permanent homepage feature, gold card everywhere",
      },
    },
  },
];

async function main() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error("❌ Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env");
    process.exit(1);
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  console.log("Creating Razorpay subscription plans (new pricing)...\n");

  const envLines: string[] = [];

  for (const { envKey, plan } of PLANS) {
    try {
      const res = await fetch("https://api.razorpay.com/v1/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(plan),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`❌ Failed to create ${plan.item.name}: ${err}`);
        continue;
      }

      const data = await res.json();
      console.log(`✅ ${plan.item.name}`);
      console.log(`   Plan ID: ${data.id}`);
      console.log(`   Amount: ₹${plan.item.amount / 100}/month\n`);
      envLines.push(`${envKey} = ${data.id}`);
    } catch (err) {
      console.error(`❌ Error creating ${plan.item.name}:`, err);
    }
  }

  if (envLines.length > 0) {
    console.log("\n=== NEW RAZORPAY PLAN IDs ===\n");
    console.log(envLines.join("\n"));
    console.log("\nAdd these to Vercel → Settings → Environment Variables");
    console.log("Remove RAZORPAY_PLAN_MONTHLY (no longer needed)");
    console.log("\n═══════════════════════════════════════");
  }
}

main();
