import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Vercel secures cron routes automatically by passing an Authorization header matching your CRON_SECRET.
    // If you haven't set CRON_SECRET in Vercel, this will still run successfully for keeping the DB awake.
    
    // Execute a fast, non-destructive query to prevent Supabase from pausing the database.
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ success: true, message: "Database keep-alive successful" }, { status: 200 });
  } catch (error) {
    console.error("[CRON] Database keep-alive failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
