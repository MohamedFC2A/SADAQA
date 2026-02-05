import { z } from "zod";
import { requestTypes } from "@/lib/requests/constants";

export const requestHelpSchema = z.object({
  requester_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(20),
  location: z.string().trim().min(10).max(180),
  request_type: z.enum(requestTypes),
  description: z.string().trim().min(30).max(2200),
});

export type RequestHelpInput = z.infer<typeof requestHelpSchema>;
