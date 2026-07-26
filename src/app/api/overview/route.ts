// src/app/api/overview/route.ts
import { NextRequest } from "next/server";
import { OverviewQuerySchema } from "@/lib/zod-schemas";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getOrgKPIs, getVelocityTrend, getTeamDistribution } from "@/features/overview/queries";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = OverviewQuerySchema.safeParse(params);
    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const { window, team } = parsed.data;
    const [kpis, velocityTrend, teamDistribution] = await Promise.all([
      getOrgKPIs(window),
      getVelocityTrend(window, team),
      getTeamDistribution(window),
    ]);

    return successResponse({ kpis, velocityTrend, teamDistribution });
  } catch (error) {
    console.error("[/api/overview]", error);
    return errorResponse("Internal server error", 500);
  }
}
