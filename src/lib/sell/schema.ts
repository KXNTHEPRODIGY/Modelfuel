import { z } from "zod";
import { TRAINING_STAGES } from "@/lib/onchain/addresses";

export const sellFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().max(4000).optional().or(z.literal("")),
  price_ip: z.coerce.number().positive("Price must be greater than 0"),
  training_stage: z.enum(TRAINING_STAGES, {
    errorMap: () => ({ message: "Select a training stage" }),
  }),
  duration_days: z.coerce
    .number()
    .int("Whole days only")
    .min(1, "At least 1 day")
    .max(3650, "At most 3650 days"),
});

export type SellFormValues = z.infer<typeof sellFormSchema>;
