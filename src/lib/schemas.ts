import { z } from "zod";

/**
 * Zod schemas for validating EXTERNAL responses and our normalized shapes.
 * Anything crossing the network boundary is parsed here before the UI sees it.
 */

export const SatCategorySchema = z.enum([
  "stations",
  "brightest",
  "starlink",
  "navigation",
  "weather",
  "debris",
  "other",
]);

export const TleRecordSchema = z.object({
  name: z.string().min(1),
  noradId: z.number().int().positive(),
  line1: z.string().length(69),
  line2: z.string().length(69),
  category: SatCategorySchema,
});
export type TleRecordParsed = z.infer<typeof TleRecordSchema>;

/** Open-Notify iss-now.json */
export const OpenNotifyIssSchema = z.object({
  message: z.string(),
  timestamp: z.number(),
  iss_position: z.object({
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
  }),
});

/** Open-Notify astros.json (people in space) */
export const OpenNotifyAstrosSchema = z.object({
  message: z.string(),
  number: z.number(),
  people: z.array(z.object({ name: z.string(), craft: z.string() })),
});

/** OpenWeather current weather (subset we use) */
export const OpenWeatherSchema = z.object({
  clouds: z.object({ all: z.number() }).optional(),
  visibility: z.number().optional(),
  weather: z
    .array(z.object({ main: z.string(), description: z.string() }))
    .optional(),
  name: z.string().optional(),
});

/** NASA DONKI notifications/events are loosely typed; validate minimally. */
export const DonkiFlareSchema = z.array(
  z.object({
    flrID: z.string().optional(),
    classType: z.string().optional(),
    beginTime: z.string().optional(),
    peakTime: z.string().optional(),
  }),
);

export const DonkiCmeSchema = z.array(
  z.object({
    activityID: z.string().optional(),
    startTime: z.string().optional(),
    note: z.string().optional(),
  }),
);

export const DonkiGstSchema = z.array(
  z.object({
    gstID: z.string().optional(),
    startTime: z.string().optional(),
    allKpIndex: z
      .array(z.object({ kpIndex: z.number(), observedTime: z.string() }))
      .optional(),
  }),
);

/** NASA APOD */
export const ApodSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  url: z.string().url(),
  hdurl: z.string().url().optional(),
  media_type: z.string(),
  date: z.string(),
  copyright: z.string().optional(),
});

/** N2YO visual passes (subset) */
export const N2yoPassesSchema = z.object({
  info: z.object({ satid: z.number(), passescount: z.number().optional() }),
  passes: z
    .array(
      z.object({
        startUTC: z.number(),
        endUTC: z.number(),
        maxEl: z.number(),
        startAz: z.number(),
        endAz: z.number(),
        mag: z.number().optional(),
        duration: z.number().optional(),
      }),
    )
    .optional(),
});
