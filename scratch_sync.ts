import { PrismaClient } from "@prisma/client";
import { runGitHubSync } from "c:/Coding/oga-dashboard/src/lib/github-sync";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Factory Reset...");
  
  // Wipe all data
  await prisma.issue.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.repository.deleteMany();
  await prisma.team.deleteMany();
  await prisma.contributor.deleteMany();
  await prisma.organization.deleteMany();

  console.log("Database wiped. Configuring 90-day backfill...");
  
  // Ensure SystemState exists and is set to 90 days
  await prisma.systemState.upsert({
    where: { id: 1 },
    update: { syncLookbackDays: 90 },
    create: { id: 1, syncLookbackDays: 90 }
  });

  console.log("Starting 90-day GitHub Sync (this will take 2-4 minutes)...");
  
  const result = await runGitHubSync();
  
  console.log("Sync Complete!", result);
}

main()
  .catch(e => {
    console.error("Error during sync:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
