// src/app/api/repositories/route.ts
import { NextRequest } from "next/server";
import { RepoQuerySchema } from "@/lib/zod-schemas";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getRepoHealthMatrix } from "@/features/repositories/queries";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = RepoQuerySchema.safeParse(params);
    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const { page, limit, team, sortBy, window } = parsed.data;
    const result = await getRepoHealthMatrix({ page, limit, teamSlug: team, sortBy, window });

    return successResponse(result);
  } catch (error) {
    console.error("[/api/repositories]", error);
    return errorResponse("Internal server error", 500);
  }
}
