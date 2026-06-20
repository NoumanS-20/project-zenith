import { NextResponse } from "next/server";
import { getSpaceWeather } from "@/lib/providers/nasa";

export const revalidate = 1800;

/** GET /api/spaceweather — NASA DONKI flares/CMEs/storms + aurora outlook. */
export async function GET() {
  const data = await getSpaceWeather();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=7200" },
  });
}
