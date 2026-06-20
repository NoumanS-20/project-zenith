import { NextResponse } from "next/server";
import { getIssNow, getAstros } from "@/lib/providers/iss";

export const revalidate = 5;

/** GET /api/iss — live ISS subpoint + people in space (with fallbacks). */
export async function GET() {
  const [now, astros] = await Promise.all([getIssNow(), getAstros()]);
  return NextResponse.json(
    {
      now, // null => client should propagate NORAD 25544 from TLE
      astros,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30",
      },
    },
  );
}
