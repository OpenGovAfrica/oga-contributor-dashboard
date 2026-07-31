import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json({ repos: [], contributors: [], issues: [] });
    }

    // Query repos, contributors, and issues containing the query string
    const [repos, contributors, issues] = await Promise.all([
      prisma.repository.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        take: 3,
        select: { id: true, name: true, nameWithOwner: true },
      }),
      prisma.contributor.findMany({
        where: {
          OR: [
            { githubLogin: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 3,
        select: { id: true, githubLogin: true, name: true, avatarUrl: true },
      }),
      prisma.issue.findMany({
        where: { title: { contains: q, mode: "insensitive" } },
        take: 3,
        select: { id: true, title: true, githubNumber: true, repository: { select: { name: true } } },
      }),
    ]);

    return NextResponse.json({ repos, contributors, issues });
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
