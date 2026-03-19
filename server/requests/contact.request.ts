import { z } from "zod";
import { insertContactSchema } from "@shared/schema";

// POST /api/contacts
export const createContactRequest = insertContactSchema;
export type CreateContactRequest = z.infer<typeof createContactRequest>;

// PATCH /api/contacts/:id
export const updateContactRequest = insertContactSchema.partial();
export type UpdateContactRequest = z.infer<typeof updateContactRequest>;
