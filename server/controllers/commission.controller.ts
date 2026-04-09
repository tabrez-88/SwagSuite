import type { Request, Response } from "express";
import { commissionService } from "../services/commission.service";

export class CommissionController {
  /** GET /api/reports/commissions?from=&to= */
  static async getReport(req: Request, res: Response) {
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    const report = await commissionService.getReport(from, to);
    res.json(report);
  }

  /** PATCH /api/users/:id/commission — set commission percent */
  static async setCommission(req: Request, res: Response) {
    const { id } = req.params;
    const { commissionPercent } = req.body;
    if (commissionPercent == null || isNaN(Number(commissionPercent))) {
      return res.status(400).json({ message: "commissionPercent is required (number)" });
    }
    await commissionService.setCommissionPercent(id, Number(commissionPercent));
    res.json({ success: true });
  }
}
