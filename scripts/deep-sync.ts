require("dotenv").config({ path: ".env.local" });
// Ensure we fall back to generic .env if .env.local doesn't exist (like in CI)
if (!process.env.DATABASE_URL) {
  require("dotenv").config();
}

const { PrismaClient } = require("@prisma/client");

import { runGitHubSync } from "../src/lib/github-sync";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("🚀 Starting Deep Sync (90-Day Forced Backfill)...");
  const startTime = Date.now();
  
  try {
    const result = await runGitHubSync(true); // true = forceFull
    console.log("✅ Deep Sync completed successfully!");
    console.log("📊 System State:", result.state);
  } catch (error) {
    console.error("❌ Deep Sync Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️  Total execution time: ${duration}s`);
  }
}

main();
