import { Request, Response } from "express";
import { shippingAccountRepository } from "../repositories/shipping-account.repository";

export class ShippingAccountController {
  /** GET /api/shipping-accounts — org-level accounts */
  static async listOrg(req: Request, res: Response) {
    const accounts = await shippingAccountRepository.getOrgAccounts();
    res.json(accounts);
  }

  /** GET /api/shipping-accounts/company/:companyId — client accounts */
  static async listByCompany(req: Request, res: Response) {
    const accounts = await shippingAccountRepository.getByCompany(req.params.companyId);
    res.json(accounts);
  }

  /** POST /api/shipping-accounts */
  static async create(req: Request, res: Response) {
    const { insertShippingAccountSchema } = await import("@shared/schema");
    const validated = insertShippingAccountSchema.parse(req.body);
    const account = await shippingAccountRepository.create(validated);
    res.status(201).json(account);
  }

  /** PUT /api/shipping-accounts/:id */
  static async update(req: Request, res: Response) {
    const existing = await shippingAccountRepository.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Shipping account not found" });
    }
    const updated = await shippingAccountRepository.update(req.params.id, req.body);
    res.json(updated);
  }

  /** DELETE /api/shipping-accounts/:id (soft delete) */
  static async delete(req: Request, res: Response) {
    const existing = await shippingAccountRepository.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Shipping account not found" });
    }
    await shippingAccountRepository.softDelete(req.params.id);
    res.status(204).send();
  }
}
