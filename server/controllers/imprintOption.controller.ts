import type { Request, Response } from "express";
import { z } from "zod";
import { ImprintOptionRepository } from "../repositories/imprintOption.repository";
import { getUserId } from "../utils/getUserId";
import { IMPRINT_OPTION_TYPES } from "@shared/schema";

const typeSchema = z.enum(IMPRINT_OPTION_TYPES);

const createOptionSchema = z.object({
  type: typeSchema,
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(120).optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const updateOptionSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const suggestionSchema = z.object({
  type: typeSchema,
  label: z.string().min(1).max(120),
  suggestedFromOrderId: z.string().optional(),
  note: z.string().max(500).optional(),
});

const rejectSchema = z.object({
  note: z.string().max(500).optional(),
});

export class ImprintOptionController {
  static async list(req: Request, res: Response) {
    const type = req.query.type ? typeSchema.parse(req.query.type) : undefined;
    const includeInactive = req.query.includeInactive === "true";
    const rows = await ImprintOptionRepository.list(type, includeInactive);
    res.json(rows);
  }

  static async create(req: Request, res: Response) {
    const data = createOptionSchema.parse(req.body);
    const row = await ImprintOptionRepository.create(data);
    res.status(201).json(row);
  }

  static async update(req: Request, res: Response) {
    const data = updateOptionSchema.parse(req.body);
    const row = await ImprintOptionRepository.update(req.params.id, data);
    if (!row) return res.status(404).json({ message: "Option not found" });
    res.json(row);
  }

  static async delete(req: Request, res: Response) {
    const existing = await ImprintOptionRepository.getById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Option not found" });
    if (existing.isBuiltIn) {
      return res
        .status(409)
        .json({ message: "Built-in options cannot be deleted. Deactivate it instead." });
    }
    await ImprintOptionRepository.delete(req.params.id);
    res.status(204).send();
  }

  // Suggestions --------------------------------------------------------

  static async listSuggestions(req: Request, res: Response) {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const rows = await ImprintOptionRepository.listSuggestions(status);
    res.json(rows);
  }

  static async pendingCount(_req: Request, res: Response) {
    const count = await ImprintOptionRepository.pendingCount();
    res.json({ count });
  }

  static async createSuggestion(req: Request, res: Response) {
    const data = suggestionSchema.parse(req.body);
    const userId = getUserId(req);
    const result = await ImprintOptionRepository.createSuggestion({
      ...data,
      suggestedBy: userId,
    });
    res.status(result.duplicate ? 200 : 201).json(result);
  }

  static async approveSuggestion(req: Request, res: Response) {
    const userId = getUserId(req);
    const result = await ImprintOptionRepository.approveSuggestion(req.params.id, userId);
    if (!result) return res.status(404).json({ message: "Pending suggestion not found" });
    res.json(result);
  }

  static async rejectSuggestion(req: Request, res: Response) {
    const { note } = rejectSchema.parse(req.body ?? {});
    const userId = getUserId(req);
    const row = await ImprintOptionRepository.rejectSuggestion(req.params.id, userId, note);
    if (!row) return res.status(404).json({ message: "Suggestion not found" });
    res.json(row);
  }
}
