import "server-only";
import { z } from "zod";

/**
 * Server-side environment schema. These values NEVER reach the browser — they
 * are only read inside Next.js route handlers (the secure proxy layer).
 *
 * Every key is optional: the app must degrade gracefully to cached/fallback
 * data when a key is missing, so the core experience works with zero config.
 */
const EnvSchema = z.object({
  NASA_API_KEY: z.string().optional(),
  N2YO_API_KEY: z.string().optional(),
  OPENWEATHER_API_KEY: z.string().optional(),
  SPACETRACK_USER: z.string().optional(),
  SPACETRACK_PASS: z.string().optional(),
  IPGEO_API_KEY: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

export const env = parsed.success ? parsed.data : ({} as z.infer<typeof EnvSchema>);

/** NASA falls back to the public DEMO_KEY (rate-limited but keyless). */
export const nasaKey = () => env.NASA_API_KEY?.trim() || "DEMO_KEY";

export const hasKey = {
  nasa: () => Boolean(env.NASA_API_KEY?.trim()),
  n2yo: () => Boolean(env.N2YO_API_KEY?.trim()),
  openweather: () => Boolean(env.OPENWEATHER_API_KEY?.trim()),
  spacetrack: () =>
    Boolean(env.SPACETRACK_USER?.trim() && env.SPACETRACK_PASS?.trim()),
  ipgeo: () => Boolean(env.IPGEO_API_KEY?.trim()),
};
