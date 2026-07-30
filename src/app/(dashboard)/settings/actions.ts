"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  const lookback = parseInt(formData.get("syncLookbackDays")?.toString() || "30", 10);
  const autoSyncFrequency = formData.get("autoSyncFrequency")?.toString() || "manual";

  const currentState = await prisma.systemState.findUnique({ where: { id: 1 } });
  let resetSync = false;
  if (currentState && currentState.syncLookbackDays !== lookback) {
    resetSync = true;
  }

  await prisma.systemState.upsert({
    where: { id: 1 },
    update: {
      syncLookbackDays: isNaN(lookback) ? 30 : lookback,
      autoSyncFrequency,
      ...(resetSync ? { lastSyncAt: new Date(0) } : {})
    },
    create: {
      id: 1,
      syncLookbackDays: isNaN(lookback) ? 30 : lookback,
      autoSyncFrequency,
      lastSyncAt: new Date(0),
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function purgeData() {
  // Purges all synced data but keeps the organization, teams, and system state
  await prisma.contribution.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.repository.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.contributor.deleteMany();

  // Reset sync stats
  await prisma.systemState.update({
    where: { id: 1 },
    data: {
      lastSyncAt: new Date(0), // reset
    }
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function factoryReset() {
  // Wipes EVERYTHING
  await prisma.contribution.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.repository.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.contributor.deleteMany();
  await prisma.team.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.systemState.deleteMany();

  revalidatePath("/", "layout");
  return { success: true };
}
