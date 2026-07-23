// src/app/api/sync/route.ts
import { NextResponse } from "next/server";
import { runGitHubSync } from "@/lib/github-sync";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Note: For Phase 1, we can optionally check an Authorization header 
    // to protect this route from spam, e.g. a CRON_SECRET.
    // We'll skip strict auth for local testing right now.

    const result = await runGitHubSync();
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
