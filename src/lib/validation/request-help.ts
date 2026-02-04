import { z } from "zod";
import { requestTypes, urgencyLevels } from "@/lib/requests/constants";

export const requestHelpSchema = z.object({
  requester_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(20),
  location: z.string().trim().min(2).max(120),
  request_type: z.enum(requestTypes),
  description: z.string().trim().min(20).max(2000),
  urgency_level: z.enum(urgencyLevels).optional(),
});

export type RequestHelpInput = z.infer<typeof requestHelpSchema>;

