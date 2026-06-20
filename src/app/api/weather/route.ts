import { NextResponse } from "next/server";
import { z } from "zod";
import { getConditions } from "@/lib/providers/openweather";

export const revalidate = 900;

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

/** GET /api/weather?lat=..&lon=.. — observing conditions (cloud, visibility). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = Query.safeParse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }
  const conditions = await getConditions(parsed.data.lat, parsed.data.lon);
  return NextResponse.json(conditions, {
    headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
  });
}
