import { z } from "zod";
import { requestTypes } from "@/lib/requests/constants";

const locationSourceSchema = z.enum(["gps", "manual"]);

export const requestHelpSchema = z.object({
  request_type: z.enum(requestTypes),
  request_detail: z.string().trim().min(1).max(60),
  request_detail_label: z.string().trim().max(120).optional(),
  governorate: z.string().trim().min(2).max(40),
  address_detail: z.string().trim().min(8).max(220),
  location_source: locationSourceSchema,
  location_lat: z.coerce.number().min(-90).max(90).optional(),
  location_lng: z.coerce.number().min(-180).max(180).optional(),
  location_accuracy_m: z.coerce.number().int().min(0).max(100000).optional(),
  location_display_name: z.string().trim().max(400).optional(),
  description: z.string().trim().min(30).max(2200),
}).superRefine((val, ctx) => {
  if (val.location_source === "gps") {
    if (typeof val.location_lat !== "number" || typeof val.location_lng !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location_lat"],
        message: "GPS location is required (lat/lng).",
      });
    }
  }
});

export type RequestHelpInput = z.infer<typeof requestHelpSchema>;
