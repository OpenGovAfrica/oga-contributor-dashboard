// src/app/api/activity/route.ts
import { NextRequest } from "next/server";
import { ActivityQuerySchema } from "@/lib/zod-schemas";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getActivityFunnelPayload } from "@/features/activity/queries";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = ActivityQuerySchema.safeParse(params);
    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const { window, team } = parsed.data;
    const result = await getActivityFunnelPayload(window, team);

    return successResponse(result);
  } catch (error) {
    console.error("[/api/activity]", error);
    return errorResponse("Internal server error", 500);
  }
}
