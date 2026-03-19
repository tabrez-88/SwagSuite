import type { Request, Response } from "express";
import { leadService } from "../services/lead.service";
import { createLeadRequest, updateLeadRequest } from "../requests/lead.request";

export class LeadController {
  static async list(req: Request, res: Response) {
    const leads = await leadService.getAll();
    res.json(leads);
  }

  static async create(req: Request, res: Response) {
    const data = createLeadRequest.parse(req.body);
    const lead = await leadService.create(data);
    res.status(201).json(lead);
  }

  static async update(req: Request, res: Response) {
    const data = updateLeadRequest.parse(req.body);
    const updated = await leadService.update(req.params.id, data);
    if (!updated) {
      return res.status(404).json({ message: "Lead not found" });
    }
    res.json(updated);
  }

  static async delete(req: Request, res: Response) {
    await leadService.delete(req.params.id);
    res.status(204).send();
  }

  static async leadSourceReport(req: Request, res: Response) {
    const results = await leadService.getLeadSourceReport();
    res.json(results);
  }
}
