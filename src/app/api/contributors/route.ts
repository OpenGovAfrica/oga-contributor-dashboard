// src/app/api/contributors/route.ts
import { NextRequest } from "next/server";
import { ContributorQuerySchema } from "@/lib/zod-schemas";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getContributorLeaderboard } from "@/features/contributors/queries";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = ContributorQuerySchema.safeParse(params);
    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const { page, limit, team, sortBy, window, mode } = parsed.data;
    const result = await getContributorLeaderboard({
      page,
      limit,
      teamSlug: team,
      sortBy,
      window,
      mode,
    });

    return successResponse(result);
  } catch (error) {
    console.error("[/api/contributors]", error);
    return errorResponse("Internal server error", 500);
  }
}
