import { NextResponse } from "next/server";
import { getApod } from "@/lib/providers/nasa";

export const revalidate = 3600;

/** GET /api/apod — NASA Astronomy Picture of the Day. */
export async function GET() {
  const data = await getApod();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
