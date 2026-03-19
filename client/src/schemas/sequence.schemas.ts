import { z } from "zod";

export const sequenceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "archived"]).default("draft"),
  automation: z.number().min(0).max(100).default(100),
  unenrollCriteria: z.string().optional(),
  settings: z.string().optional(),
});

export const stepFormSchema = z.object({
  type: z.enum(["email", "task", "call", "linkedin_message"]),
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  delayDays: z.number().min(0).default(1),
  delayHours: z.number().min(0).max(23).default(0),
  delayMinutes: z.number().min(0).max(59).default(0),
  position: z.number().min(1),
  settings: z.string().optional(),
});

export type SequenceFormData = z.infer<typeof sequenceFormSchema>;
export type StepFormData = z.infer<typeof stepFormSchema>;
