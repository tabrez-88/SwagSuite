import { z } from "zod";

export const createCardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  companyId: z.string().optional(),
  orderId: z.string().optional(),
  assignedUserId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().optional(),
});

export const createColumnSchema = z.object({
  name: z.string().min(1, "Column name is required"),
  color: z.string().default("#3b82f6"),
});

export type CreateCardFormData = z.infer<typeof createCardSchema>;
export type CreateColumnFormData = z.infer<typeof createColumnSchema>;
