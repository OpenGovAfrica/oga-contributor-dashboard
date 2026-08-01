// src/app/api/sync/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runGitHubSync } from "@/lib/github-sync";
import prisma from "@/lib/prisma";

export const maxDuration = 60; // Extend Vercel Hobby timeout to maximum 60 seconds

export async function POST(req: Request) {
  try {
    // TODO(v2): Implement strict CRON_SECRET authorization headers to prevent unauthenticated trigger spam.
    // For local MVP execution, bypassing auth block.

    const result = await runGitHubSync();
    
    // Purge the entire Next.js Router Cache globally so the dashboard instantly shows fresh data
    revalidatePath("/", "layout");

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[API] Sync error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const state = await prisma.systemState.findUnique({
      where: { id: 1 },
    });
    return NextResponse.json({ success: true, state }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
